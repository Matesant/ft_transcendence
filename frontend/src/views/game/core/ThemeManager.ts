import { StandardMaterial, Mesh, Color3, Scene } from "@babylonjs/core";
import { CONFIG } from "../config";

export class ThemeManager {
    private _tableTheme: 'GREEN' | 'BLUE' = 'GREEN';
    private _ground: Mesh;
    private _scene: Scene;

    constructor(scene: Scene, ground: Mesh) {
        this._scene = scene;
        this._ground = ground;
    }

    public toggleTableTheme(): void {
        this._tableTheme = this._tableTheme === 'GREEN' ? 'BLUE' : 'GREEN';
        const groundMaterial = this._ground.material as StandardMaterial;
        groundMaterial.diffuseColor = CONFIG.TABLE_THEMES[this._tableTheme].FIELD_COLOR;
        this._scene.clearColor = CONFIG.TABLE_THEMES[this._tableTheme].BACKGROUND_COLOR;
    }

    public get tableTheme() { return this._tableTheme; }
}
