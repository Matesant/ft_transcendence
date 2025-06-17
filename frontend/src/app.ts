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
    private _light: BABYLON.PointLight;
    private _shadowGenerator: BABYLON.ShadowGenerator;
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

    private slidersAnimation(): void {
        if (this._pressedKeys["w"] && this._bottomSlider.position.x > -2.5) {
            this._bottomSlider.position.x -= this._slidersMoveSpeed;
        }
        if (this._pressedKeys["s"] && this._bottomSlider.position.x < 2.5) {
            this._bottomSlider.position.x += this._slidersMoveSpeed;
        }
        if (this._pressedKeys["arrowup"] && this._topSlider.position.x > -2.5) {
            this._topSlider.position.x -= this._slidersMoveSpeed;
        }
        if (this._pressedKeys["arrowdown"] && this._topSlider.position.x < 2.5) {
            this._topSlider.position.x += this._slidersMoveSpeed;
        }
        requestAnimationFrame(() => this.slidersAnimation());
    }

    constructor() {

        this._canvas = document.createElement("canvas");
        this._canvas.width  = window.innerWidth;
        this._canvas.height = window.innerHeight;

        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        this._camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2 - 0.7, 20, new BABYLON.Vector3(0, 0, 0), this._scene);
        this._camera.setTarget(BABYLON.Vector3.Zero());
        // this._camera.attachControl(this._canvas, true);
        this._light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(10, 5, 5), this._scene);
        this._light.intensity = 1.5;
        this._ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 12, height: 17 }, this._scene);
        this._groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this._scene);
        this._groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.8); // Changed from green to blue
        this._ground.material = this._groundMaterial;
        this._ground.receiveShadows = true;
        this._shadowGenerator = new BABYLON.ShadowGenerator(3024, this._light);

        this._leftWall = BABYLON.MeshBuilder.CreateBox("leftWall", {width: 0.1, height: 0.3, depth: 12}, this._scene);
        this._leftWall.position = new BABYLON.Vector3(-3.05, 0.12, 0);
        this._rightWall = this._leftWall.clone("rightWall");
        this._rightWall.position.x = 3.05;

        this._topSlider = BABYLON.MeshBuilder.CreateBox("topSlider", {
            width: 1.3, height: 0.3, depth: 0.35
        }, this._scene);
        this._topSlider.position = new BABYLON.Vector3(0, 0.15, 6.05);

        this._bottomSlider = this._topSlider.clone("bottomSlider");
        this._bottomSlider.position.z = -6.05;

        this._ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.3 }, this._scene);
        this._ball.position = new BABYLON.Vector3(0, 0.15, 0);
        this._ballVelocity = new BABYLON.Vector3(
            Math.random() < 0.5 ? -this._ballSpeed : this._ballSpeed,
            0,
            Math.random() < 0.5 ? -this._ballSpeed : this._ballSpeed
        );
        
        // Add ball to shadow rendering
        this._shadowGenerator.getShadowMap().renderList.push(this._ball);

        this._shadowGenerator.getShadowMap().renderList.push(this._rightWall, this._leftWall, this._topSlider, this._bottomSlider);
        this._shadowGenerator.usePoissonSampling = true;
        this._shadowGenerator.useBlurExponentialShadowMap = true;

        window.addEventListener("keydown", (event) => {
            
            // to hide/how inspector: Shift+Ctrl+Alt+I
            if (event.shiftKey && event.ctrlKey && event.altKey && (event.key === "I" || event.key === "i")) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show({embedMode: false}).then(function () {
                        document.getElementById("scene-explorer-host").style.zIndex = "1000";
                        document.getElementById("inspector-host").style.zIndex = "1000";
                        document.getElementById("scene-explorer-host").style.position = "fixed";
                        document.getElementById("inspector-host").style.position = "fixed";
                    });
                }
                return ;
            }

            // store the slider's movement keys
            this._pressedKeys[event.key.toLocaleLowerCase()] = true;
        })

        window.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLocaleLowerCase()] = false;
        });

        window.addEventListener("resize", () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        })

    }

    private resetBall(): void {
        this._ball.position = new BABYLON.Vector3(0, 0.15, 0);
        this._ballVelocity = new BABYLON.Vector3(
            Math.random() < 0.5 ? -this._ballSpeed : this._ballSpeed,
            0,
            Math.random() < 0.5 ? -this._ballSpeed : this._ballSpeed
        );
    }

    private checkCollisions(): void {
        // Wall collisions
        if (this._ball.position.x <= -2.9 || this._ball.position.x >= 2.9) {
            this._ballVelocity.x *= -1;
        }

        // Slider collisions - separate checks for top and bottom sliders to fix glitching
        if (this._ball.intersectsMesh(this._topSlider)) {
            // Only change direction if ball is moving toward the paddle
            if (this._ballVelocity.z > 0) {
                // Calculate where on the paddle the ball hit
                const hitPosition = this._ball.position.x - this._topSlider.position.x;
                // Normalize to range -1 to 1 (paddle width is 1.3)
                const normalizedHit = hitPosition / (1.3/2);
                
                // Increase speed only after first collision
                if (this._firstCollision) {
                    const speedMultiplier = 1.5;
                    this._ballVelocity.z *= -speedMultiplier;
                    this._ballVelocity.x = this._ballSpeed * normalizedHit * 1.5;
                    this._firstCollision = false;
                } else {
                    this._ballVelocity.z *= -1;
                    // Adjust x direction based on where ball hit the paddle
                    this._ballVelocity.x = this._ballSpeed * normalizedHit * 1.5;
                }
                
                // Push ball away from paddle to prevent multiple collisions
                this._ball.position.z = this._topSlider.position.z - 0.35;
            }
        } 
        
        if (this._ball.intersectsMesh(this._bottomSlider)) {
            // Only change direction if ball is moving toward the paddle
            if (this._ballVelocity.z < 0) {
                // Calculate where on the paddle the ball hit
                const hitPosition = this._ball.position.x - this._bottomSlider.position.x;
                // Normalize to range -1 to 1 (paddle width is 1.3)
                const normalizedHit = hitPosition / (1.3/2);
                
                // Increase speed only after first collision
                if (this._firstCollision) {
                    const speedMultiplier = 1.5;
                    this._ballVelocity.z *= -speedMultiplier;
                    this._ballVelocity.x = this._ballSpeed * normalizedHit * 1.5;
                    this._firstCollision = false;
                } else {
                    this._ballVelocity.z *= -1;
                    // Adjust x direction based on where ball hit the paddle
                    this._ballVelocity.x = this._ballSpeed * normalizedHit * 1.5;
                }
                
                // Push ball away from paddle to prevent multiple collisions
                this._ball.position.z = this._bottomSlider.position.z + 0.35;
            }
        }

        // Score detection
        if (this._ball.position.z >= 6.5) {
            this._score.player1++;
            this.resetBall();
            this._firstCollision = true; // Reset the collision flag for the new round
        } else if (this._ball.position.z <= -6.5) {
            this._score.player2++;
            this.resetBall();
            this._firstCollision = true; // Reset the collision flag for the new round
        }
    }

    private updateBall(): void {
        this._ball.position.addInPlace(this._ballVelocity);
        this.checkCollisions();
    }

    public mainLoop(): void {
        this.slidersAnimation();
        
        // run the main render loop
        this._engine.runRenderLoop(() => {
            this.updateBall();
            this._scene.render();
        });
    }
}

let game: App = new App();
game.mainLoop();