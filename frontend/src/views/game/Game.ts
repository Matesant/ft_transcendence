import { Scene, Engine, ArcRotateCamera, Tools, Vector3, HemisphericLight, GlowLayer } from "@babylonjs/core";
import { GameManager } from "./managers/GameManager";
import { RemoteGameManager } from "./managers/RemoteGameManager";
import { CONFIG } from "./config";
import { AView } from "../AView";

export type GameMode = 'local' | 'remote';

export class Game extends AView {
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _gameManager: GameManager | RemoteGameManager;
    private _gameMode: GameMode;
    private _onGameStarted?: () => void;

    constructor(gameMode: GameMode = 'local', playerId?: string, playerName?: string, onGameStarted?: () => void, fromLobby: boolean = false) {
        // Canvas setup
        super();
        this._gameMode = gameMode;
        this._onGameStarted = onGameStarted;
        this._canvas = document.createElement("canvas");
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._canvas.id = CONFIG.CANVAS_ID;
        document.body.appendChild(this._canvas);

        // Engine and scene setup
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = CONFIG.SCENE.CLEAR_COLOR;
        
        // Camera setup
        const camera = new ArcRotateCamera(
            "Camera", 
            Math.PI + Tools.ToRadians(CONFIG.SCENE_ROTATION_DEGREES),
            CONFIG.CAMERA.BETA,
            CONFIG.CAMERA.RADIUS,
            CONFIG.CAMERA.TARGET,
            this._scene
        );
        camera.setTarget(Vector3.Zero());
        
        // Ambient light
        const ambientLight = new HemisphericLight(
            "ambientLight", 
            CONFIG.AMBIENT_LIGHT.DIRECTION,
            this._scene
        );
        ambientLight.intensity = CONFIG.AMBIENT_LIGHT.INTENSITY;
        ambientLight.diffuse = CONFIG.AMBIENT_LIGHT.DIFFUSE;
        
        // Add glow effect
        const glowLayer = new GlowLayer("glowLayer", this._scene);
        glowLayer.intensity = CONFIG.GLOW.INTENSITY;
        
        // Initialize appropriate game manager based on mode
        if (this._gameMode === 'remote') {
            if (!playerId || !playerName) {
                throw new Error('Player ID and name are required for remote game mode');
            }
            this._gameManager = new RemoteGameManager(this._scene, playerId, playerName, this._onGameStarted, fromLobby);
        } else {
            this._gameManager = new GameManager(this._scene);
            // For local games, call the callback immediately since the game starts right away
            if (this._onGameStarted) {
                this._onGameStarted();
            }
        }

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
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._engine.resize();
        });
    }
    
    public render(): void {
        this._engine.runRenderLoop(() => {
            this._gameManager.update();
            this._scene.render();
        })
    }

    public dispose(): void {
        // Stop the render loop
        this._engine.stopRenderLoop();

        // Disconnect network manager if in remote mode
        if (this._gameMode === 'remote' && 'disconnect' in this._gameManager) {
            (this._gameManager as RemoteGameManager).disconnect();
        }

        // Dispose of the Babylon.js engine and scene
        this._scene.dispose();
        this._engine.dispose();

        // Remove the canvas element from the DOM
        if (this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }

        // Clean up other resources if necessary
        this._gameManager = null!;

        // Remove the event listener when needed
    }

    public getGameMode(): GameMode {
        return this._gameMode;
    }
}

// Create and start the game
// const game = new Game();
// game.mainLoop();