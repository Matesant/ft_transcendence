import * as BABYLON from "@babylonjs/core";
import { Ball } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";

export class GameManager {
    private _scene: BABYLON.Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _firstCollision: boolean = true;
    private _normalBallSpeed: number = 0.15;
    
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
            { width: 12, height: 17 }, 
            this._scene
        );
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this._scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.15); // Green table
        ground.material = groundMaterial;
        
        // Create center lines
        const lineMaterial = new BABYLON.StandardMaterial("lineMaterial", this._scene);
        lineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White glow
        lineMaterial.alpha = 0.7;
        
        const centerLineVertical = BABYLON.MeshBuilder.CreateBox(
            "centerLineVertical", 
            {width: 0.05, height: 0.01, depth: 17}, 
            this._scene
        );
        centerLineVertical.position.y = 0.01;
        centerLineVertical.material = lineMaterial;
        
        const centerLineHorizontal = BABYLON.MeshBuilder.CreateBox(
            "centerLineHorizontal", 
            {width: 12, height: 0.01, depth: 0.05}, 
            this._scene
        );
        centerLineHorizontal.position.y = 0.01;
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
        
        // Ball collision with walls
        if (ballPos.x <= -5.8 || ballPos.x >= 5.8) {
            this._ball.reverseX();
        }
        
        // Left paddle collision
        if (ballPos.z <= -8.05 && 
            ballPos.z >= -8.45 &&
            Math.abs(ballPos.x - this._leftPaddle.mesh.position.x) < this._leftPaddle.width / 2) {
            
            this._ball.reverseZ();
            
            // Speed up ball after first collision
            if (this._firstCollision) {
                this._firstCollision = false;
                const currentVelocity = this._ball.velocity;
                const normalizedVelocity = currentVelocity.normalize();
                this._ball.velocity = normalizedVelocity.scale(this._normalBallSpeed);
            }
            
            // Add spin based on hit position
            const hitFactor = (ballPos.x - this._leftPaddle.mesh.position.x) / (this._leftPaddle.width / 2);
            this._ball.addSpin(hitFactor);
        }
        
        // Right paddle collision
        if (ballPos.z >= 8.05 && 
            ballPos.z <= 8.45 &&
            Math.abs(ballPos.x - this._rightPaddle.mesh.position.x) < this._rightPaddle.width / 2) {
            
            this._ball.reverseZ();
            
            // Speed up ball after first collision
            if (this._firstCollision) {
                this._firstCollision = false;
                const currentVelocity = this._ball.velocity;
                const normalizedVelocity = currentVelocity.normalize();
                this._ball.velocity = normalizedVelocity.scale(this._normalBallSpeed);
            }
            
            // Add spin based on hit position
            const hitFactor = (ballPos.x - this._rightPaddle.mesh.position.x) / (this._rightPaddle.width / 2);
            this._ball.addSpin(hitFactor);
        }
        
        // Scoring logic - left player scores
        if (ballPos.z > 8.5) {
            this._scoreManager.player2Scores();
            this._ball.reset();
            this._firstCollision = true;
        }
        
        // Scoring logic - right player scores
        if (ballPos.z < -8.5) {
            this._scoreManager.player1Scores();
            this._ball.reset();
            this._firstCollision = true;
        }
    }
}