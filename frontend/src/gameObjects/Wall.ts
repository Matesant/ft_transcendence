import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

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
            {
                width: CONFIG.WALL.DIMENSIONS.x, 
                height: CONFIG.WALL.DIMENSIONS.y, 
                depth: CONFIG.WALL.DIMENSIONS.z
            },
            this._scene
        );
        
        const position = type === WallType.TOP 
            ? CONFIG.WALL.POSITION.TOP.clone() 
            : CONFIG.WALL.POSITION.BOTTOM.clone();
        this._mesh.position = position;
        
        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", this._scene);
        wallMaterial.emissiveColor = CONFIG.WALL.COLOR;
        this._mesh.material = wallMaterial;
    }

    public update(): void {
        // Walls don't need updating
    }
}