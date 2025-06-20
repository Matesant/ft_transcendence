import * as BABYLON from "@babylonjs/core";
import { Ball } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";

// Simple enum for game states
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
    
    // UI elements
    private _menuUI: HTMLDivElement;
    private _gameOverUI: HTMLDivElement;
    
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
        
        // Create UI elements
        this._createMenuUI();
        this._createGameOverUI();
        
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
        
        const startButton = document.createElement("button");
        startButton.textContent = "START GAME";
        startButton.style.padding = "10px 20px";
        startButton.style.fontSize = "20px";
        startButton.style.cursor = "pointer";
        startButton.style.backgroundColor = "#4CAF50";
        startButton.style.border = "none";
        startButton.style.borderRadius = "5px";
        startButton.style.color = "white";
        
        startButton.addEventListener("click", () => {
            this._startGame();
        });
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(startButton);
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
            this._startGame();
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
    }
    
    private _startGame(): void {
        this._gameState = GameState.PLAYING;
        this._menuUI.style.display = "none";
        this._gameOverUI.style.display = "none";
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
        
        // Start game with space
        if (this._inputManager.isKeyPressed("space") && !this._ball.active) {
            this._ball.start();
            this._firstCollision = true;
        }
    }
    
    private _updateGameObjects(): void {
        this._ball.update();
        this._leftPaddle.update();
        this._rightPaddle.update();
    }
    
    private _checkCollisions(): void {
        if (!this._ball.active) return;
        
        const ballPos = this._ball.mesh.position;
        
        // Ball collision with walls (using field width/height)
        const wallBoundary = CONFIG.FIELD.WIDTH / 2 - 0.2;  // Slightly inside the walls
        if (ballPos.x <= -wallBoundary || ballPos.x >= wallBoundary) {
            this._ball.reverseX();
        }
        
        // Left paddle collision
        if (ballPos.z <= CONFIG.PADDLE.COLLISION.LEFT.MAX_Z && 
            ballPos.z >= CONFIG.PADDLE.COLLISION.LEFT.MIN_Z &&
            Math.abs(ballPos.x - this._leftPaddle.mesh.position.x) < this._leftPaddle.width / 2) {
            
            this._ball.reverseZ();
            
            // Speed up ball after first collision
            if (this._firstCollision) {
                this._firstCollision = false;
                const currentVelocity = this._ball.velocity;
                const normalizedVelocity = currentVelocity.normalize();
                this._ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
            }
            
            // Add spin based on hit position
            const hitFactor = (ballPos.x - this._leftPaddle.mesh.position.x) / (this._leftPaddle.width / 2);
            this._ball.addSpin(hitFactor);
        }
        
        // Right paddle collision
        if (ballPos.z >= CONFIG.PADDLE.COLLISION.RIGHT.MIN_Z && 
            ballPos.z <= CONFIG.PADDLE.COLLISION.RIGHT.MAX_Z &&
            Math.abs(ballPos.x - this._rightPaddle.mesh.position.x) < this._rightPaddle.width / 2) {
            
            this._ball.reverseZ();
            
            // Speed up ball after first collision
            if (this._firstCollision) {
                this._firstCollision = false;
                const currentVelocity = this._ball.velocity;
                const normalizedVelocity = currentVelocity.normalize();
                this._ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
            }
            
            // Add spin based on hit position
            const hitFactor = (ballPos.x - this._rightPaddle.mesh.position.x) / (this._rightPaddle.width / 2);
            this._ball.addSpin(hitFactor);
        }
        
        // Scoring logic - left player scores
        if (ballPos.z > CONFIG.SCORE.BOUNDARY.RIGHT) {
            this._scoreManager.player2Scores();
            this._ball.reset();
            this._firstCollision = true;
        }
        
        // Scoring logic - right player scores
        if (ballPos.z < CONFIG.SCORE.BOUNDARY.LEFT) {
            this._scoreManager.player1Scores();
            this._ball.reset();
            this._firstCollision = true;
        }
    }
}