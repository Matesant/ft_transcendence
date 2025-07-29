import { STRINGS, Language } from "../../i18n";
import { CONFIG } from "../config";
import { getText, getCurrentLanguage, changeLanguage } from "../../../utils/language";

interface MatchInfo {
    player1: string;
    player2: string;
    round?: string;
    tournamentId?: string;
    matchId?: string;
    winCallback?: (winner: string) => void;
}

export class UIManager {
    private _container: HTMLDivElement;
    private _scoreBoard: HTMLDivElement;
    private _menuScreen: HTMLDivElement;
    private _player1Score: number = 0;
    private _player2Score: number = 0;
    private _gameSpeed: number = 1;
    private _tableColor: string = "green";
    private _powerUpsEnabled: boolean = false;
    private _gameMode: "classic" | "powerups" = "classic";
    private _tournamentMatch: MatchInfo | null = null;
    private _lang: Language = getCurrentLanguage();
    
    // Callback functions
    private _onStartGame: (enablePowerUps: boolean) => void;
    private _onShowMenu: () => void;
    private _onResetAndRestart: () => void;
    private _onSpeedChange: (speed: number) => void;
    private _onTableThemeToggle: () => void;

    constructor(
        onStartGame?: (enablePowerUps: boolean) => void,
        onShowMenu?: () => void,
        onResetAndRestart?: () => void,
        onSpeedChange?: (speed: number) => void,
        onTableThemeToggle?: () => void
    ) {
        this._container = document.createElement("div");
        this._container.className = "absolute inset-0";
        document.body.appendChild(this._container);
        
        this._scoreBoard = document.createElement("div");
        this._menuScreen = document.createElement("div");
        
        // Store callbacks, using empty functions as defaults if not provided
        this._onStartGame = onStartGame || (() => {});
        this._onShowMenu = onShowMenu || (() => {});
        this._onResetAndRestart = onResetAndRestart || (() => {});
        this._onSpeedChange = onSpeedChange || (() => {});
        this._onTableThemeToggle = onTableThemeToggle || (() => {});
        
        this._setupScoreBoard();
    }

    // Update the scores display
    public updateScores(player1Score: number, player2Score: number): void {
        this._player1Score = player1Score;
        this._player2Score = player2Score;
        this._updateScoreDisplay();
    }

    // Update the score display on the scoreboard
    private _updateScoreDisplay(): void {
        const scoreDisplay = document.getElementById("score-display");
        if (scoreDisplay) {
            scoreDisplay.textContent = `${this._player1Score} - ${this._player2Score}`;
        }
    }

    // Initialize and setup the scoreboard
    private _setupScoreBoard(): void {
        this._scoreBoard.id = "score-board";
        this._scoreBoard.className = "absolute top-0 left-0 w-full p-4 flex justify-between items-center text-white";
        
        // Player 1
        const player1Div = document.createElement("div");
        player1Div.className = "text-2xl font-bold";
        player1Div.textContent = getText('player1');
        
        // Score
        const scoreDiv = document.createElement("div");
        scoreDiv.id = "score-display";
        scoreDiv.className = "text-4xl font-bold";
        scoreDiv.textContent = "0 - 0";
        
        // Player 2
        const player2Div = document.createElement("div");
        player2Div.className = "text-2xl font-bold";
        player2Div.textContent = getText('player2');
        
        this._scoreBoard.appendChild(player1Div);
        this._scoreBoard.appendChild(scoreDiv);
        this._scoreBoard.appendChild(player2Div);
    }

    // Show the scoreboard in the game container
    public showScoreBoard(player1Name?: string, player2Name?: string): void {
        const player1Div = this._scoreBoard.children[0] as HTMLDivElement;
        const player2Div = this._scoreBoard.children[2] as HTMLDivElement;
        
        player1Div.textContent = player1Name || getText('player1');
        player2Div.textContent = player2Name || getText('player2');
        
        this._container.appendChild(this._scoreBoard);
    }

    // Hide the scoreboard
    public hideScoreBoard(): void {
        if (this._scoreBoard.parentNode === this._container) {
            this._container.removeChild(this._scoreBoard);
        }
    }

    // Show the menu screen with options
    public showMenu(mode: "tournament" | "practice" | "normal" = "normal"): void {
        this._menuScreen = document.createElement("div");
        this._menuScreen.className = "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white";
        
        // Title
        const title = document.createElement("h1");
        title.className = "text-5xl font-bold mb-8";
        title.textContent = getText('mainMenu');
        this._menuScreen.appendChild(title);
        
        // Container for the menu buttons
        const menuContainer = document.createElement("div");
        menuContainer.className = "w-96 space-y-4";
        
        if (mode === "tournament") {
            // Show tournament specific menu items
            const tournamentInfo = document.createElement("div");
            tournamentInfo.className = "bg-white/10 p-4 rounded-lg text-center mb-6";
            
            if (this._tournamentMatch) {
                const matchTitle = document.createElement("h2");
                matchTitle.className = "text-xl font-semibold mb-2";
                matchTitle.textContent = getText('currentMatch');
                tournamentInfo.appendChild(matchTitle);
                
                const players = document.createElement("p");
                players.className = "text-lg";
                players.textContent = `${this._tournamentMatch.player1} ${getText('versus')} ${this._tournamentMatch.player2}`;
                tournamentInfo.appendChild(players);
                
                if (this._tournamentMatch.round) {
                    const round = document.createElement("p");
                    round.className = "text-sm opacity-75 mt-2";
                    round.textContent = `${getText('round')}: ${this._tournamentMatch.round}`;
                    tournamentInfo.appendChild(round);
                }
            } else {
                tournamentInfo.textContent = getText('noTournament');
            }
            
            menuContainer.appendChild(tournamentInfo);
            
            // Add Start button for tournament
            const startBtn = this._createButton(getText('start'));
            startBtn.onclick = () => this.hideMenu();
            menuContainer.appendChild(startBtn);
        } else if (mode === "practice") {
            // Practice mode notice
            const practiceInfo = document.createElement("div");
            practiceInfo.className = "bg-white/10 p-4 rounded-lg text-center mb-6";
            practiceInfo.textContent = getText('practiceMode');
            menuContainer.appendChild(practiceInfo);
            
            // Add game speed slider
            const speedContainer = document.createElement("div");
            speedContainer.className = "mb-6";
            
            const speedLabel = document.createElement("label");
            speedLabel.className = "block text-sm font-medium mb-2";
            speedLabel.textContent = getText('gameSpeed');
            speedContainer.appendChild(speedLabel);
            
            const speedSlider = document.createElement("input");
            speedSlider.type = "range";
            speedSlider.min = "0.5";
            speedSlider.max = "2";
            speedSlider.step = "0.1";
            speedSlider.value = this._gameSpeed.toString();
            speedSlider.className = "w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer";
            speedSlider.oninput = (e) => {
                this._gameSpeed = parseFloat((e.target as HTMLInputElement).value);
            };
            speedContainer.appendChild(speedSlider);
            
            menuContainer.appendChild(speedContainer);
            
            // Game modes
            const gameModeTitle = document.createElement("h3");
            gameModeTitle.className = "text-lg font-semibold mb-2";
            gameModeTitle.textContent = getText('selectGameMode');
            menuContainer.appendChild(gameModeTitle);
            
            const gameModeContainer = document.createElement("div");
            gameModeContainer.className = "grid grid-cols-2 gap-4 mb-6";
            
            const classicBtn = document.createElement("button");
            classicBtn.className = `p-3 rounded-lg ${this._gameMode === "classic" ? "bg-blue-600" : "bg-white/10"} hover:bg-blue-500 transition`;
            classicBtn.textContent = getText('classicMode');
            classicBtn.onclick = () => {
                this._gameMode = "classic";
                this._powerUpsEnabled = false;
                classicBtn.className = "p-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition";
                powerUpsBtn.className = "p-3 rounded-lg bg-white/10 hover:bg-blue-500 transition";
            };
            
            const powerUpsBtn = document.createElement("button");
            powerUpsBtn.className = `p-3 rounded-lg ${this._gameMode === "powerups" ? "bg-blue-600" : "bg-white/10"} hover:bg-blue-500 transition`;
            powerUpsBtn.textContent = getText('powerUpsMode');
            powerUpsBtn.onclick = () => {
                this._gameMode = "powerups";
                this._powerUpsEnabled = true;
                powerUpsBtn.className = "p-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition";
                classicBtn.className = "p-3 rounded-lg bg-white/10 hover:bg-blue-500 transition";
            };
            
            gameModeContainer.appendChild(classicBtn);
            gameModeContainer.appendChild(powerUpsBtn);
            menuContainer.appendChild(gameModeContainer);
            
            // Table color options
            const tableColorTitle = document.createElement("h3");
            tableColorTitle.className = "text-lg font-semibold mb-2";
            tableColorTitle.textContent = getText('tableColor');
            menuContainer.appendChild(tableColorTitle);
            
            const tableColorContainer = document.createElement("div");
            tableColorContainer.className = "grid grid-cols-2 gap-4 mb-6";
            
            const blueBtn = document.createElement("button");
            blueBtn.className = `p-3 rounded-lg ${this._tableColor === "blue" ? "bg-blue-600" : "bg-white/10"} hover:bg-blue-500 transition`;
            blueBtn.textContent = getText('switchToBlue');
            blueBtn.onclick = () => {
                this._tableColor = "blue";
                blueBtn.className = "p-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition";
                greenBtn.className = "p-3 rounded-lg bg-white/10 hover:bg-blue-500 transition";
            };
            
            const greenBtn = document.createElement("button");
            greenBtn.className = `p-3 rounded-lg ${this._tableColor === "green" ? "bg-blue-600" : "bg-white/10"} hover:bg-blue-500 transition`;
            greenBtn.textContent = getText('switchToGreen');
            greenBtn.onclick = () => {
                this._tableColor = "green";
                greenBtn.className = "p-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition";
                blueBtn.className = "p-3 rounded-lg bg-white/10 hover:bg-blue-500 transition";
            };
            
            tableColorContainer.appendChild(blueBtn);
            tableColorContainer.appendChild(greenBtn);
            menuContainer.appendChild(tableColorContainer);
            
            // Start button for practice mode
            const startBtn = this._createButton(getText('start'));
            startBtn.onclick = () => this.hideMenu();
            menuContainer.appendChild(startBtn);
        } else {
            // Normal game menu
            
            // Play again button
            const playAgainBtn = this._createButton(getText('playAgain'));
            playAgainBtn.onclick = () => this.hideMenu();
            menuContainer.appendChild(playAgainBtn);
            
            // Next match button (for tournament)
            if (this._tournamentMatch) {
                const nextMatchBtn = this._createButton(getText('nextMatch'));
                nextMatchBtn.onclick = () => {
                    if (this._tournamentMatch?.winCallback) {
                        // Determine winner based on scores
                        const winner = this._player1Score > this._player2Score ? this._tournamentMatch.player1 : this._tournamentMatch.player2;
                        this._tournamentMatch.winCallback(winner);
                    }
                    this.hideMenu();
                };
                menuContainer.appendChild(nextMatchBtn);
            }
        }
        
        this._menuScreen.appendChild(menuContainer);
        this._container.appendChild(this._menuScreen);
    }

    // Create a button with standardized styling
    private _createButton(text: string): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.className = "w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-bold rounded-lg transition shadow-lg hover:shadow-blue-500/20";
        btn.textContent = text;
        return btn;
    }

    // Show game over screen
    public showGameOver(
        winner?: string,
        player1Name?: string,
        player2Name?: string,
        matchInfo?: any,
        tournamentComplete?: boolean,
        champion?: string
    ): void {
        this._menuScreen = document.createElement("div");
        this._menuScreen.className = "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white";
        
        // Game over title
        const title = document.createElement("h1");
        title.className = "text-5xl font-bold mb-8";
        title.textContent = getText('gameOver');
        this._menuScreen.appendChild(title);
        
        // Winner announcement
        const winnerText = document.createElement("div");
        winnerText.className = "text-3xl font-bold mb-12";
        
        if (winner === "player1") {
            winnerText.textContent = getText('youWin');
            winnerText.className += " text-green-500";
        } else if (winner === "player2") {
            winnerText.textContent = getText('youLose');
            winnerText.className += " text-red-500";
        }
        
        this._menuScreen.appendChild(winnerText);
        
        // Final score
        const scoreText = document.createElement("div");
        scoreText.className = "text-2xl mb-12";
        scoreText.textContent = getText('finalScore')
            .replace("{0}", this._player1Score.toString())
            .replace("{1}", this._player2Score.toString());
        this._menuScreen.appendChild(scoreText);
        
        // Container for buttons
        const btnContainer = document.createElement("div");
        btnContainer.className = "w-96 space-y-4";
        
        // Play again button
        const playAgainBtn = this._createButton(getText('playAgain'));
        playAgainBtn.onclick = () => this.hideMenu();
        btnContainer.appendChild(playAgainBtn);
        
        // Next match button (for tournament)
        if (this._tournamentMatch) {
            const nextMatchBtn = this._createButton(getText('nextMatch'));
            nextMatchBtn.onclick = () => {
                if (this._tournamentMatch?.winCallback) {
                    // Determine winner based on scores
                    const winner = this._player1Score > this._player2Score ? this._tournamentMatch.player1 : this._tournamentMatch.player2;
                    this._tournamentMatch.winCallback(winner);
                }
                this.hideMenu();
            };
            btnContainer.appendChild(nextMatchBtn);
        }
        
        this._menuScreen.appendChild(btnContainer);
        this._container.appendChild(this._menuScreen);
    }

    // Hide the menu
    public hideMenu(): void {
        if (this._menuScreen && this._menuScreen.parentNode === this._container) {
            this._container.removeChild(this._menuScreen);
        }
    }

    // Show win by default screen
    public showWinByDefault(): void {
        this._menuScreen = document.createElement("div");
        this._menuScreen.className = "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white";
        
        const message = document.createElement("h1");
        message.className = "text-4xl font-bold mb-12 text-green-500 text-center";
        message.textContent = getText('winByDefault');
        this._menuScreen.appendChild(message);
        
        // Container for the menu button
        const btnContainer = document.createElement("div");
        btnContainer.className = "w-96";
        
        // Continue button
        const continueBtn = this._createButton(getText('continue'));
        continueBtn.onclick = () => {
            this.hideMenu();
            if (this._tournamentMatch?.winCallback) {
                this._tournamentMatch.winCallback(this._tournamentMatch.player1);
            }
        };
        btnContainer.appendChild(continueBtn);
        
        this._menuScreen.appendChild(btnContainer);
        this._container.appendChild(this._menuScreen);
    }

    // Show tournament completion screen
    public showTournamentComplete(champion: string): void {
        this._menuScreen = document.createElement("div");
        this._menuScreen.className = "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white";
        
        // Title
        const title = document.createElement("h1");
        title.className = "text-5xl font-bold mb-12 text-center";
        title.textContent = getText('tournamentCompleteTitle');
        this._menuScreen.appendChild(title);
        
        // Champion card
        const championCard = document.createElement("div");
        championCard.className = "bg-white/10 p-8 rounded-lg text-center mb-12 w-96";
        
        const championLabel = document.createElement("div");
        championLabel.className = "text-xl opacity-75 mb-2";
        championLabel.textContent = getText('championLabel');
        championCard.appendChild(championLabel);
        
        const championName = document.createElement("div");
        championName.className = "text-4xl font-bold text-yellow-400";
        championName.textContent = champion;
        championCard.appendChild(championName);
        
        const winsLabel = document.createElement("div");
        winsLabel.className = "text-2xl mt-4";
        winsLabel.textContent = getText('wins');
        championCard.appendChild(winsLabel);
        
        this._menuScreen.appendChild(championCard);
        
        // Container for buttons
        const btnContainer = document.createElement("div");
        btnContainer.className = "w-96";
        
        // Main menu button
        const mainMenuBtn = this._createButton(getText('mainMenu'));
        mainMenuBtn.onclick = () => {
            window.location.href = "/tournament";
        };
        btnContainer.appendChild(mainMenuBtn);
        
        this._menuScreen.appendChild(btnContainer);
        this._container.appendChild(this._menuScreen);
    }

    // Set tournament match data
    public setTournamentMatch(matchData: MatchInfo): void {
        this._tournamentMatch = matchData;
    }

    // Get game settings
    public getGameSpeed(): number {
        return this._gameSpeed;
    }
    
    public getTableColor(): string {
        return this._tableColor;
    }
    
    public getPowerUpsEnabled(): boolean {
        return this._powerUpsEnabled;
    }

    // Add missing methods
    public setTableTheme(theme: string): void {
        this._tableColor = theme.toLowerCase();
    }

    public hideGameOver(): void {
        this.hideMenu();
    }

    private _updateUILanguage(): void {
        // Update any text elements that are currently displayed
        const scoreBoard = this._scoreBoard;
        if (scoreBoard.children.length >= 3) {
            (scoreBoard.children[0] as HTMLElement).textContent = getText('player1');
            (scoreBoard.children[2] as HTMLElement).textContent = getText('player2');
        }

        // If menu is visible, we'll need to recreate it with the new language
        if (this._menuScreen && this._menuScreen.parentNode === this._container) {
            const menuType = this._tournamentMatch ? "tournament" : "normal";
            this.hideMenu();
            this.showMenu(menuType);
        }
    }
}