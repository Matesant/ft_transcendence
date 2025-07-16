import { GameMode } from "./GameMode";
import { MatchInfo } from "./MatchInfo";

export class MultiplayerManager {
    private _socket: WebSocket | null = null;
    private _roomId: string | null = null;
    private _playerSide: 'left' | 'right' | null = null;
    private _gameMode: GameMode = GameMode.SINGLE_PLAYER;
    private _multiplayerSelectedMode: 'classic' | 'powerup' | null = null;
    private _player1Name: string = "Player 1";
    private _playerSideCallback: ((side: 'left' | 'right' | null) => void) | null = null;
    private _modeSelectedCallback: ((mode: 'classic' | 'powerup') => void) | null = null;

    constructor() {}

    public setupMultiplayer(isHost: boolean, player1Name: string, onModeSelected: (mode: 'classic' | 'powerup') => void, onPlayerSide: (side: 'left' | 'right' | null) => void, onRoomId?: (roomId: string) => void): void {
        this._player1Name = player1Name;
        this._modeSelectedCallback = onModeSelected;
        this._playerSideCallback = onPlayerSide;
        if (isHost) {
            fetch('http://localhost:3004/create-room')
                .then(response => response.json())
                .then(data => {
                    this._roomId = data.roomId;
                    if (onRoomId) onRoomId(this._roomId);
                    // UI para host escolher modo
                })
                .catch(error => {
                    alert("Failed to create room. Check console for details.");
                });
        } else {
            const roomId = prompt('Enter Room ID:');
            if (roomId) {
                this._roomId = roomId;
                this.connectToGameServer();
            }
        }
    }

    public connectToGameServer(): void {
        if (!this._roomId) return;
        this._socket = new WebSocket(`ws://localhost:3004/game/${this._roomId}`);
        this._socket.addEventListener("open", () => {
            if (this._gameMode === GameMode.MULTIPLAYER_HOST && this._multiplayerSelectedMode) {
                this._socket!.send(JSON.stringify({
                    type: 'MODE_SELECTED',
                    mode: this._multiplayerSelectedMode
                }));
            }
            this._socket!.send(JSON.stringify({
                type: "JOIN",
                player: {
                    name: this._player1Name,
                    side: this._playerSide
                }
            }));
        });
        this._socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            this.handleSocketMessage(data);
        });
        this._socket.addEventListener("close", () => {
            console.log("Disconnected from game server");
            this._socket = null;
        });
        this._socket.addEventListener("error", (error) => {
            console.error("WebSocket error:", error);
        });
    }

    public handleSocketMessage(data: any): void {
        switch (data.type) {
            case 'MODE_SELECTED':
                if (this._modeSelectedCallback) this._modeSelectedCallback(data.mode);
                this._multiplayerSelectedMode = data.mode;
                break;
            case 'GAME_START':
                if (this._modeSelectedCallback) this._modeSelectedCallback(this._multiplayerSelectedMode!);
                break;
            case 'JOINED':
                this._playerSide = data.side;
                if (this._playerSideCallback) this._playerSideCallback(data.side);
                break;
            case 'PLAYER_LEFT':
                alert('Other player disconnected');
                break;
            case 'ERROR':
                alert(`Error: ${data.message}`);
                break;
            default:
                console.warn('Unknown message type:', data);
        }
    }

    // Getters e setters
    public get socket() { return this._socket; }
    public get roomId() { return this._roomId; }
    public get playerSide() { return this._playerSide; }
    public get gameMode() { return this._gameMode; }
    public get multiplayerSelectedMode() { return this._multiplayerSelectedMode; }
    public set gameMode(mode: GameMode) {
        this._gameMode = mode;
    }
}
