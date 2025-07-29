import { Scene, MeshBuilder, StandardMaterial, Mesh } from "@babylonjs/core";
import { CONFIG } from "../config";

export class FieldManager {
    private _scene: Scene;
    private _ground: Mesh;
    private _tableTheme: 'GREEN' | 'BLUE' = 'GREEN';

    constructor(scene: Scene) {
        this._scene = scene;
        this._createPlayingField();
    }

    public toggleTableTheme(): void {
        this._tableTheme = this._tableTheme === 'GREEN' ? 'BLUE' : 'GREEN';
        this._updateTableTheme();
    }

    public setTableTheme(theme: 'GREEN' | 'BLUE'): void {
        this._tableTheme = theme;
        this._updateTableTheme();
    }

    public getTableTheme(): 'GREEN' | 'BLUE' {
        return this._tableTheme;
    }

    private _createPlayingField(): void {
        this._ground = MeshBuilder.CreateGround(
            "ground", 
            { width: CONFIG.FIELD.WIDTH, height: CONFIG.FIELD.HEIGHT }, 
            this._scene
        );
        const groundMaterial = new StandardMaterial("groundMaterial", this._scene);
        groundMaterial.diffuseColor = CONFIG.TABLE_THEMES[this._tableTheme].FIELD_COLOR;
        this._ground.material = groundMaterial;
        
        this._createCenterLines();
        
        this._scene.clearColor = CONFIG.TABLE_THEMES[this._tableTheme].BACKGROUND_COLOR;
    }

    private _createCenterLines(): void {
        const lineMaterial = new StandardMaterial("lineMaterial", this._scene);
        lineMaterial.emissiveColor = CONFIG.CENTER_LINE.COLOR;
        lineMaterial.alpha = CONFIG.CENTER_LINE.ALPHA;
        
        const centerLineVertical = MeshBuilder.CreateBox(
            "centerLineVertical", 
            {
                width: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineVertical.position = CONFIG.CENTER_LINE.VERTICAL.POSITION.clone();
        centerLineVertical.material = lineMaterial;
        
        const centerLineHorizontal = MeshBuilder.CreateBox(
            "centerLineHorizontal", 
            {
                width: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineHorizontal.position = CONFIG.CENTER_LINE.HORIZONTAL.POSITION.clone();
        centerLineHorizontal.material = lineMaterial;
    }

    private _updateTableTheme(): void {
        const groundMaterial = this._ground.material as StandardMaterial;
        groundMaterial.diffuseColor = CONFIG.TABLE_THEMES[this._tableTheme].FIELD_COLOR;
        
        this._scene.clearColor = CONFIG.TABLE_THEMES[this._tableTheme].BACKGROUND_COLOR;
    }
}
