import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import { GameManager, GameMode } from "./views/game/managers/GameManager";
import { CONFIG } from "./views/game/config";

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
        this._canvas.id = CONFIG.CANVAS_ID;
        document.body.appendChild(this._canvas);

        // Engine and scene setup
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);
        this._scene.clearColor = CONFIG.SCENE.CLEAR_COLOR;
        
        // Camera setup
        const camera = new BABYLON.ArcRotateCamera(
            "Camera", 
            Math.PI + BABYLON.Tools.ToRadians(CONFIG.SCENE_ROTATION_DEGREES),
            CONFIG.CAMERA.BETA,
            CONFIG.CAMERA.RADIUS,
            CONFIG.CAMERA.TARGET,
            this._scene
        );
        camera.setTarget(BABYLON.Vector3.Zero());
        
        // Ambient light
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight", 
            CONFIG.AMBIENT_LIGHT.DIRECTION,
            this._scene
        );
        ambientLight.intensity = CONFIG.AMBIENT_LIGHT.INTENSITY;
        ambientLight.diffuse = CONFIG.AMBIENT_LIGHT.DIFFUSE;
        
        // Add glow effect
        const glowLayer = new BABYLON.GlowLayer("glowLayer", this._scene);
        glowLayer.intensity = CONFIG.GLOW.INTENSITY;
        
        // Initialize game manager
        this._gameManager = new GameManager(this._scene);

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
        // Sempre pare qualquer render loop anterior
        this._engine.stopRenderLoop();

        if (this._gameManager.gameMode === GameMode.MULTIPLAYER_HOST) {
            // Usa setInterval para multiplayer host
            setInterval(() => {
                this._gameManager.update();
                this._scene.render();
            }, 16); // ~60 FPS
        } else {
            // Usa o render loop padrão para os outros modos
            this._engine.runRenderLoop(() => {
                this._gameManager.update();
                this._scene.render();
            });
        }
    }
}

// Create and start the game
const game = new App();
game.mainLoop();
import { router } from "./router/Router";
import "./components/itemSidebar/itemSidebar"
import "./components/startTournament/startTournament";
import "./components/tournamentRounds/tournamentRounds";


window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
