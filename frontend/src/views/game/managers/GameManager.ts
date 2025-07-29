import { Scene } from "@babylonjs/core";
import { Ball } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";
import { PowerUpManager } from "./PowerUpManager";
import { UIManager } from "./UIManager";
import { MatchManager } from "./MatchManager";
import { CollisionManager } from "./CollisionManager";
import { FieldManager } from "./FieldManager";
import { GameStateManager } from "./GameStateManager";
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

        // Apply speed multiplier to paddles
        this._leftPaddle.setSpeedMultiplier(this._speedMultiplier);
        this._rightPaddle.setSpeedMultiplier(this._speedMultiplier);

        // Try to load a new match (if available)
        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._scoreManager.setPlayerNames(player1, player2);

        // Start the ball with delay for initial game start
        // Check if this is the first game start (score is 0-0)
        const score = this._scoreManager.score;
        const isFirstStart = score.player1 === 0 && score.player2 === 0;
        
        if (isFirstStart) {
            // First game start - wait 5 seconds
            setTimeout(() => {
                this._ball.start();
                this._applySpeedMultiplierToBall(this._ball);
            }, 2000);
        } else {
            // Regular restart - start immediately
            this._ball.start();
            this._applySpeedMultiplierToBall(this._ball);
        }
        
        this._firstCollision = true;
        this._collisionManager.setFirstCollision(true);

        // Activate power-up spawning only if power-ups mode is enabled
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
        
        // Reset paddles
        this._leftPaddle.reset();
        this._rightPaddle.reset();
        
        // Reset power-ups
        this._powerUpManager.reset();
        this._powerUpManager.deactivate();
    }
    
    private _resetAndRestart(): void {
        this._resetGame();
        this._startGame(this._gameStateManager.arePowerUpsEnabled());
    }

    private _onScore(): void {
        // This method is called when a score happens
        // Can be used for additional score-related logic if needed
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
        // Load game speed
        const gameSpeed = parseFloat(sessionStorage.getItem("gameSpeed") || "1.0");
        this._speedMultiplier = gameSpeed;
        
        // Load table theme
        const tableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
        this._fieldManager.setTableTheme(tableTheme as 'GREEN' | 'BLUE');
    }
    
    public update(): void {
        // Only update game logic if in PLAYING state
        if (this._gameStateManager.isPlaying()) {
            this._handleInput();
            this._updateGameObjects();
            this._powerUpManager.update();
            this._collisionManager.checkCollisions();
            
            // Check for game over condition
            const score = this._scoreManager.score;
            const { player1, player2 } = this._matchManager.getPlayerNames();
            if (score.player1 >= 2) {
                this._showGameOver(player1);
            } else if (score.player2 >= 2) {
                this._showGameOver(player2);
            }
        }
    }
    
    private _handleInput(): void {
        // Handle paddle movement
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
        // Update all balls from the power-up manager instead of just the main ball
        const balls = this._powerUpManager.balls;
        for (const ball of balls) {
            ball.update();
        }
        
        // Continue updating paddles
        this._leftPaddle.update();
        this._rightPaddle.update();
    }

    private _setupWebSocketHandlers(): void {
        const wsManager = getWsManager();
        if (wsManager) {
            wsManager.onGameEnd((data) => {
                console.log('🎮 Received game_end from backend:', data);
                // Call the same showGameOver method that local mode uses
                this._showGameOver(data.winner.name);
            });
        }
    }
}