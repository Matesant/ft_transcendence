import { CONFIG } from "../config";

export class ScoreManager {
    private _scoreText: HTMLDivElement;
    private _score: { player1: number, player2: number } = { player1: 0, player2: 0 };
    private _player1Name: string = "Player 1";
    private _player2Name: string = "Player 2";
    
    constructor() {
        this._createScoreDisplay();
    }
    
    private _createScoreDisplay(): void {
        this._scoreText = document.createElement("div");
        this._scoreText.className = "absolute top-5 left-0 w-full text-center text-white text-2xl font-sans";
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
        this._scoreText.textContent = `${this._player1Name}: ${this._score.player1} vs ${this._player2Name}: ${this._score.player2}`;
    }
    
    public reset(): void {
        this._score = { player1: 0, player2: 0 };
        this.updateDisplay();
    }

    public get score(): { player1: number, player2: number } {
        return {...this._score};
    }

    public addPointToPlayer1(): void {
        this._score.player1++;
        this.updateDisplay();
    }

    public addPointToPlayer2(): void {
        this._score.player2++;
        this.updateDisplay();
    }

    public setPlayerNames(player1: string, player2: string): void {
        this._player1Name = player1;
        this._player2Name = player2;
        this.updateDisplay();
    }

    public setScore(player1Score: number, player2Score: number): void {
        this._score.player1 = player1Score;
        this._score.player2 = player2Score;
        this.updateDisplay();
    }
}