export class InputManager {
    private _pressedKeys: { [key: string]: boolean } = {};
    
    constructor() {
        this._setupEventListeners();
    }
    
    private _setupEventListeners(): void {
        window.addEventListener("keydown", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = true;
        });
        
        window.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = false;
        });
    }
    
    public isKeyPressed(key: string): boolean {
        if (key === "space" && this._pressedKeys[" "]) {
            return true;
        }
        return !!this._pressedKeys[key.toLowerCase()];
    }
}