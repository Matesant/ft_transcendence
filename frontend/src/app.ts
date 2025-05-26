import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Camera, UniversalCamera, Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, StandardMaterial, Color3 } from "@babylonjs/core";

function drawDashedLine(scene: Scene): void {
    const start = new Vector3(0, -1, 0);
    const end = new Vector3(0, 1, 0);
   
    const dashedLine = MeshBuilder.CreateDashedLines("dashedLine", {
        points: [start, end],
        dashSize: 0.5,
        gapSize: 0.5
    }, scene);

    const lineMaterial = new StandardMaterial("lineMaterial", scene);
    lineMaterial.emissiveColor = new Color3(1, 1, 1);
    dashedLine.material = lineMaterial;
}

class App {
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: UniversalCamera;

    constructor() {

        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        this._engine = new Engine(this._canvas, true);

        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.0, 0.0, 0.0, 1.0);

        this._camera = new UniversalCamera("UniversalCamera", new Vector3(0, 0, -10), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.setTarget(Vector3.Zero());
        
        // camera.attachControl(canvas, true);
        const ratio = this._canvas.height / this._canvas.width;
        if ( ratio > 1) {
            this._camera.orthoLeft = -1 / 2;
            this._camera.orthoRight = 1 / 2;
            this._camera.orthoTop = 1 * ratio / 2;
            this._camera.orthoBottom = -1 * ratio / 2;
        } else {
            this._camera.orthoTop = 1 / 2;
            this._camera.orthoBottom = -1 / 2;
            this._camera.orthoLeft = -1 / ratio / 2;
            this._camera.orthoRight = 1 / ratio / 2;
        }

        drawDashedLine(this._scene);
    }

    public mainLoop(): void {
        
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {

            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && (ev.key === "I" || ev.key === "i")) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }
}

let game: App = new App();
game.mainLoop();