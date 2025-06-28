import { Scene, MeshBuilder, StandardMaterial } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export enum PaddleType {
    LEFT,
    RIGHT
}

export class Paddle extends GameObject {
    private _type: PaddleType;

    constructor(scene: Scene, type: PaddleType) {
        super(scene);
        this._type = type;
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
        
        // Position paddles at left/right of field
        const paddlePosition = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.POSITION.LEFT.clone() 
            : CONFIG.PADDLE.POSITION.RIGHT.clone();
        this._mesh.position = paddlePosition;
        
        // Create materials with appropriate colors
        const material = new StandardMaterial(
            this._type === PaddleType.LEFT ? "leftPaddleMaterial" : "rightPaddleMaterial", 
            this._scene
        );
        
        // Blue for left paddle, red for right paddle
        material.emissiveColor = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.COLOR.LEFT 
            : CONFIG.PADDLE.COLOR.RIGHT;
            
        this._mesh.material = material;
    }

    public update(): void {
        // Movement is handled by InputManager
    }

    public moveLeft(): void {
        if (this._mesh.position.x > CONFIG.PADDLE.POSITION_LIMIT.MIN) {
            this._mesh.position.x -= CONFIG.PADDLE.MOVE_SPEED;
        }
    }

    public moveRight(): void {
        if (this._mesh.position.x < CONFIG.PADDLE.POSITION_LIMIT.MAX) {
            this._mesh.position.x += CONFIG.PADDLE.MOVE_SPEED;
        }
    }

    public get width(): number {
        return CONFIG.PADDLE.DIMENSIONS.x;
    }

    public reset(): void {
        const paddlePosition = this._type === PaddleType.LEFT 
            ? CONFIG.PADDLE.POSITION.LEFT.clone() 
            : CONFIG.PADDLE.POSITION.RIGHT.clone();
        this._mesh.position = paddlePosition;
    }

    public resize(scaleFactor: number): void {
        // Resize the paddle mesh width
        this._mesh.scaling.x = scaleFactor;
    }
}