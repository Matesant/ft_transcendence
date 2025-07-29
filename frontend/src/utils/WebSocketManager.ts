export interface RoomPlayer {
    id: string;
    name: string;
    isHost: boolean;
    ready: boolean;
}

export interface RoomState {
    roomCode: string;
    players: RoomPlayer[];
}

export class WebSocketManager {
    private _socket: WebSocket | null = null;
    private _connected: boolean = false;
    private _playerId: string = '';
    private _playerName: string = '';
    private _currentRoomCode: string = '';
    
    private _onRoomCreated: ((data: RoomState) => void) | null = null;
    private _onRoomUpdated: ((data: RoomState) => void) | null = null;
    private _onRoomError: ((error: string) => void) | null = null;
    private _onGameStarting: ((data: any) => void) | null = null;
    private _onGameEnd: ((data: any) => void) | null = null;
    private _onConnected: (() => void) | null = null;
    private _onDisconnected: (() => void) | null = null;

    constructor() {
        this._playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this._playerName = 'Player'; // Will be updated when user provides name
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._connected) {
                resolve();
                return;
            }

            try {
                const host = window.location.hostname;
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${host}:3004/ws`;
                
                this._socket = new WebSocket(wsUrl);
                
                this._socket.addEventListener('open', () => {
                    this._connected = true;
                    this._onConnected?.();
                    resolve();
                });
                
                this._socket.addEventListener('message', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this._handleMessage(data);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                });
                
                this._socket.addEventListener('close', () => {
                    this._connected = false;
                    this._onDisconnected?.();
                });
                
                this._socket.addEventListener('error', (event) => {
                    console.error('WebSocket error:', event);
                    this._connected = false;
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
        this._connected = false;
    }

    public createRoom(roomCode: string, playerName?: string): void {
        if (!this._connected) {
            console.error('Not connected to server');
            return;
        }

        if (playerName) {
            this._playerName = playerName;
        }

        this._currentRoomCode = roomCode;

        this._send({
            type: 'create_room',
            playerId: this._playerId,
            playerName: this._playerName,
            roomCode: roomCode
        });
    }

    public joinRoom(roomCode: string, playerName?: string): void {
        if (!this._connected) {
            console.error('Not connected to server');
            return;
        }

        if (playerName) {
            this._playerName = playerName;
        }

        this._currentRoomCode = roomCode;

        this._send({
            type: 'join_room',
            playerId: this._playerId,
            playerName: this._playerName,
            roomCode: roomCode
        });
    }

    public leaveRoom(): void {
        if (!this._connected || !this._currentRoomCode) return;

        this._send({
            type: 'leave_room',
            playerId: this._playerId,
            roomCode: this._currentRoomCode
        });

        this._currentRoomCode = '';
    }

    public setReady(ready: boolean): void {
        if (!this._connected || !this._currentRoomCode) return;

        this._send({
            type: 'room_ready',
            playerId: this._playerId,
            roomCode: this._currentRoomCode,
            ready: ready
        });
    }

    private _send(data: any): void {
        if (this._socket && this._connected) {
            this._socket.send(JSON.stringify(data));
        }
    }

    private _handleMessage(data: any): void {

        switch (data.type) {
            case 'room_created':
                this._onRoomCreated?.(data);
                break;
            case 'room_updated':
                this._onRoomUpdated?.(data);
                break;
            case 'room_error':
                this._onRoomError?.(data.message);
                break;
            case 'game_starting':
                this._onGameStarting?.(data);
                break;
            case 'game_end':
                this._onGameEnd?.(data);
                break;
            default:
        }
    }

    public onRoomCreated(callback: (data: RoomState) => void): void {
        this._onRoomCreated = callback;
    }

    public onRoomUpdated(callback: (data: RoomState) => void): void {
        this._onRoomUpdated = callback;
    }

    public onRoomError(callback: (error: string) => void): void {
        this._onRoomError = callback;
    }

    public onGameStarting(callback: (data: any) => void): void {
        this._onGameStarting = callback;
    }

    public onGameEnd(callback: (data: any) => void): void {
        this._onGameEnd = callback;
    }

    public onConnected(callback: () => void): void {
        this._onConnected = callback;
    }

    public onDisconnected(callback: () => void): void {
        this._onDisconnected = callback;
    }

    public get connected(): boolean {
        return this._connected;
    }

    public get playerId(): string {
        return this._playerId;
    }

    public get playerName(): string {
        return this._playerName;
    }

    public get currentRoomCode(): string {
        return this._currentRoomCode;
    }

    public get socket(): WebSocket | null {
        return this._socket;
    }
}
