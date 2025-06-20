import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export const DIRECTION = {
    LEFT: -1,
    RIGHT: 1
};

export class Ball extends GameObject {
    private _velocity: BABYLON.Vector3;
    private _active: boolean = false;

    constructor(scene: BABYLON.Scene) {
        super(scene);
        this._initMesh();
        this.reset();
    }

    private _initMesh(): void {
        this._mesh = BABYLON.MeshBuilder.CreateSphere(
            "ball", 
            { diameter: CONFIG.BALL.DIAMETER }, 
            this._scene
        );
        this._mesh.position = CONFIG.BALL.POSITION.clone();
        
        const ballMaterial = new BABYLON.StandardMaterial("ballMaterial", this._scene);
        ballMaterial.emissiveColor = CONFIG.BALL.COLOR;
        this._mesh.material = ballMaterial;
    }

    public get velocity(): BABYLON.Vector3 {
        return this._velocity;
    }

    public set velocity(value: BABYLON.Vector3) {
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
            this._mesh.position.addInPlace(this._velocity);
        }
    }

    public reset(): void {
        this._mesh.position = CONFIG.BALL.POSITION.clone();
        this._velocity = new BABYLON.Vector3(0, 0, 0);
        this._active = false;
    }

    public start(directionZ?: number): void {
        this._active = true;
        
        // Use provided direction or random if not specified
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
        
        this._velocity = new BABYLON.Vector3(
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
    }
}