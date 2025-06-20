import * as BABYLON from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export class PowerUp extends GameObject {
    private _type: string;
    private _active: boolean = true;
    
    constructor(scene: BABYLON.Scene, type: string, position: BABYLON.Vector3) {
        super(scene);
        this._type = type;
        this._initMesh(position);
    }
    
    private _initMesh(position: BABYLON.Vector3): void {
        // Create a box for the power-up
        this._mesh = BABYLON.MeshBuilder.CreateBox(
            `powerUp_${this._type}`,
            {
                width: CONFIG.POWER_UPS.DIMENSIONS.x,
                height: CONFIG.POWER_UPS.DIMENSIONS.y,
                depth: CONFIG.POWER_UPS.DIMENSIONS.z
            },
            this._scene
        );
        
        this._mesh.position = position;
        
        // Create material based on power-up type
        const material = new BABYLON.StandardMaterial(`powerUpMaterial_${this._type}`, this._scene);
        
        // Fix the color mapping based on type
        switch(this._type) {
            case CONFIG.POWER_UPS.TYPES.LARGER_PADDLE:
                material.emissiveColor = CONFIG.POWER_UPS.COLORS.LARGER_PADDLE;
                break;
            case CONFIG.POWER_UPS.TYPES.SMALLER_OPPONENT:
                material.emissiveColor = CONFIG.POWER_UPS.COLORS.SMALLER_OPPONENT;
                break;
            case CONFIG.POWER_UPS.TYPES.FAST_BALL:
                material.emissiveColor = CONFIG.POWER_UPS.COLORS.FAST_BALL;
                break;
            case CONFIG.POWER_UPS.TYPES.MULTI_BALL:
                material.emissiveColor = CONFIG.POWER_UPS.COLORS.MULTI_BALL;
                break;
            default:
                material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        }
        
        material.alpha = 0.8;
        this._mesh.material = material;
    }
    
    public update(): void {
        if (this._active) {
            // Rotate the power-up for visual effect
            this._mesh.rotation.y += CONFIG.POWER_UPS.ROTATION_SPEED;
        }
    }
    
    public get type(): string {
        return this._type;
    }
    
    public get active(): boolean {
        return this._active;
    }
    
    public deactivate(): void {
        this._active = false;
        this._mesh.dispose();
    }
}