import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Camera, UniversalCamera, Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Color4, StandardMaterial, Color3 } from "@babylonjs/core";

function drawDashedLine(scene: Scene): void {
    const start = new Vector3(0, -1, 0);
    const end = new Vector3(0, 1, 0);
   
    const dashedLine = MeshBuilder.CreateDashedLines("dashedLine", {
        points: [start, end],
        dashSize: 3,
        gapSize: 1
    }, scene);

    const lineMaterial = new StandardMaterial("lineMaterial", scene);
    lineMaterial.emissiveColor = new Color3(1, 1, 1);
    dashedLine.material = lineMaterial;
}

/**
 * Cria os limites do jogo (faixas brancas no topo e na base da cena).
 * @param scene - A cena do Babylon.js onde os limites serão desenhados.
 */
function createGameBoundaries(scene: Scene): void {
    // Configurações das faixas
    const boundaryWidth = 20; // Altura das faixas
    const boundaryHeight = 1; // Espessura das faixas
    const boundaryDepth = 100; // Largura da faixa (profundidade da cena)

    // Material branco para as faixas
    const boundaryMaterial = new StandardMaterial("boundaryMaterial", scene);
    boundaryMaterial.diffuseColor = Color3.White();

    // Faixa superior
    const topBoundary = MeshBuilder.CreateBox("topBoundary", {
        width: boundaryDepth,
        height: boundaryHeight,
        depth: boundaryWidth,
    }, scene);
    topBoundary.material = boundaryMaterial;
    topBoundary.position = new Vector3(0, boundaryHeight / 2, -boundaryWidth / 2);

    // Faixa inferior
    const bottomBoundary = MeshBuilder.CreateBox("bottomBoundary", {
        width: boundaryDepth,
        height: boundaryHeight,
        depth: boundaryWidth,
    }, scene);
    bottomBoundary.material = boundaryMaterial;
    bottomBoundary.position = new Vector3(0, -boundaryHeight / 2, -boundaryWidth / 2);
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
        this._scene.clearColor = new Color4(0, 0.4, 0.3, 1.0);

        this._camera = new UniversalCamera("UniversalCamera", new Vector3(0, 0, -10), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.setTarget(Vector3.Zero());
        
        // this._camera.attachControl(this._canvas, true);
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

        const light = new HemisphericLight("light", new Vector3(0, 1, 0));

        // createGameBoundaries(this._scene);

        const box = MeshBuilder.CreateBox("box", {}); //unit cube
        box.scaling = new Vector3(0.03, 0.18, 0.1);
        box.position = new Vector3(-0.90, 0, 0);
        // box.rotation = new Vector3(0, 0, Math.PI / 2);


        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }
}

let game: App = new App();
game.mainLoop();