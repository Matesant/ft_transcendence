import { Scene, MeshBuilder, StandardMaterial } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export enum PaddleType {
    LEFT,
    RIGHT
}

export class Paddle extends GameObject {
    private _type: PaddleType;
    private _speedMultiplier: number = 1.0;
    private _lastTime: number = 0;

    constructor(scene: Scene, type: PaddleType) {
        super(scene);
        this._type = type;
        this._lastTime = Date.now();
        this._initMesh();
    }

    private _initMesh(): void {
        this._mesh = MeshBuilder.CreateBox(
            this._type === PaddleType.LEFT ? "leftPaddle" : "rightPaddle", 
            {
                width: CONFIG.PADDLE.DIMENSIONS.x, 
                height: CONFIG.PADDLE.DIMENSIONS.y, 
                depth: CONFIG.PADDLE.DIMENSIONS.z
            }, 
            this._scene
        );
        
        const paddlePosition = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.POSITION.LEFT.clone() 
            : CONFIG.PADDLE.POSITION.RIGHT.clone();
        this._mesh.position = paddlePosition;
        
        const material = new StandardMaterial(
            this._type === PaddleType.LEFT ? "leftPaddleMaterial" : "rightPaddleMaterial", 
            this._scene
        );
        
        material.emissiveColor = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.COLOR.LEFT 
            : CONFIG.PADDLE.COLOR.RIGHT;
            
        this._mesh.material = material;
    }

    public update(): void {
    }

    public moveLeft(): void {
        const currentTime = Date.now();
        const deltaTime = Math.min((currentTime - this._lastTime) / 16.67, 2.0);
        this._lastTime = currentTime;
        
        const actualPaddleHalfWidth = (CONFIG.PADDLE.DIMENSIONS.x / 2) * this._mesh.scaling.x;
        const leftBoundary = CONFIG.WALL.POSITION.TOP.x + (CONFIG.WALL.DIMENSIONS.x / 2) + actualPaddleHalfWidth + 0.05; // Add small margin
        
        if (this._mesh.position.x > leftBoundary) {
            this._mesh.position.x -= CONFIG.PADDLE.MOVE_SPEED * this._speedMultiplier * deltaTime;
        }
    }

    public moveRight(): void {
        const currentTime = Date.now();
        const deltaTime = Math.min((currentTime - this._lastTime) / 16.67, 2.0);
        this._lastTime = currentTime;
        
        const actualPaddleHalfWidth = (CONFIG.PADDLE.DIMENSIONS.x / 2) * this._mesh.scaling.x;
        const rightBoundary = CONFIG.WALL.POSITION.BOTTOM.x - (CONFIG.WALL.DIMENSIONS.x / 2) - actualPaddleHalfWidth - 0.05; // Add small margin
        
        if (this._mesh.position.x < rightBoundary) {
            this._mesh.position.x += CONFIG.PADDLE.MOVE_SPEED * this._speedMultiplier * deltaTime;
        }
    }

    public setSpeedMultiplier(multiplier: number): void {
        this._speedMultiplier = multiplier;
    }

    public get width(): number {
        return CONFIG.PADDLE.DIMENSIONS.x;
    }

    public reset(): void {
        const paddlePosition = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.POSITION.LEFT.clone() 
            : CONFIG.PADDLE.POSITION.RIGHT.clone();
        this._mesh.position = paddlePosition;
        this._lastTime = Date.now();
    }

    public resize(scaleFactor: number): void {
        this._mesh.scaling.x = scaleFactor;
    }
}