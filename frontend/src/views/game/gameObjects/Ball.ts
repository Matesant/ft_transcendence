import { Vector3, Scene, MeshBuilder, StandardMaterial } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export const DIRECTION = {
    LEFT: -1,
    RIGHT: 1
};

export class Ball extends GameObject {
    private _velocity: Vector3;
    private _active: boolean = false;
    private _lastTime: number = 0;

    constructor(scene: Scene) {
        super(scene);
        this._initMesh();
        this.reset();
        this._lastTime = Date.now();
    }

    private _initMesh(): void {
        this._mesh = MeshBuilder.CreateSphere(
            "ball", 
            { diameter: CONFIG.BALL.DIAMETER }, 
            this._scene
        );
        this._mesh.position = CONFIG.BALL.POSITION.clone();
        
        const ballMaterial = new StandardMaterial("ballMaterial", this._scene);
        ballMaterial.emissiveColor = CONFIG.BALL.COLOR;
        this._mesh.material = ballMaterial;
    }

    public get velocity(): Vector3 {
        return this._velocity;
    }

    public set velocity(value: Vector3) {
        this._velocity = value;
    }

    public get active(): boolean {
        return this._active;
    }

    public set active(value: boolean) {
        this._active = value;
    }

    public update(): void {
        if (this._active) {
            const currentTime = Date.now();
            const deltaTime = Math.min((currentTime - this._lastTime) / 16.67, 2.0);
            this._lastTime = currentTime;
            
            const movement = this._velocity.scale(deltaTime);
            this._mesh.position.addInPlace(movement);
            
            if (Math.random() < 0.001) {
            }
        }
    }

    public reset(): void {
        this._mesh.position = CONFIG.BALL.POSITION.clone();
        this._velocity = new Vector3(0, 0, 0);
        this._active = false;
        this._lastTime = Date.now();
    }

    public start(directionZ?: number): void {
        this._active = true;
        this._lastTime = Date.now();
        
        let zDirection;
        if (directionZ !== undefined) {
            zDirection = directionZ;
        } else {
            if (Math.random() > 0.5) {
                zDirection = DIRECTION.RIGHT;
            } else {
                zDirection = DIRECTION.LEFT;
            }
        }
        
        this._velocity = new Vector3(
            (Math.random() - 0.5) * CONFIG.BALL.INITIAL_SPEED, 
            0, 
            CONFIG.BALL.INITIAL_SPEED * zDirection
        );
    }

    public addSpin(hitFactor: number): void {
        this._velocity.x += hitFactor * CONFIG.BALL.SPIN_FACTOR;
    }

    public reverseZ(): void {
        this._velocity.z *= -1;
    }

    public reverseX(): void {
        this._velocity.x *= -1;
        
        const speed = this._velocity.length();
        
        const xRatio = Math.abs(this._velocity.x) / speed;
        
        if (xRatio < 0.2) {
            const minXComponent = speed * 0.3; 
            
            const xDirection = this._velocity.x >= 0 ? 1 : -1;
            
            this._velocity.x = minXComponent * xDirection;
            
            const newZMagnitude = Math.sqrt(speed * speed - this._velocity.x * this._velocity.x);
            const zDirection = this._velocity.z >= 0 ? 1 : -1;
            this._velocity.z = newZMagnitude * zDirection;
        }
    }

    public setSpeedMultiplier(multiplier: number): void {
        this._velocity = this._velocity.scale(multiplier);
    }
}