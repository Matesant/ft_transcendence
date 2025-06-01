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
    private _slidersMoveSpeed: number = 0.1;

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
        this._groundMaterial.diffuseColor = new BABYLON.Color3(0.28, 0.77, 0.39);
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

    public mainLoop(): void {
        
        this.slidersAnimation();
        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }
}

let game: App = new App();
game.mainLoop();