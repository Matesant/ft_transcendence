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
import { router } from "../../../router/Router";

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
    
    private _menuUI: HTMLDivElement;
    private _gameUI: HTMLDivElement;
    private _statusUI: HTMLDivElement;
    
    private _myPaddle: Paddle | null = null;
    private _opponentPaddle: Paddle | null = null;
    private _playerSide: 'left' | 'right' | null = null;
    private _opponentInfo: { id: string; name: string } | null = null;
    
    private _interpolationBuffer: any[] = [];
    private _lastServerState: any = null;
    private _serverStateTime: number = 0;
    
    private _statusTimer: NodeJS.Timeout | null = null;
    
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

        this._ball = new Ball(scene);
        this._leftPaddle = new Paddle(scene, PaddleType.LEFT);
        this._rightPaddle = new Paddle(scene, PaddleType.RIGHT);
        new Wall(scene, WallType.TOP);
        new Wall(scene, WallType.BOTTOM);

        this._fieldManager = new FieldManager(scene);

        this._createUI();

        this._setupNetworkHandlers();

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
        this._menuUI.className = "fixed inset-0 flex flex-col justify-center items-center bg-black/80 z-[1000]";
        
        const title = document.createElement("h1");
        title.textContent = "MULTIPLAYER PONG";
        title.className = "text-white text-5xl mb-8 text-center";
        
        const playerInfo = document.createElement("div");
        playerInfo.textContent = `Welcome, ${this._playerName}!`;
        playerInfo.className = "text-white text-xl mb-8";
        
        const connectButton = document.createElement("button");
        connectButton.textContent = "Connect & Find Match";
        connectButton.className = "px-8 py-4 text-xl cursor-pointer bg-green-500 border-none rounded-lg text-white mb-5 hover:bg-green-600 transition-colors";
        
        const backButton = document.createElement("button");
        backButton.textContent = "Back to Local Game";
        backButton.className = "px-5 py-2.5 text-base cursor-pointer bg-red-500 border-none rounded text-white hover:bg-red-600 transition-colors";
        
        connectButton.addEventListener("click", () => {
            this._connectAndFindMatch();
        });
        
        backButton.addEventListener("click", () => {
            window.location.reload();
        });
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(playerInfo);
        this._menuUI.appendChild(connectButton);
        this._menuUI.appendChild(backButton);
        document.body.appendChild(this._menuUI);
    }

    private _createGameUI(): void {
        this._gameUI = document.createElement("div");
        this._gameUI.className = "absolute top-5 left-5 right-5 text-white text-lg hidden z-[999] pointer-events-none";
        
        const gameInfo = document.createElement("div");
        gameInfo.id = "remoteGameInfo";
        gameInfo.className = "text-center mb-2.5";
        
        this._gameUI.appendChild(gameInfo);
        document.body.appendChild(this._gameUI);
    }

    private _createStatusUI(): void {
        this._statusUI = document.createElement("div");
        this._statusUI.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-5 rounded-lg text-center text-lg hidden z-[1001]";
        
        document.body.appendChild(this._statusUI);
    }

    private _setupNetworkHandlers(): void {
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
            
            this._showStatus("Connected to server. Use lobby for matchmaking.", "info");
            
        } catch (error) {
            console.error('Connection failed:', error);
            this._showStatus("Failed to connect to server", "error");
        }
    }

    private _handleMatchFound(data: any): void {
        this._playerSide = data.playerSide;
        this._opponentInfo = data.opponent;
        
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
        
        if (this._onGameStarted) {
            this._onGameStarted();
        }
        
        this._scoreManager.setPlayerNames(
            this._playerSide === 'left' ? this._playerName : this._opponentInfo!.name,
            this._playerSide === 'right' ? this._playerName : this._opponentInfo!.name
        );
        
    }

    private _handleGameState(state: any): void {
        this._lastServerState = state;
        this._serverStateTime = Date.now();
        
        this._updateGameObjectsFromServer(state);
    }

    private _updateGameObjectsFromServer(state: any): void {
        if (this._ball && state.ball) {
            this._ball.mesh.position.x = state.ball.x;
            this._ball.mesh.position.z = state.ball.z;
        }
        
        if (this._leftPaddle && state.paddles?.left) {
            this._leftPaddle.mesh.position.x = state.paddles.left.x;
        }
        
        if (this._rightPaddle && state.paddles?.right) {
            this._rightPaddle.mesh.position.x = state.paddles.right.x;
        }
        
        if (state.score) {
            this._scoreManager.setScore(state.score.player1, state.score.player2);
        }
    }

    private _handleScore(data: any): void {
    }

    private _handleGameEnd(data: any): void {
        this._gameStateManager.setState(GameState.GAME_OVER);
        
        const isWinner = data.winner.id === this._playerId;
        this._showGameOverScreen(isWinner, data.finalScore);

        this._submitMatchHistory(data);
    }

    private _showGameOverScreen(isWinner: boolean, finalScore: any): void {
        this._statusUI.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'text-center p-8';
        
        const title = document.createElement('h1');
        title.textContent = isWinner ? '🎉 You Win! 🎉' : 'You Lose!';
        title.className = `text-4xl mb-5 ${isWinner ? 'text-green-500' : 'text-red-500'}`;
        container.appendChild(title);
        
        const scoreText = document.createElement('div');
        scoreText.textContent = `Final Score: ${finalScore.player1} - ${finalScore.player2}`;
        scoreText.className = 'text-2xl mb-8 text-white';
        container.appendChild(scoreText);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-4 justify-center';
        
        const lobbyButton = document.createElement('button');
        lobbyButton.textContent = '🏠 Voltar para o Lobby';
        lobbyButton.className = 'px-6 py-3 text-base cursor-pointer bg-blue-500 border-none rounded-lg text-white font-bold hover:bg-blue-600 transition-colors duration-300';
        
        lobbyButton.addEventListener('click', () => {
            this.disconnect();
            history.pushState('', '', '/lobby');
            router();
        });
        
        buttonsContainer.appendChild(lobbyButton);
        container.appendChild(buttonsContainer);
        
        this._statusUI.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/95 rounded-2xl max-w-lg z-[1001] border-4 block ${
            isWinner ? 'border-green-500' : 'border-red-500'
        }`;
        
        this._statusUI.appendChild(container);
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

        } catch (error) {
            console.error('Failed to submit match history:', error);
        }
    }

    private _handleOpponentDisconnected(data: any): void {
        this._gameStateManager.setState(GameState.GAME_OVER);
        this._showDisconnectionScreen(data.message);
        
        this._submitDisconnectionHistory();
    }

    private _showDisconnectionScreen(disconnectionMessage: string): void {
        this._statusUI.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'text-center p-8';
        
        const title = document.createElement('h1');
        title.textContent = '🎉 You Win by Default! 🎉';
        title.className = 'text-4xl mb-5 text-orange-500';
        container.appendChild(title);
        
        const message = document.createElement('div');
        message.textContent = disconnectionMessage;
        message.className = 'text-xl mb-8 text-white';
        container.appendChild(message);
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-4 justify-center';
        
        const lobbyButton = document.createElement('button');
        lobbyButton.textContent = '🏠 Voltar para o Lobby';
        lobbyButton.className = 'px-6 py-3 text-base cursor-pointer bg-blue-500 border-none rounded-lg text-white font-bold hover:bg-blue-600 transition-colors duration-300';
        
        lobbyButton.addEventListener('click', () => {
            this.disconnect();
            history.pushState('', '', '/lobby');
            router();
        });
        
        buttonsContainer.appendChild(lobbyButton);
        container.appendChild(buttonsContainer);
        
        this._statusUI.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/95 rounded-2xl max-w-lg z-[1001] border-4 border-orange-500 block';
        
        this._statusUI.appendChild(container);
    }

    private async _submitDisconnectionHistory(): Promise<void> {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                console.warn('Cannot submit match history: user not authenticated');
                return;
            }

            const opponentName = this._opponentInfo?.name || 'Unknown';

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

        } catch (error) {
            console.error('Failed to submit disconnection match history:', error);
        }
    }

    private _showMenu(): void {
        if (this._menuUI) {
            this._menuUI.classList.remove('hidden');
            this._menuUI.classList.add('flex');
        }
        this._gameUI.classList.add('hidden');
    }

    private _hideMenu(): void {
        if (this._menuUI) {
            this._menuUI.classList.add('hidden');
            this._menuUI.classList.remove('flex');
        }
    }

    private _showGame(): void {
        this._gameUI.classList.remove('hidden');
        this._gameUI.classList.add('block');
    }

    private _showStatus(message: string, type: "info" | "success" | "error" | "warning", persistent: boolean = false): void {
        this._statusUI.textContent = message;
        this._statusUI.classList.remove('hidden');
        this._statusUI.classList.add('block');
        
        this._statusUI.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white p-5 rounded-lg text-center text-lg block z-[1001]";
        
        switch (type) {
            case "success":
                this._statusUI.classList.add('bg-green-500/90');
                break;
            case "error":
                this._statusUI.classList.add('bg-red-500/90');
                break;
            case "warning":
                this._statusUI.classList.add('bg-orange-500/90');
                break;
            default:
                this._statusUI.classList.add('bg-black/80');
        }
        
        if (this._statusTimer) {
            clearTimeout(this._statusTimer);
            this._statusTimer = null;
        }
        
        if (!persistent) {
            this._statusTimer = setTimeout(() => {
                this._hideStatus();
                this._statusTimer = null;
            }, 1000);
        }
    }

    private _hideStatus(): void {
        this._statusUI.classList.add('hidden');
        this._statusUI.classList.remove('block');
    }

    public update(): void {
        if (this._gameStateManager.isPlaying()) {
            this._handleInput();
        }
    }

    private _handleInput(): void {
        if (!this._networkManager.connected || !this._myPaddle) return;
        
        if (this._inputManager.isKeyPressed("arrowleft")) {
            this._networkManager.sendInput("move_left");
        }
        if (this._inputManager.isKeyPressed("arrowright")) {
            this._networkManager.sendInput("move_right");
        }
    }

    public disconnect(): void {
        if (this._statusTimer) {
            clearTimeout(this._statusTimer);
            this._statusTimer = null;
        }
        
        this._networkManager.disconnect();
    }
}
