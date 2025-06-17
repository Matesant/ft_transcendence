import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";

class App {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _ground: BABYLON.GroundMesh;
    private _groundMaterial: BABYLON.StandardMaterial;
    private _leftWall: BABYLON.Mesh;
    private _rightWall: BABYLON.Mesh;
    private _topSlider: BABYLON.Mesh;
    private _bottomSlider: BABYLON.Mesh;
    private _pressedKeys: { [key: string]: boolean } = {};
    private _slidersMoveSpeed: number = 0.175;
    private _ball: BABYLON.Mesh;
    private _ballSpeed: number = 0.1;
    private _ballVelocity: BABYLON.Vector3;
    private _score: { player1: number, player2: number } = { player1: 0, player2: 0 };
    private _gameStarted: boolean = false;
    private _firstCollision: boolean = true;
    private _scoreText: HTMLDivElement;

    constructor() {
        // Canvas setup
        this._canvas = document.createElement("canvas");
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        // Engine and scene setup
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1); // Dark blue background
        
        // Camera setup - looking at the table from the perspective shown in your image
        this._camera = new BABYLON.ArcRotateCamera(
            "Camera", 
            Math.PI, // alpha - rotate 180 degrees around
            Math.PI/4, // beta - looking down at an angle
            22, // radius - distance
            new BABYLON.Vector3(0, 0, 0), 
            this._scene
        );
        this._camera.setTarget(BABYLON.Vector3.Zero());
        
        // Ambient light instead of point light
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this._scene
        );
        ambientLight.intensity = 0.7;
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        
        // Create green ground
        this._ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            { width: 12, height: 17 }, 
            this._scene
        );
        this._groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this._scene);
        this._groundMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.35, 0.15); // Green table
        this._ground.material = this._groundMaterial;
        
        // Create center lines
        const centerLineVertical = BABYLON.MeshBuilder.CreateBox(
            "centerLineVertical", 
            {width: 0.05, height: 0.01, depth: 17}, 
            this._scene
        );
        centerLineVertical.position.y = 0.01;
        
        const lineMaterial = new BABYLON.StandardMaterial("lineMaterial", this._scene);
        lineMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White glow
        lineMaterial.alpha = 0.7;
        centerLineVertical.material = lineMaterial;

        const centerLineHorizontal = BABYLON.MeshBuilder.CreateBox(
            "centerLineHorizontal", 
            {width: 12, height: 0.01, depth: 0.05}, 
            this._scene
        );
        centerLineHorizontal.position.y = 0.01;
        centerLineHorizontal.material = lineMaterial;
        
        // Create walls
        this._leftWall = BABYLON.MeshBuilder.CreateBox(
            "leftWall", 
            {width: 0.1, height: 0.3, depth: 17}, // depth along Z axis
            this._scene
        );
        this._leftWall.position = new BABYLON.Vector3(-6.05, 0.15, 0);
        
        this._rightWall = BABYLON.MeshBuilder.CreateBox(
            "rightWall", 
            {width: 0.1, height: 0.3, depth: 17}, 
            this._scene
        );
        this._rightWall.position = new BABYLON.Vector3(6.05, 0.15, 0);
        
        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", this._scene);
        wallMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White glow
        this._leftWall.material = wallMaterial;
        this._rightWall.material = wallMaterial;

        // Create blue top paddle
        this._topSlider = BABYLON.MeshBuilder.CreateBox(
            "topSlider", 
            {width: 1.3, height: 0.3, depth: 0.35}, 
            this._scene
        );
        this._topSlider.position = new BABYLON.Vector3(0, 0.15, -8.25); // Top of the field
        
        const topPaddleMaterial = new BABYLON.StandardMaterial("topPaddleMaterial", this._scene);
        topPaddleMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1); // Blue glow
        this._topSlider.material = topPaddleMaterial;
        
        // Create red bottom paddle
        this._bottomSlider = BABYLON.MeshBuilder.CreateBox(
            "bottomSlider", 
            {width: 1.3, height: 0.3, depth: 0.35}, 
            this._scene
        );
        this._bottomSlider.position = new BABYLON.Vector3(0, 0.15, 8.25); // Bottom of the field
        
        const bottomPaddleMaterial = new BABYLON.StandardMaterial("bottomPaddleMaterial", this._scene);
        bottomPaddleMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0.3); // Red glow
        this._bottomSlider.material = bottomPaddleMaterial;
        
        // Create yellow ball
        this._ball = BABYLON.MeshBuilder.CreateSphere(
            "ball", 
            { diameter: 0.4 }, 
            this._scene
        );
        this._ball.position = new BABYLON.Vector3(0, 0.2, 0);
        
        const ballMaterial = new BABYLON.StandardMaterial("ballMaterial", this._scene);
        ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.7); // Yellow glow
        this._ball.material = ballMaterial;
        
        // Add glow effect
        const glowLayer = new BABYLON.GlowLayer("glowLayer", this._scene);
        glowLayer.intensity = 0.7;
        
        // Initialize ball velocity
        this._ballVelocity = new BABYLON.Vector3(0, 0, this._ballSpeed);
        
        // Create score display
        this._scoreText = document.createElement("div");
        this._scoreText.style.position = "absolute";
        this._scoreText.style.top = "20px";
        this._scoreText.style.left = "0";
        this._scoreText.style.width = "100%";
        this._scoreText.style.textAlign = "center";
        this._scoreText.style.color = "white";
        this._scoreText.style.fontSize = "24px";
        this._scoreText.style.fontFamily = "sans-serif";
        document.body.appendChild(this._scoreText);
        this.updateScoreDisplay();
        
        // Add keyboard event listeners
        window.addEventListener("keydown", (event) => {
            // Toggle inspector with Shift+Ctrl+Alt+I
            if (event.shiftKey && event.ctrlKey && event.altKey && event.key === "i") {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
            
            // Start game with space
            if (event.code === "Space" && !this._gameStarted) {
                this._gameStarted = true;
                this._ballVelocity = new BABYLON.Vector3(
                    (Math.random() - 0.5) * this._ballSpeed, 
                    0, 
                    this._ballSpeed * (Math.random() > 0.5 ? 1 : -1)
                );
            }
            
            this._pressedKeys[event.key.toLowerCase()] = true;
        });
        
        window.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = false;
        });
        
        // Handle window resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });
    }
    
    private updateScoreDisplay(): void {
        this._scoreText.textContent = `Player_1: ${this._score.player1} vs Player_2: ${this._score.player2}`;
    }
    
    private resetBall(): void {
        this._ball.position = new BABYLON.Vector3(0, 0.2, 0);
        this._ballVelocity = new BABYLON.Vector3(0, 0, 0);
        this._gameStarted = false;
        this._firstCollision = true;
    }
    
    private handleCollisions(): void {
        // Ball collision with walls
        if (this._ball.position.x <= -5.8 || this._ball.position.x >= 5.8) {
            this._ballVelocity.x *= -1;
        }
        
        // Ball collision with paddles
        // Top paddle collision
        if (this._ball.position.z <= -8.05 && 
            this._ball.position.z >= -8.45 &&
            Math.abs(this._ball.position.x - this._topSlider.position.x) < 0.75) {
            
            this._ballVelocity.z *= -1;
            // Add some English (spin) based on where the ball hits the paddle
            const hitFactor = (this._ball.position.x - this._topSlider.position.x) / 0.75;
            this._ballVelocity.x += hitFactor * 0.1;
            this._firstCollision = false;
        }
        
        // Bottom paddle collision
        if (this._ball.position.z >= 8.05 && 
            this._ball.position.z <= 8.45 &&
            Math.abs(this._ball.position.x - this._bottomSlider.position.x) < 0.75) {
            
            this._ballVelocity.z *= -1;
            // Add some English (spin) based on where the ball hits the paddle
            const hitFactor = (this._ball.position.x - this._bottomSlider.position.x) / 0.75;
            this._ballVelocity.x += hitFactor * 0.1;
            this._firstCollision = false;
        }
        
        // Scoring logic
        // Top player scores
        if (this._ball.position.z > 8.5) {
            this._score.player2++;
            this.updateScoreDisplay();
            this.resetBall();
        }
        
        // Bottom player scores
        if (this._ball.position.z < -8.5) {
            this._score.player1++;
            this.updateScoreDisplay();
            this.resetBall();
        }
    }
    
    public mainLoop(): void {
        // Run the single render loop
        this._engine.runRenderLoop(() => {
            // Handle paddle movement
            if (this._pressedKeys["a"] && this._bottomSlider.position.x > -5) {
                this._bottomSlider.position.x -= this._slidersMoveSpeed;
            }
            if (this._pressedKeys["d"] && this._bottomSlider.position.x < 5) {
                this._bottomSlider.position.x += this._slidersMoveSpeed;
            }
            
            // Use arrow keys for top paddle
            if (this._pressedKeys["arrowleft"] && this._topSlider.position.x > -5) {
                this._topSlider.position.x -= this._slidersMoveSpeed;
            }
            if (this._pressedKeys["arrowright"] && this._topSlider.position.x < 5) {
                this._topSlider.position.x += this._slidersMoveSpeed;
            }
            
            // Update ball position if game is started
            if (this._gameStarted) {
                this._ball.position.addInPlace(this._ballVelocity);
                this.handleCollisions();
            }
            
            // Render the scene
            this._scene.render();
        });
    }
}

// Create and start the game
let game = new App();
game.mainLoop();