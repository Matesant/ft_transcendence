import { Scene } from "@babylonjs/core";
import { Ball } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { FieldManager } from "./FieldManager";
import { GameStateManager, GameState } from "./GameStateManager";
import { NetworkManager } from "./NetworkManager";
import { Language } from "../../i18n";
import { apiUrl } from "../../../utils/api";
import { getCurrentUser } from "../../../utils/userUtils";

export class RemoteGameManager {
    private _scene: Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _fieldManager: FieldManager;
    private _gameStateManager: GameStateManager;
    private _networkManager: NetworkManager;
    private _existingSocket?: WebSocket;
    private _skipMenu: boolean = false;
    
    // UI Elements
    private _menuUI: HTMLDivElement;
    private _gameUI: HTMLDivElement;
    private _statusUI: HTMLDivElement;
    
    // Game state
    private _myPaddle: Paddle | null = null;
    private _opponentPaddle: Paddle | null = null;
    private _playerSide: 'left' | 'right' | null = null;
    private _opponentInfo: { id: string; name: string } | null = null;
    
    // Network interpolation for smooth gameplay
    private _interpolationBuffer: any[] = [];
    private _lastServerState: any = null;
    private _serverStateTime: number = 0;
    
    // Status timer management
    private _statusTimer: NodeJS.Timeout | null = null;
    
    // User info (would normally come from auth service)
    private _playerId: string;
    private _playerName: string;
    private _onGameStarted?: () => void;

    constructor(
        scene: Scene,
        playerId: string,
        playerName: string,
        onGameStarted?: () => void,
        options?: { socket?: WebSocket; skipMenu?: boolean; playerSide?: 'left' | 'right'; opponent?: { id: string; name: string }; gameId?: string }
    ) {
        this._scene = scene;
        this._playerId = playerId;
        this._playerName = playerName;
        this._onGameStarted = onGameStarted;

        this._existingSocket = options?.socket;
        this._skipMenu = options?.skipMenu ?? false;

        if (options?.playerSide) {
            this._playerSide = options.playerSide;
        }
        if (options?.opponent) {
            this._opponentInfo = options.opponent;
        }
        
        this._scoreManager = new ScoreManager();
        this._inputManager = new InputManager();
        this._gameStateManager = new GameStateManager();
        this._networkManager = new NetworkManager();

        // Initialize game objects
        this._ball = new Ball(scene);
        this._leftPaddle = new Paddle(scene, PaddleType.LEFT);
        this._rightPaddle = new Paddle(scene, PaddleType.RIGHT);
        new Wall(scene, WallType.TOP);
        new Wall(scene, WallType.BOTTOM);

        // Create playing field
        this._fieldManager = new FieldManager(scene);

        // Setup UI
        this._createUI();

        // Setup network event handlers
        this._setupNetworkHandlers();

        // Initialize player info if provided (lobby integration)
        if (this._playerSide && this._opponentInfo) {
            this._handleMatchFound({ playerSide: this._playerSide, opponent: this._opponentInfo });
        }

        if (this._skipMenu) {
            this._networkManager.connect(this._playerId, this._playerName, this._existingSocket).then(() => {
                if (options?.gameId) {
                    this._networkManager.setGameId(options.gameId);
                    this._handleGameStart({});
                } else {
                    this._showStatus('Waiting for game start...', 'info');
                }
            });
        } else {
            // Show menu initially
            this._showMenu();
        }
    }

    private _createUI(): void {
        if (!this._skipMenu) {
            this._createMenuUI();
        }
        this._createGameUI();
        this._createStatusUI();
    }

    private _createMenuUI(): void {
        this._menuUI = document.createElement("div");
        this._menuUI.style.position = "absolute";
        this._menuUI.style.top = "0";
        this._menuUI.style.left = "0";
        this._menuUI.style.width = "100%";
        this._menuUI.style.height = "100%";
        this._menuUI.style.display = "flex";
        this._menuUI.style.flexDirection = "column";
        this._menuUI.style.justifyContent = "center";
        this._menuUI.style.alignItems = "center";
        this._menuUI.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this._menuUI.style.zIndex = "1000";
        
        const title = document.createElement("h1");
        title.textContent = "MULTIPLAYER PONG";
        title.style.color = "white";
        title.style.fontSize = "48px";
        title.style.marginBottom = "30px";
        title.style.textAlign = "center";
        
        const playerInfo = document.createElement("div");
        playerInfo.textContent = `Welcome, ${this._playerName}!`;
        playerInfo.style.color = "white";
        playerInfo.style.fontSize = "20px";
        playerInfo.style.marginBottom = "30px";
        
        const connectButton = document.createElement("button");
        connectButton.textContent = "Connect & Find Match";
        connectButton.style.padding = "15px 30px";
        connectButton.style.fontSize = "20px";
        connectButton.style.cursor = "pointer";
        connectButton.style.backgroundColor = "#4CAF50";
        connectButton.style.border = "none";
        connectButton.style.borderRadius = "8px";
        connectButton.style.color = "white";
        connectButton.style.marginBottom = "20px";
        
        const backButton = document.createElement("button");
        backButton.textContent = "Back to Local Game";
        backButton.style.padding = "10px 20px";
        backButton.style.fontSize = "16px";
        backButton.style.cursor = "pointer";
        backButton.style.backgroundColor = "#f44336";
        backButton.style.border = "none";
        backButton.style.borderRadius = "5px";
        backButton.style.color = "white";
        
        connectButton.addEventListener("click", () => {
            this._connectAndFindMatch();
        });
        
        backButton.addEventListener("click", () => {
            // This would switch back to local game mode
            window.location.reload(); // Simple way for now
        });
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(playerInfo);
        this._menuUI.appendChild(connectButton);
        this._menuUI.appendChild(backButton);
        document.body.appendChild(this._menuUI);
    }

    private _createGameUI(): void {
        this._gameUI = document.createElement("div");
        this._gameUI.style.position = "absolute";
        this._gameUI.style.top = "20px";
        this._gameUI.style.left = "20px";
        this._gameUI.style.right = "20px";
        this._gameUI.style.color = "white";
        this._gameUI.style.fontSize = "18px";
        this._gameUI.style.display = "none";
        this._gameUI.style.zIndex = "999";
        this._gameUI.style.pointerEvents = "none";
        
        const gameInfo = document.createElement("div");
        gameInfo.id = "remoteGameInfo";
        gameInfo.style.textAlign = "center";
        gameInfo.style.marginBottom = "10px";
        
        this._gameUI.appendChild(gameInfo);
        document.body.appendChild(this._gameUI);
    }

    private _createStatusUI(): void {
        this._statusUI = document.createElement("div");
        this._statusUI.style.position = "absolute";
        this._statusUI.style.top = "50%";
        this._statusUI.style.left = "50%";
        this._statusUI.style.transform = "translate(-50%, -50%)";
        this._statusUI.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this._statusUI.style.color = "white";
        this._statusUI.style.padding = "20px";
        this._statusUI.style.borderRadius = "8px";
        this._statusUI.style.textAlign = "center";
        this._statusUI.style.fontSize = "18px";
        this._statusUI.style.display = "none";
        this._statusUI.style.zIndex = "1001";
        
        document.body.appendChild(this._statusUI);
    }

    private _setupNetworkHandlers(): void {
        this._networkManager.onMatchFound((data) => {
            this._handleMatchFound(data);
        });
        
        this._networkManager.onGameStart((data) => {
            this._handleGameStart(data);
        });
        
        this._networkManager.onGameState((state) => {
            this._handleGameState(state);
        });
        
        this._networkManager.onScore((data) => {
            this._handleScore(data);
        });
        
        this._networkManager.onGameEnd((data) => {
            this._handleGameEnd(data);
        });
        
        this._networkManager.onOpponentDisconnected((data) => {
            this._handleOpponentDisconnected(data);
        });
        
        this._networkManager.onError((error) => {
            this._showStatus(`Network Error: ${error}`, "error");
        });
    }

    private async _connectAndFindMatch(): Promise<void> {
        try {
            this._showStatus("Connecting to server...", "info");

            await this._networkManager.connect(this._playerId, this._playerName, this._existingSocket);
            
            this._showStatus("Searching for opponent...", "info");
            this._networkManager.joinQueue();
            
        } catch (error) {
            console.error('Connection failed:', error);
            this._showStatus("Failed to connect to server", "error");
        }
    }

    private _handleMatchFound(data: any): void {
        this._playerSide = data.playerSide;
        this._opponentInfo = data.opponent;
        
        // Set up paddle references
        if (this._playerSide === 'left') {
            this._myPaddle = this._leftPaddle;
            this._opponentPaddle = this._rightPaddle;
        } else {
            this._myPaddle = this._rightPaddle;
            this._opponentPaddle = this._leftPaddle;
        }
        
        this._showStatus(`Match found! Playing against ${this._opponentInfo.name}`, "success");
    }

    private _handleGameStart(data: any): void {
        this._gameStateManager.setState(GameState.PLAYING);
        this._hideStatus();
        this._hideMenu();
        this._showGame();
        
        // Notify that the game has actually started
        if (this._onGameStarted) {
            this._onGameStarted();
        }
        
        // Initialize score manager with player names
        this._scoreManager.setPlayerNames(
            this._playerSide === 'left' ? this._playerName : this._opponentInfo!.name,
            this._playerSide === 'right' ? this._playerName : this._opponentInfo!.name
        );
        
        console.log("Game started!");
    }

    private _handleGameState(state: any): void {
        // Store server state for interpolation
        this._lastServerState = state;
        this._serverStateTime = Date.now();
        
        // Update game objects immediately (we can add interpolation later)
        this._updateGameObjectsFromServer(state);
    }

    private _updateGameObjectsFromServer(state: any): void {
        // Update ball position
        if (this._ball && state.ball) {
            this._ball.mesh.position.x = state.ball.x;
            this._ball.mesh.position.z = state.ball.z;
        }
        
        // Update paddle positions
        if (this._leftPaddle && state.paddles?.left) {
            this._leftPaddle.mesh.position.x = state.paddles.left.x;
        }
        
        if (this._rightPaddle && state.paddles?.right) {
            this._rightPaddle.mesh.position.x = state.paddles.right.x;
        }
        
        // Update score
        if (state.score) {
            this._scoreManager.setScore(state.score.player1, state.score.player2);
        }
    }

    private _handleScore(data: any): void {
        console.log("Score!", data);
        // Score is updated via game state, but we could add effects here
    }

    private _handleGameEnd(data: any): void {
        this._gameStateManager.setState(GameState.GAME_OVER);
        
        const isWinner = data.winner.id === this._playerId;
        const message = isWinner ? 
            `🎉 You Win! 🎉\nFinal Score: ${data.finalScore.player1} - ${data.finalScore.player2}` :
            `You Lose!\nFinal Score: ${data.finalScore.player1} - ${data.finalScore.player2}`;
        
        this._showStatus(message, isWinner ? "success" : "error", true);

        // Send match history to user-service
        this._submitMatchHistory(data);
    }

    private async _submitMatchHistory(gameEndData: any): Promise<void> {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                console.warn('Cannot submit match history: user not authenticated');
                return;
            }

            const isWinner = gameEndData.winner.id === this._playerId;
            const opponentName = this._opponentInfo?.name || 'Unknown';

            // Submit history for current user
            await fetch(apiUrl(3003, '/users/history'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    alias: currentUser.alias,
                    opponent: opponentName,
                    result: isWinner ? 'win' : 'loss',
                    date: new Date().toISOString()
                })
            });

            console.log('Match history submitted successfully');
        } catch (error) {
            console.error('Failed to submit match history:', error);
        }
    }

    private _handleOpponentDisconnected(data: any): void {
        this._showStatus(`${data.message}\nYou win by default!`, "warning", true);
        
        // Submit match history for disconnection win
        this._submitDisconnectionHistory();
    }

    private async _submitDisconnectionHistory(): Promise<void> {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                console.warn('Cannot submit match history: user not authenticated');
                return;
            }

            const opponentName = this._opponentInfo?.name || 'Unknown';

            // Submit history for current user (win by opponent disconnection)
            await fetch(apiUrl(3003, '/users/history'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    alias: currentUser.alias,
                    opponent: opponentName,
                    result: 'wo', // walkover
                    date: new Date().toISOString()
                })
            });

            console.log('Disconnection match history submitted successfully');
        } catch (error) {
            console.error('Failed to submit disconnection match history:', error);
        }
    }

    private _showMenu(): void {
        if (this._menuUI) {
            this._menuUI.style.display = "flex";
        }
        this._gameUI.style.display = "none";
    }

    private _hideMenu(): void {
        if (this._menuUI) {
            this._menuUI.style.display = "none";
        }
    }

    private _showGame(): void {
        this._gameUI.style.display = "block";
    }

    private _showStatus(message: string, type: "info" | "success" | "error" | "warning", persistent: boolean = false): void {
        this._statusUI.textContent = message;
        this._statusUI.style.display = "block";
        
        // Reset countdown styles
        this._statusUI.style.fontSize = "18px";
        this._statusUI.style.fontWeight = "normal";
        this._statusUI.style.border = "none";
        this._statusUI.style.padding = "20px";
        
        // Color based on type
        switch (type) {
            case "success":
                this._statusUI.style.backgroundColor = "rgba(76, 175, 80, 0.9)";
                break;
            case "error":
                this._statusUI.style.backgroundColor = "rgba(244, 67, 54, 0.9)";
                break;
            case "warning":
                this._statusUI.style.backgroundColor = "rgba(255, 152, 0, 0.9)";
                break;
            default:
                this._statusUI.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        }
        
        // Clear any existing status timer to prevent multiple timers
        if (this._statusTimer) {
            clearTimeout(this._statusTimer);
            this._statusTimer = null;
        }
        
        if (!persistent) {
            this._statusTimer = setTimeout(() => {
                this._hideStatus();
                this._statusTimer = null;
            }, 1000); // Reduzido de 3000 para 1000
        }
    }

    private _hideStatus(): void {
        this._statusUI.style.display = "none";
    }

    public update(): void {
        if (this._gameStateManager.isPlaying()) {
            this._handleInput();
        }
    }

    private _handleInput(): void {
        if (!this._networkManager.connected || !this._myPaddle) return;
        
        // Send input to server
        if (this._inputManager.isKeyPressed("arrowleft")) {
            this._networkManager.sendInput("move_left");
        }
        if (this._inputManager.isKeyPressed("arrowright")) {
            this._networkManager.sendInput("move_right");
        }
    }

    public disconnect(): void {
        // Clear any pending status timer
        if (this._statusTimer) {
            clearTimeout(this._statusTimer);
            this._statusTimer = null;
        }
        
        this._networkManager.disconnect();
    }
}
