import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import { GameManager } from "./managers/GameManager";

const SCENE_ROTATION_DEGREES = 90;

class App {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _gameManager: GameManager;

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
        
        // Camera setup
        const camera = new BABYLON.ArcRotateCamera(
            "Camera", 
            Math.PI + BABYLON.Tools.ToRadians(SCENE_ROTATION_DEGREES), // alpha - rotate horizontally
            Math.PI/4, // beta - looking down at an angle
            22, // radius - distance
            new BABYLON.Vector3(0, 0, 0), 
            this._scene
        );
        camera.setTarget(BABYLON.Vector3.Zero());
        
        // Ambient light
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this._scene
        );
        ambientLight.intensity = 0.7;
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        
        // Add glow effect
        const glowLayer = new BABYLON.GlowLayer("glowLayer", this._scene);
        glowLayer.intensity = 0.7;
        
        // Initialize game manager
        this._gameManager = new GameManager(this._scene);
        
        // Handle debug inspector toggle
        window.addEventListener("keydown", (event) => {
            if (event.shiftKey && event.ctrlKey && event.altKey && event.key === "i") {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });
        
        // Handle window resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });
    }
    
    public mainLoop(): void {
        this._engine.runRenderLoop(() => {
            this._gameManager.update();
            this._scene.render();
        });
    }
}

// Create and start the game
const game = new App();
game.mainLoop();