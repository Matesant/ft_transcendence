import { Scene } from "@babylonjs/core";
import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";
import { PowerUpManager } from "./PowerUpManager";
import { Language } from "../../i18n";
import { UIManager } from "./UIManager";
import { MatchManager } from "./MatchManager";
import { CollisionManager } from "./CollisionManager";
import { FieldManager } from "./FieldManager";
import { GameStateManager, GameState } from "./GameStateManager";
import { getWsManager } from "../../../utils/connectionStore";
import { router } from "../../../router/Router";

export class GameManager {
    private _scene: Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _powerUpManager: PowerUpManager;
    
    // New managers
    private _uiManager: UIManager;
    private _matchManager: MatchManager;
    private _collisionManager: CollisionManager;
    private _fieldManager: FieldManager;
    private _gameStateManager: GameStateManager;
    
    // Game settings
    private _speedMultiplier: number = CONFIG.SPEED.MULTIPLIER.DEFAULT;
    private _firstCollision: boolean = true;
    
    constructor(scene: Scene) {
        this._scene = scene;
        this._scoreManager = new ScoreManager();
        this._inputManager = new InputManager();
        this._gameStateManager = new GameStateManager();
        this._matchManager = new MatchManager();

        // Initialize game objects
        this._ball = new Ball(scene);
        this._leftPaddle = new Paddle(scene, PaddleType.LEFT);
        this._rightPaddle = new Paddle(scene, PaddleType.RIGHT);
        new Wall(scene, WallType.TOP);
        new Wall(scene, WallType.BOTTOM);

        // Create playing field
        this._fieldManager = new FieldManager(scene);
        
        // Load settings from sessionStorage (from tournament configuration)
        this._loadSettingsFromStorage();

        // Initialize power-up manager
        this._powerUpManager = new PowerUpManager(
            scene,
            this._leftPaddle,
            this._rightPaddle,
            this._ball,
            this._scoreManager
        );

        // Initialize collision manager
        this._collisionManager = new CollisionManager(
            this._leftPaddle,
            this._rightPaddle,
            this._ball,
            this._scoreManager,
            this._powerUpManager,
            () => this._onScore()
        );

        // Initialize UI manager
        this._uiManager = new UIManager(
            (enablePowerUps) => this._startGame(enablePowerUps),
            () => this._showMenu(),
            () => this._resetAndRestart(),
            (speed) => this._onSpeedChange(speed),
            () => this._onTableThemeToggle()
        );

        // Setup WebSocket for online mode
        this._setupWebSocketHandlers();

        // Load current match and show menu
        this._initializeGame();
    }
    private async _initializeGame(): Promise<void> {
        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._scoreManager.setPlayerNames(player1, player2);
        
        // Load settings from sessionStorage and start game directly
        const powerupsEnabled = sessionStorage.getItem("powerupsEnabled") === "true";
        const gameSpeed = parseFloat(sessionStorage.getItem("gameSpeed") || "1.0");
        const tableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
        
        // Apply settings
        this._onSpeedChange(gameSpeed);
        this._fieldManager.setTableTheme(tableTheme as 'GREEN' | 'BLUE');
        this._uiManager.setTableTheme(tableTheme as 'GREEN' | 'BLUE');
        
        // Start game immediately
        this._startGame(powerupsEnabled);
    }
    
    private async _showMenu(): Promise<void> {
        // Navigate back to tournament page
        history.pushState("", "", "/tournament");
        router();
    }
    
    private async _startGame(enablePowerUps: boolean = false): Promise<void> {
        this._gameStateManager.startGame(enablePowerUps);
        this._uiManager.hideGameOver();

        this._leftPaddle.setSpeedMultiplier(this._speedMultiplier);
        this._rightPaddle.setSpeedMultiplier(this._speedMultiplier);

        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._scoreManager.setPlayerNames(player1, player2);

        const score = this._scoreManager.score;
        const isFirstStart = score.player1 === 0 && score.player2 === 0;
        
        if (isFirstStart) {
            setTimeout(() => {
                this._ball.start();
                this._applySpeedMultiplierToBall(this._ball);
            }, 500);
        } else {
            this._ball.start();
            this._applySpeedMultiplierToBall(this._ball);
        }
        
        this._firstCollision = true;
        this._collisionManager.setFirstCollision(true);

        if (enablePowerUps) {
            this._powerUpManager.activate();
        } else {
            this._powerUpManager.deactivate();
        }
    }
    
    private async _showGameOver(winner: string): Promise<void> {
        this._gameStateManager.showGameOver();
        const { player1, player2 } = this._matchManager.getPlayerNames();

        let tournamentComplete = false;
        let champion = "";

        if (this._matchManager.getCurrentMatch()) {
            const result = await this._matchManager.submitMatchResult(winner);
            tournamentComplete = result.tournamentComplete;
            champion = result.champion || "";
        }

        this._uiManager.showGameOver(
            winner,
            player1,
            player2,
            this._matchManager.getCurrentMatch(),
            tournamentComplete,
            champion
        );
    }
    
    private _resetGame(): void {
        this._ball.reset();
        this._scoreManager.reset();
        this._firstCollision = true;
        this._collisionManager.setFirstCollision(true);
        this._collisionManager.clearBallReleaseTimer();
        
        this._leftPaddle.reset();
        this._rightPaddle.reset();
        
        this._powerUpManager.reset();
        this._powerUpManager.deactivate();
    }
    
    private _resetAndRestart(): void {
        this._resetGame();
        this._startGame(this._gameStateManager.arePowerUpsEnabled());
    }

    private _onScore(): void {
    }

    private _onSpeedChange(speed: number): void {
        this._speedMultiplier = speed;
        this._collisionManager.setSpeedMultiplier(speed);
    }

    private _onTableThemeToggle(): void {
        this._fieldManager.toggleTableTheme();
        this._uiManager.setTableTheme(this._fieldManager.getTableTheme());
    }

    private _applySpeedMultiplierToBall(ball: Ball): void {
        const currentVel = ball.velocity;
        ball.velocity = currentVel.scale(this._speedMultiplier);
    }

    private _loadSettingsFromStorage(): void {
        const gameSpeed = parseFloat(sessionStorage.getItem("gameSpeed") || "1.0");
        this._speedMultiplier = gameSpeed;
        
        const tableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
        this._fieldManager.setTableTheme(tableTheme as 'GREEN' | 'BLUE');
    }
    
    public update(): void {
        if (this._gameStateManager.isPlaying()) {
            this._handleInput();
            this._updateGameObjects();
            this._powerUpManager.update();
            this._collisionManager.checkCollisions();
            
            const score = this._scoreManager.score;
            const { player1, player2 } = this._matchManager.getPlayerNames();
            if (score.player1 >= 5) {
                this._showGameOver(player1);
            } else if (score.player2 >= 5) {
                this._showGameOver(player2);
            }
        }
    }
    
    private _handleInput(): void {
        if (this._inputManager.isKeyPressed("a")) {
            this._rightPaddle.moveLeft();
        }
        if (this._inputManager.isKeyPressed("d")) {
            this._rightPaddle.moveRight();
        }
        
        if (this._inputManager.isKeyPressed("arrowleft")) {
            this._leftPaddle.moveLeft();
        }
        if (this._inputManager.isKeyPressed("arrowright")) {
            this._leftPaddle.moveRight();
        }
    }
    
    private _updateGameObjects(): void {
        const balls = this._powerUpManager.balls;
        for (const ball of balls) {
            ball.update();
        }
        
        this._leftPaddle.update();
        this._rightPaddle.update();
    }

    private _setupWebSocketHandlers(): void {
        const wsManager = getWsManager();
        if (wsManager) {
            wsManager.onGameEnd((data) => {
                this._showGameOver(data.winner.name);
            });
        }
    }
}