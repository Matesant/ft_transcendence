import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";

export enum PaddleType {
    LEFT,
    RIGHT
}

export class Paddle extends GameObject {
    private _type: PaddleType;
    private _moveSpeed: number = 0.175;
    private _width: number = 1.3;

    constructor(scene: BABYLON.Scene, type: PaddleType) {
        super(scene);
        this._type = type;
        this._initMesh();
    }

    private _initMesh(): void {
        this._mesh = BABYLON.MeshBuilder.CreateBox(
            this._type === PaddleType.LEFT ? "leftPaddle" : "rightPaddle", 
            {width: this._width, height: 0.3, depth: 0.35}, 
            this._scene
        );
        
        // Position paddles at left/right of field
        const zPosition = this._type === PaddleType.LEFT ? -8.25 : 8.25;
        this._mesh.position = new BABYLON.Vector3(0, 0.15, zPosition);
        
        // Create materials with appropriate colors
        const material = new BABYLON.StandardMaterial(
            this._type === PaddleType.LEFT ? "leftPaddleMaterial" : "rightPaddleMaterial", 
            this._scene
        );
        
        // Blue for left paddle, red for right paddle
        material.emissiveColor = this._type === PaddleType.LEFT 
            ? new BABYLON.Color3(0.2, 0.6, 1) 
            : new BABYLON.Color3(1, 0.3, 0.3);
            
        this._mesh.material = material;
    }

    public update(): void {
        // Movement is handled by InputManager
    }

    public moveLeft(): void {
        if (this._mesh.position.x > -5) {
            this._mesh.position.x -= this._moveSpeed;
        }
    }

    public moveRight(): void {
        if (this._mesh.position.x < 5) {
            this._mesh.position.x += this._moveSpeed;
        }
    }

    public get width(): number {
        return this._width;
    }
}