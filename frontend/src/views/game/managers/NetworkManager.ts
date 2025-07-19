export class NetworkManager {
    private _socket: WebSocket | null = null;
    private _connected: boolean = false;
    private _playerId: string | null = null;
    private _playerName: string | null = null;
    private _gameId: string | null = null;
    private _playerSide: 'left' | 'right' | null = null;
    
    // Event handlers
    private _onMatchFound: ((data: any) => void) | null = null;
    private _onGameState: ((state: any) => void) | null = null;
    private _onGameStart: ((data: any) => void) | null = null;
    private _onGameEnd: ((data: any) => void) | null = null;
    private _onScore: ((data: any) => void) | null = null;
    private _onOpponentDisconnected: ((data: any) => void) | null = null;
    private _onLobbyCreated: ((data: any) => void) | null = null;
    private _onLobbyUpdate: ((data: any) => void) | null = null;
    private _onError: ((error: string) => void) | null = null;
    
    // Network optimization
    private _lastInputSent: number = 0;
    private _inputThrottle: number = 16; // ~60 FPS
    private _pingInterval: NodeJS.Timeout | null = null;
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectTimeout: NodeJS.Timeout | null = null;

    constructor() {
        // Bind methods to preserve 'this' context
        this._handleMessage = this._handleMessage.bind(this);
        this._handleOpen = this._handleOpen.bind(this);
        this._handleClose = this._handleClose.bind(this);
        this._handleError = this._handleError.bind(this);
    }

    public connect(playerId: string, playerName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._connected) {
                resolve();
                return;
            }

            this._playerId = playerId;
            this._playerName = playerName;

            try {
                // Detect the current host and use it for WebSocket connection
                const host = window.location.hostname;
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = process.env.NODE_ENV === 'production' 
                    ? 'wss://your-domain.com/ws'
                    : `${protocol}//${host}:3004/ws`;
                
                console.log(`Connecting to game service at: ${wsUrl}`);
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

    public joinQueue(): void {
        if (!this._connected || !this._playerId || !this._playerName) {
            console.error('Not connected or missing player info');
            return;
        }

        this._send({
            type: 'join_queue',
            playerId: this._playerId,
            playerName: this._playerName
        });
    }

    public leaveQueue(): void {
        if (!this._connected || !this._playerId) return;

        this._send({
            type: 'leave_queue',
            playerId: this._playerId
        });
    }

    public createLobby(): void {
        if (!this._connected || !this._playerId || !this._playerName) return;
        this._send({
            type: 'create_lobby',
            playerId: this._playerId,
            playerName: this._playerName
        });
    }

    public joinLobby(lobbyId: string): void {
        if (!this._connected || !this._playerId || !this._playerName) return;
        this._send({
            type: 'join_lobby',
            lobbyId: lobbyId,
            playerId: this._playerId,
            playerName: this._playerName
        });
    }

    public startLobby(lobbyId: string): void {
        if (!this._connected || !this._playerId) return;
        this._send({
            type: 'start_lobby',
            lobbyId: lobbyId,
            playerId: this._playerId
        });
    }

    public sendInput(action: string): void {
        if (!this._connected || !this._playerId || !this._gameId) return;

        // Throttle input to reduce network traffic
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

    // Event handler setters
    public onMatchFound(callback: (data: any) => void): void {
        this._onMatchFound = callback;
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

    public onLobbyCreated(callback: (data: any) => void): void {
        this._onLobbyCreated = callback;
    }

    public onLobbyUpdate(callback: (data: any) => void): void {
        this._onLobbyUpdate = callback;
    }

    public onError(callback: (error: string) => void): void {
        this._onError = callback;
    }

    // Getters
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

    // Private methods
    private _send(data: any): void {
        if (this._socket && this._connected) {
            this._socket.send(JSON.stringify(data));
        }
    }

    private _handleOpen(): void {
        console.log('WebSocket connected');
        this._connected = true;
        this._reconnectAttempts = 0;
        
        // Start ping/pong for connection health
        this._startPingPong();
    }

    private _handleMessage(event: MessageEvent): void {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            switch (data.type) {
                case 'match_found':
                    this._gameId = data.gameId;
                    this._playerSide = data.playerSide;
                    if (this._onMatchFound) {
                        this._onMatchFound(data);
                    }
                    break;

                case 'game_start':
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

                case 'queue_joined':
                    console.log('Joined queue:', data.message);
                    break;

                case 'queue_left':
                    console.log('Left queue:', data.message);
                    break;

                case 'lobby_created':
                    if (this._onLobbyCreated) {
                        this._onLobbyCreated(data);
                    }
                    break;

                case 'lobby_update':
                    if (this._onLobbyUpdate) {
                        this._onLobbyUpdate(data);
                    }
                    break;

                case 'lobby_error':
                    if (this._onError) {
                        this._onError(data.message);
                    }
                    break;

                case 'pong':
                    // Handle ping/pong for connection health
                    break;

                case 'error':
                    console.error('Server error:', data.message);
                    if (this._onError) {
                        this._onError(data.message);
                    }
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    private _handleClose(event: CloseEvent): void {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this._connected = false;
        this._cleanup();
        
        // Try to reconnect if not intentionally closed
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
        }, 30000); // Ping every 30 seconds
    }

    private _attemptReconnect(): void {
        this._reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this._reconnectAttempts), 10000);
        
        console.log(`Attempting to reconnect (${this._reconnectAttempts}/${this._maxReconnectAttempts}) in ${delay}ms`);
        
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
