export class NetworkManager {
    private _socket: WebSocket | null = null;
    private _connected: boolean = false;
    private _playerId: string | null = null;
    private _playerName: string | null = null;
    private _gameId: string | null = null;
    private _playerSide: 'left' | 'right' | null = null;
    
    // Event handlers
    private _onGameState: ((state: any) => void) | null = null;
    private _onGameStart: ((data: any) => void) | null = null;
    private _onGameEnd: ((data: any) => void) | null = null;
    private _onScore: ((data: any) => void) | null = null;
    private _onOpponentDisconnected: ((data: any) => void) | null = null;
    private _onError: ((error: string) => void) | null = null;
    
    // Network optimization
    private _lastInputSent: number = 0;
    private _inputThrottle: number = 16; // ~60 FPS
    private _pingInterval: NodeJS.Timeout | null = null;
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this._handleMessage = this._handleMessage.bind(this);
        this._handleOpen = this._handleOpen.bind(this);
        this._handleClose = this._handleClose.bind(this);
        this._handleError = this._handleError.bind(this);
    }

    public connect(playerId: string, playerName: string, existingSocket?: WebSocket): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._connected) {
                resolve();
                return;
            }

            this._playerId = playerId;
            this._playerName = playerName;

            try {
                if (existingSocket) {
                    this._socket = existingSocket;
                    this._socket.addEventListener('message', this._handleMessage);
                    this._socket.addEventListener('close', this._handleClose);
                    this._socket.addEventListener('error', this._handleError);

                    if (this._socket.readyState === WebSocket.OPEN) {
                        this._handleOpen();
                        resolve();
                    } else {
                        this._socket.addEventListener('open', () => {
                            this._handleOpen();
                            resolve();
                        }, { once: true });
                    }
                } else {
                    const host = window.location.hostname;
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    const wsUrl = process.env.NODE_ENV === 'production'
                        ? 'wss://your-domain.com/ws'
                        : `${protocol}//${host}:3004/ws`;

                    this._socket = new WebSocket(wsUrl);

                    this._socket.addEventListener('open', () => {
                        this._handleOpen();
                        resolve();
                    });

                    this._socket.addEventListener('message', this._handleMessage);
                    this._socket.addEventListener('close', this._handleClose);
                    this._socket.addEventListener('error', (event) => {
                        this._handleError(event);
                        reject(new Error('WebSocket connection failed'));
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    public disconnect(): void {
        if (this._socket) {
            this._socket.close();
        }
        this._cleanup();
    }

    public sendInput(action: string): void {
        if (!this._connected || !this._playerId || !this._gameId) return;

        const now = Date.now();
        if (now - this._lastInputSent < this._inputThrottle) return;

        this._send({
            type: 'game_input',
            playerId: this._playerId,
            input: {
                action: action,
                timestamp: now
            }
        });

        this._lastInputSent = now;
    }

    public onGameState(callback: (state: any) => void): void {
        this._onGameState = callback;
    }

    public onGameStart(callback: (data: any) => void): void {
        this._onGameStart = callback;
    }

    public onGameEnd(callback: (data: any) => void): void {
        this._onGameEnd = callback;
    }

    public onScore(callback: (data: any) => void): void {
        this._onScore = callback;
    }

    public onOpponentDisconnected(callback: (data: any) => void): void {
        this._onOpponentDisconnected = callback;
    }

    public onError(callback: (error: string) => void): void {
        this._onError = callback;
    }

    public get connected(): boolean {
        return this._connected;
    }

    public get gameId(): string | null {
        return this._gameId;
    }

    public get playerSide(): 'left' | 'right' | null {
        return this._playerSide;
    }

    public get playerId(): string | null {
        return this._playerId;
    }

    public setGameId(gameId: string): void {
        this._gameId = gameId;
    }

    private _send(data: any): void {
        if (this._socket && this._connected) {
            this._socket.send(JSON.stringify(data));
        }
    }

    private _handleOpen(): void {
        this._connected = true;
        this._reconnectAttempts = 0;
        
        this._startPingPong();
    }

    private _handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'game_start':
                    if (data.gameId) {
                        this._gameId = data.gameId;
                    }
                    if (this._onGameStart) {
                        this._onGameStart(data);
                    }
                    break;

                case 'game_state':
                    if (this._onGameState) {
                        this._onGameState(data.state);
                    }
                    break;

                case 'game_end':
                    if (this._onGameEnd) {
                        this._onGameEnd(data);
                    }
                    this._gameId = null;
                    this._playerSide = null;
                    break;

                case 'score':
                    if (this._onScore) {
                        this._onScore(data);
                    }
                    break;

                case 'opponent_disconnected':
                    if (this._onOpponentDisconnected) {
                        this._onOpponentDisconnected(data);
                    }
                    break;

                case 'pong':
                    break;

                case 'error':
                    console.error('Server error:', data.message);
                    if (this._onError) {
                        this._onError(data.message);
                    }
                    break;

                default:
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    private _handleClose(event: CloseEvent): void {
        this._connected = false;
        this._cleanup();
        
        if (event.code !== 1000 && this._reconnectAttempts < this._maxReconnectAttempts) {
            this._attemptReconnect();
        }
    }

    private _handleError(event: Event): void {
        console.error('WebSocket error:', event);
        if (this._onError) {
            this._onError('Connection error');
        }
    }

    private _startPingPong(): void {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
        }

        this._pingInterval = setInterval(() => {
            if (this._connected) {
                this._send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, 30000);
    }

    private _attemptReconnect(): void {
        this._reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 10000);
        
        
        this._reconnectTimeout = setTimeout(() => {
            if (this._playerId && this._playerName) {
                this.connect(this._playerId, this._playerName).catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }
        }, delay);
    }

    private _cleanup(): void {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
        
        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }
        
        this._gameId = null;
        this._playerSide = null;
    }
}
