export enum GameState {
    MENU,
    PLAYING,
    GAME_OVER
}

export class GameStateManager {
    private _gameState: GameState = GameState.MENU;
    private _powerUpsEnabled: boolean = false;

    public getState(): GameState {
        return this._gameState;
    }

    public setState(state: GameState): void {
        this._gameState = state;
    }

    public isPlaying(): boolean {
        return this._gameState === GameState.PLAYING;
    }

    public isMenu(): boolean {
        return this._gameState === GameState.MENU;
    }

    public isGameOver(): boolean {
        return this._gameState === GameState.GAME_OVER;
    }

    public setPowerUpsEnabled(enabled: boolean): void {
        this._powerUpsEnabled = enabled;
    }

    public arePowerUpsEnabled(): boolean {
        return this._powerUpsEnabled;
    }

    public startGame(enablePowerUps: boolean): void {
        this._gameState = GameState.PLAYING;
        this._powerUpsEnabled = enablePowerUps;
    }

    public showMenu(): void {
        this._gameState = GameState.MENU;
    }

    public showGameOver(): void {
        this._gameState = GameState.GAME_OVER;
    }

    public reset(): void {
        this._gameState = GameState.MENU;
        this._powerUpsEnabled = false;
    }
}
