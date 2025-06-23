import * as BABYLON from "@babylonjs/core";

export abstract class GameObject {
    protected _mesh: BABYLON.Mesh;
    protected _scene: BABYLON.Scene;

    constructor(scene: BABYLON.Scene) {
        this._scene = scene;
    }

    public get mesh(): BABYLON.Mesh {
        return this._mesh;
    }

    public abstract update(): void;
}