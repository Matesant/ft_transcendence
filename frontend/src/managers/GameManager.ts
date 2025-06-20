import * as BABYLON from "@babylonjs/core";
import { Ball } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";

export class GameManager {
    private _scene: BABYLON.Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _firstCollision: boolean = true;
    
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
        this._handleInput();
        this._updateGameObjects();
        this._checkCollisions();
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