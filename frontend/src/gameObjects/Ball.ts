import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";

export class Ball extends GameObject {
    private _velocity: BABYLON.Vector3;
    private _initialSpeed: number = 0.1;
    private _active: boolean = false;

    constructor(scene: BABYLON.Scene) {
        super(scene);
        this._initMesh();
        this.reset();
    }

    private _initMesh(): void {
        this._mesh = BABYLON.MeshBuilder.CreateSphere(
            "ball", 
            { diameter: 0.4 }, 
            this._scene
        );
        this._mesh.position = new BABYLON.Vector3(0, 0.2, 0);
        
        const ballMaterial = new BABYLON.StandardMaterial("ballMaterial", this._scene);
        ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.7); // Yellow glow
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
        this._mesh.position = new BABYLON.Vector3(0, 0.2, 0);
        this._velocity = new BABYLON.Vector3(0, 0, 0);
        this._active = false;
    }

    public start(): void {
        this._active = true;
        this._velocity = new BABYLON.Vector3(
            (Math.random() - 0.5) * this._initialSpeed, 
            0, 
            this._initialSpeed * (Math.random() > 0.5 ? 1 : -1)
        );
    }

    public addSpin(hitFactor: number): void {
        this._velocity.x += hitFactor * 0.1;
    }

    public reverseZ(): void {
        this._velocity.z *= -1;
    }

    public reverseX(): void {
        this._velocity.x *= -1;
    }
}