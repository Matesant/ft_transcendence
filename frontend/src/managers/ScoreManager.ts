import { CONFIG } from "../config";

export class ScoreManager {
    private _scoreText: HTMLDivElement;
    private _score: { player1: number, player2: number } = { player1: 0, player2: 0 };
    
    constructor() {
        this._createScoreDisplay();
    }
    
    private _createScoreDisplay(): void {
        this._scoreText = document.createElement("div");
        this._scoreText.style.position = "absolute";
        this._scoreText.style.top = CONFIG.SCORE.DISPLAY.TOP;
        this._scoreText.style.left = "0";
        this._scoreText.style.width = "100%";
        this._scoreText.style.textAlign = "center";
        this._scoreText.style.color = CONFIG.SCORE.DISPLAY.COLOR;
        this._scoreText.style.fontSize = CONFIG.SCORE.DISPLAY.FONT_SIZE;
        this._scoreText.style.fontFamily = CONFIG.SCORE.DISPLAY.FONT_FAMILY;
        document.body.appendChild(this._scoreText);
        this.updateDisplay();
    }
    
    public player1Scores(): void {
        this._score.player1++;
        this.updateDisplay();
    }
    
    public player2Scores(): void {
        this._score.player2++;
        this.updateDisplay();
    }
    
    public updateDisplay(): void {
        this._scoreText.textContent = `Player_1: ${this._score.player1} vs Player_2: ${this._score.player2}`;
    }
    
    public reset(): void {
        this._score = { player1: 0, player2: 0 };
        this.updateDisplay();
    }
}