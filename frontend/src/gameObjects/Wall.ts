import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";

export enum WallType {
    TOP,
    BOTTOM
}

export class Wall extends GameObject {
    constructor(scene: BABYLON.Scene, type: WallType) {
        super(scene);
        this._initMesh(type);
    }

    private _initMesh(type: WallType): void {
        this._mesh = BABYLON.MeshBuilder.CreateBox(
            type === WallType.TOP ? "topWall" : "bottomWall",
            {width: 0.1, height: 0.3, depth: 17},
            this._scene
        );
        
        const xPosition = type === WallType.TOP ? -6.05 : 6.05;
        this._mesh.position = new BABYLON.Vector3(xPosition, 0.15, 0);
        
        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", this._scene);
        wallMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White glow
        this._mesh.material = wallMaterial;
    }

    public update(): void {
        // Walls don't need updating
    }
}