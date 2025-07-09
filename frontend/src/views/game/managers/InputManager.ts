export class InputManager {
    private _pressedKeys: { [key: string]: boolean } = {};
    private _justPressedKeys: { [key: string]: boolean } = {};
    
    constructor() {
        this._setupEventListeners();
    }
    
    private _setupEventListeners(): void {
        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();
            
            // If key wasn't already pressed, mark it as just pressed
            if (!this._pressedKeys[key]) {
                this._justPressedKeys[key] = true;
            }
            
            this._pressedKeys[key] = true;
        });
        
        window.addEventListener("keyup", (event) => {
            this._pressedKeys[event.key.toLowerCase()] = false;
        });
    }
    
    public update(): void {
        // Clear just pressed keys at the end of each frame
        this._justPressedKeys = {};
    }
    
    public isKeyPressed(key: string): boolean {
        if (key === "space" && this._pressedKeys[" "]) {
            return true;
        }
        return !!this._pressedKeys[key.toLowerCase()];
    }
    
    public wasKeyJustPressed(key: string): boolean {
        if (key === "space" && this._justPressedKeys[" "]) {
            return true;
        }
        return !!this._justPressedKeys[key.toLowerCase()];
    }
}