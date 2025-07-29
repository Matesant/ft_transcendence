import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { CONFIG } from "../config";

export class PowerUp extends GameObject {
    private _type: string;
    private _active: boolean = true;
    private _lastTime: number = 0;
    
    constructor(scene: Scene, type: string, position: Vector3) {
        super(scene);
        this._type = type;
        this._lastTime = Date.now();
        this._initMesh(position);
    }
    
    private _initMesh(position: Vector3): void {
        this._mesh = MeshBuilder.CreateBox(
            `powerUp_${this._type}`,
            {
                width: CONFIG.POWER_UPS.DIMENSIONS.x,
                height: CONFIG.POWER_UPS.DIMENSIONS.y,
                depth: CONFIG.POWER_UPS.DIMENSIONS.z
            },
            this._scene
        );
        
        this._mesh.position = position;
        
        const material = new StandardMaterial(`powerUpMaterial_${this._type}`, this._scene);
        
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
                material.emissiveColor = new Color3(1, 1, 1);
        }
        
        material.alpha = 0.8;
        this._mesh.material = material;
    }
    
    public update(): void {
        if (this._active) {
            const currentTime = Date.now();
            const deltaTime = Math.min((currentTime - this._lastTime) / 16.67, 2.0);
            this._lastTime = currentTime;
            
            this._mesh.rotation.y += CONFIG.POWER_UPS.ROTATION_SPEED * deltaTime;
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