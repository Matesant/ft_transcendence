import * as BABYLON from "@babylonjs/core";
import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";
import { PowerUpManager } from "./PowerUpManager";

// Simple enum for game states (removed PAUSED)
enum GameState {
    MENU,
    PLAYING,
    GAME_OVER
}

export class GameManager {
    private _scene: BABYLON.Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _firstCollision: boolean = true;
    private _gameState: GameState = GameState.MENU;
    
    private _menuUI: HTMLDivElement;
    private _gameOverUI: HTMLDivElement;
    private _powerUpManager: PowerUpManager;
    
    // Add a field to track the current game mode
    private _powerUpsEnabled: boolean = false;
    
    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
        this._scoreManager = new ScoreManager();
        this._inputManager = new InputManager();
        
        // Initialize game objects
        this._ball = new Ball(scene);
        this._leftPaddle = new Paddle(scene, PaddleType.LEFT);
        this._rightPaddle = new Paddle(scene, PaddleType.RIGHT);
        
        // Create walls
        new Wall(scene, WallType.TOP);
        new Wall(scene, WallType.BOTTOM);
        
        // Create playing field
        this._createPlayingField();
        
        // Create UI elements (removed pause UI)
        this._createMenuUI();
        this._createGameOverUI();
        
        // Initialize power-up manager after creating paddles and ball
        this._powerUpManager = new PowerUpManager(
            scene,
            this._leftPaddle,
            this._rightPaddle,
            this._ball,
            this._scoreManager
        );
        
        // Show menu initially
        this._showMenu();
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
        this._menuUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const title = document.createElement("h1");
        title.textContent = "PONG";
        title.style.color = "white";
        title.style.fontSize = "48px";
        title.style.marginBottom = "30px";
        
        const subtitle = document.createElement("h2");
        subtitle.textContent = "Select Game Mode";
        subtitle.style.color = "white";
        subtitle.style.fontSize = "24px";
        subtitle.style.marginBottom = "20px";
        
        // Container for both buttons
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.flexDirection = "row";
        buttonsContainer.style.gap = "20px";
        buttonsContainer.style.justifyContent = "center";
        buttonsContainer.style.alignItems = "center";
        
        // Create button containers (to include label and button)
        const classicContainer = document.createElement("div");
        classicContainer.style.display = "flex";
        classicContainer.style.flexDirection = "column";
        classicContainer.style.alignItems = "center";
        classicContainer.style.width = "200px";
        
        const powerUpsContainer = document.createElement("div");
        powerUpsContainer.style.display = "flex";
        powerUpsContainer.style.flexDirection = "column";
        powerUpsContainer.style.alignItems = "center"; 
        powerUpsContainer.style.width = "200px";
        
        // Classic mode label
        const classicLabel = document.createElement("div");
        classicLabel.textContent = "Classic Mode";
        classicLabel.style.color = "white";
        classicLabel.style.fontSize = "18px";
        classicLabel.style.marginBottom = "10px";
        
        // Power-ups mode label
        const powerUpsLabel = document.createElement("div");
        powerUpsLabel.textContent = "Power-ups Mode";
        powerUpsLabel.style.color = "white"; 
        powerUpsLabel.style.fontSize = "18px";
        powerUpsLabel.style.marginBottom = "10px";
        
        // Classic mode button
        const classicButton = document.createElement("button");
        classicButton.textContent = "START";
        classicButton.style.padding = "10px 20px";
        classicButton.style.width = "120px";
        classicButton.style.fontSize = "18px";
        classicButton.style.cursor = "pointer";
        classicButton.style.backgroundColor = "#4286f4";
        classicButton.style.border = "none";
        classicButton.style.borderRadius = "5px";
        classicButton.style.color = "white";
        
        // Power-ups mode button
        const powerUpsButton = document.createElement("button");
        powerUpsButton.textContent = "START";
        powerUpsButton.style.padding = "10px 20px";
        powerUpsButton.style.width = "120px";
        powerUpsButton.style.fontSize = "18px";
        powerUpsButton.style.cursor = "pointer";
        powerUpsButton.style.backgroundColor = "#f44283";
        powerUpsButton.style.border = "none";
        powerUpsButton.style.borderRadius = "5px";
        powerUpsButton.style.color = "white";
        
        // Add event listeners
        classicButton.addEventListener("click", () => {
            this._startGame(false); // Start game without power-ups
        });
        
        powerUpsButton.addEventListener("click", () => {
            this._startGame(true); // Start game with power-ups
        });
        
        // Assemble the UI
        classicContainer.appendChild(classicLabel);
        classicContainer.appendChild(classicButton);
        
        powerUpsContainer.appendChild(powerUpsLabel);
        powerUpsContainer.appendChild(powerUpsButton);
        
        buttonsContainer.appendChild(classicContainer);
        buttonsContainer.appendChild(powerUpsContainer);
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(subtitle);
        this._menuUI.appendChild(buttonsContainer);
        
        document.body.appendChild(this._menuUI);
    }
    
    private _createGameOverUI(): void {
        this._gameOverUI = document.createElement("div");
        this._gameOverUI.style.position = "absolute";
        this._gameOverUI.style.top = "0";
        this._gameOverUI.style.left = "0";
        this._gameOverUI.style.width = "100%";
        this._gameOverUI.style.height = "100%";
        this._gameOverUI.style.display = "none";
        this._gameOverUI.style.flexDirection = "column";
        this._gameOverUI.style.justifyContent = "center";
        this._gameOverUI.style.alignItems = "center";
        this._gameOverUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const gameOverText = document.createElement("h2");
        gameOverText.textContent = "GAME OVER";
        gameOverText.style.color = "white";
        gameOverText.style.fontSize = "36px";
        gameOverText.style.marginBottom = "20px";
        
        const winnerText = document.createElement("h3");
        winnerText.style.color = "white";
        winnerText.style.fontSize = "24px";
        winnerText.style.marginBottom = "30px";
        winnerText.id = "winnerText";
        
        const playAgainButton = document.createElement("button");
        playAgainButton.textContent = "PLAY AGAIN";
        playAgainButton.style.padding = "10px 20px";
        playAgainButton.style.fontSize = "20px";
        playAgainButton.style.cursor = "pointer";
        playAgainButton.style.backgroundColor = "#4CAF50";
        playAgainButton.style.border = "none";
        playAgainButton.style.borderRadius = "5px";
        playAgainButton.style.color = "white";
        playAgainButton.style.marginBottom = "10px";
        
        playAgainButton.addEventListener("click", () => {
            this._resetGame();
            this._startGame(this._powerUpsEnabled); // Use the same mode as before
        });
        
        const menuButton = document.createElement("button");
        menuButton.textContent = "MAIN MENU";
        menuButton.style.padding = "10px 20px";
        menuButton.style.fontSize = "20px";
        menuButton.style.cursor = "pointer";
        menuButton.style.backgroundColor = "#f44336";
        menuButton.style.border = "none";
        menuButton.style.borderRadius = "5px";
        menuButton.style.color = "white";
        
        menuButton.addEventListener("click", () => {
            this._showMenu();
        });
        
        this._gameOverUI.appendChild(gameOverText);
        this._gameOverUI.appendChild(winnerText);
        this._gameOverUI.appendChild(playAgainButton);
        this._gameOverUI.appendChild(menuButton);
        document.body.appendChild(this._gameOverUI);
    }
    
    private _showMenu(): void {
        this._gameState = GameState.MENU;
        this._menuUI.style.display = "flex";
        this._gameOverUI.style.display = "none";
        this._resetGame();
        
        // Ensure power-ups are deactivated
        this._powerUpManager.deactivate();
    }
    
    // Update _startGame to store the current mode
    private _startGame(enablePowerUps: boolean = false): void {
        this._gameState = GameState.PLAYING;
        this._menuUI.style.display = "none";
        this._gameOverUI.style.display = "none";
        
        // Store the current game mode
        this._powerUpsEnabled = enablePowerUps;
        
        // Start the ball automatically with random direction for first serve
        this._ball.start(); // No direction specified = random
        this._firstCollision = true;
        
        // Activate power-up spawning only if power-ups mode is enabled
        if (enablePowerUps) {
            this._powerUpManager.activate();
        } else {
            this._powerUpManager.deactivate();
        }
    }
    
    private _showGameOver(winner: string): void {
        this._gameState = GameState.GAME_OVER;
        const winnerText = document.getElementById("winnerText");
        if (winnerText) {
            winnerText.textContent = `${winner} Wins!`;
        }
        this._gameOverUI.style.display = "flex";
    }
    
    private _resetGame(): void {
        this._ball.reset();
        this._scoreManager.reset();
        this._firstCollision = true;
        
        // Reset paddles
        this._leftPaddle.reset();
        this._rightPaddle.reset();
        
        // Reset power-ups
        this._powerUpManager.reset();
        this._powerUpManager.deactivate();
    }
    
    private _createPlayingField(): void {
        // Create ground
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            { width: CONFIG.FIELD.WIDTH, height: CONFIG.FIELD.HEIGHT }, 
            this._scene
        );
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this._scene);
        groundMaterial.diffuseColor = CONFIG.FIELD.COLOR;
        ground.material = groundMaterial;
        
        // Create center lines
        const lineMaterial = new BABYLON.StandardMaterial("lineMaterial", this._scene);
        lineMaterial.emissiveColor = CONFIG.CENTER_LINE.COLOR;
        lineMaterial.alpha = CONFIG.CENTER_LINE.ALPHA;
        
        const centerLineVertical = BABYLON.MeshBuilder.CreateBox(
            "centerLineVertical", 
            {
                width: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineVertical.position = CONFIG.CENTER_LINE.VERTICAL.POSITION.clone();
        centerLineVertical.material = lineMaterial;
        
        const centerLineHorizontal = BABYLON.MeshBuilder.CreateBox(
            "centerLineHorizontal", 
            {
                width: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineHorizontal.position = CONFIG.CENTER_LINE.HORIZONTAL.POSITION.clone();
        centerLineHorizontal.material = lineMaterial;
    }
    
    public update(): void {
        // Only update game logic if in PLAYING state
        if (this._gameState === GameState.PLAYING) {
            this._handleInput();
            this._updateGameObjects();
            this._powerUpManager.update(); // Update power-ups
            this._checkCollisions();
            
            // Check for game over condition
            const score = this._scoreManager.score;
            if (score.player1 >= 5) {
                this._showGameOver("Player 1");
            } else if (score.player2 >= 5) {
                this._showGameOver("Player 2");
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
    
    private _checkCollisions(): void {
        // Get all balls from the power-up manager
        const balls = this._powerUpManager.balls;
        
        for (const ball of balls) {
            if (!ball.active) continue;
            
            const ballPos = ball.mesh.position;
            
            // Ball collision with walls (using field width/height)
            const wallBoundary = CONFIG.FIELD.WIDTH / 2 - 0.2;
            if (ballPos.x <= -wallBoundary || ballPos.x >= wallBoundary) {
                ball.reverseX();
            }
            
            // Left paddle collision
            if (ballPos.z <= CONFIG.PADDLE.COLLISION.LEFT.MAX_Z && 
                ballPos.z >= CONFIG.PADDLE.COLLISION.LEFT.MIN_Z &&
                Math.abs(ballPos.x - this._leftPaddle.mesh.position.x) < this._leftPaddle.width / 2 * this._leftPaddle.mesh.scaling.x) {
                
                ball.reverseZ();
                
                // Speed up ball after first collision
                if (this._firstCollision) {
                    this._firstCollision = false;
                    const currentVelocity = ball.velocity;
                    const normalizedVelocity = currentVelocity.normalize();
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
                }
                
                // Add spin based on hit position
                const hitFactor = (ballPos.x - this._leftPaddle.mesh.position.x) / (this._leftPaddle.width / 2 * this._leftPaddle.mesh.scaling.x);
                ball.addSpin(hitFactor);
            }
            
            // Right paddle collision (similar update for scaled width)
            if (ballPos.z >= CONFIG.PADDLE.COLLISION.RIGHT.MIN_Z && 
                ballPos.z <= CONFIG.PADDLE.COLLISION.RIGHT.MAX_Z &&
                Math.abs(ballPos.x - this._rightPaddle.mesh.position.x) < this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x) {
                
                ball.reverseZ();
                
                // Speed up ball after first collision
                if (this._firstCollision) {
                    this._firstCollision = false;
                    const currentVelocity = ball.velocity;
                    const normalizedVelocity = currentVelocity.normalize();
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
                }
                
                // Add spin based on hit position
                const hitFactor = (ballPos.x - this._rightPaddle.mesh.position.x) / (this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x);
                ball.addSpin(hitFactor);
            }
            
            // Scoring logic - left player scores (ball went past right side)
            if (ballPos.z > CONFIG.SCORE.BOUNDARY.RIGHT) {
                this._scoreManager.player2Scores();
                
                // If this is the main ball, reset all balls
                if (ball === this._ball) {
                    this._powerUpManager.reset();
                    this._ball.reset();
                    this._firstCollision = true;
                    
                    // Start ball moving toward player 1 (negative z direction)
                    // Since player 2 scored, ball should go toward player 1
                    this._ball.start(DIRECTION.LEFT);
                } else {
                    // Just remove this extra ball
                    ball.reset();
                    ball.active = false;
                    const ballIndex = this._powerUpManager.balls.indexOf(ball);
                    if (ballIndex > 0) { // Don't remove the main ball
                        this._powerUpManager.balls.splice(ballIndex, 1);
                        ball.mesh.dispose();
                    }
                }
            }
            
            // Scoring logic - right player scores (ball went past left side)
            if (ballPos.z < CONFIG.SCORE.BOUNDARY.LEFT) {
                this._scoreManager.player1Scores();
                
                // If this is the main ball, reset all balls
                if (ball === this._ball) {
                    this._powerUpManager.reset();
                    this._ball.reset();
                    this._firstCollision = true;
                    
                    // Start ball moving toward player 2 (positive z direction)
                    // Since player 1 scored, ball should go toward player 2
                    this._ball.start(DIRECTION.RIGHT);
                } else {
                    // Just remove this extra ball
                    ball.reset();
                    ball.active = false;
                    const ballIndex = this._powerUpManager.balls.indexOf(ball);
                    if (ballIndex > 0) { // Don't remove the main ball
                        this._powerUpManager.balls.splice(ballIndex, 1);
                        ball.mesh.dispose();
                    }
                }
            }
        }
    }
}