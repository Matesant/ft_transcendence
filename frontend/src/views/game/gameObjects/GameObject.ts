import { Mesh, Scene } from "@babylonjs/core";

export abstract class GameObject {
    protected _mesh: Mesh;
    protected _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public get mesh(): Mesh {
        return this._mesh;
    }

    public abstract update(): void;
}