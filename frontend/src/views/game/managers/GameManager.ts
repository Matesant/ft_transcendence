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

        // Load current match and show menu
        this._initializeGame();
    }
    private async _initializeGame(): Promise<void> {
        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._scoreManager.setPlayerNames(player1, player2);
        await this._showMenu();
    }
    
    private async _showMenu(): Promise<void> {
        this._gameStateManager.showMenu();
        this._uiManager.showMenu();
        this._uiManager.hideGameOver();
        this._resetGame();
        this._powerUpManager.deactivate();

        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._uiManager.updateMatchInfo(
            this._matchManager.getCurrentMatch(),
            player1,
            player2
        );
    }
    
    private async _startGame(enablePowerUps: boolean = false): Promise<void> {
        this._gameStateManager.startGame(enablePowerUps);
        this._uiManager.hideMenu();
        this._uiManager.hideGameOver();

        // Apply speed multiplier to paddles
        this._leftPaddle.setSpeedMultiplier(this._speedMultiplier);
        this._rightPaddle.setSpeedMultiplier(this._speedMultiplier);

        // Try to load a new match (if available)
        await this._matchManager.loadCurrentMatch();
        const { player1, player2 } = this._matchManager.getPlayerNames();
        this._scoreManager.setPlayerNames(player1, player2);

        // Start the ball with speed multiplier applied
        this._ball.start();
        this._applySpeedMultiplierToBall(this._ball);
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
            if (score.player1 >= 5) {
                this._showGameOver(player1);
            } else if (score.player2 >= 5) {
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
        
        // Use arrow keys for left paddle
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
}