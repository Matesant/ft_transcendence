import { STRINGS, Language } from "../../i18n";
import { CONFIG } from "../config";

interface MatchInfo {
    id: number;
    player1: string;
    player2: string;
    round: number;
    status: string;
}

export class UIManager {
    private _menuUI: HTMLDivElement;
    private _gameOverUI: HTMLDivElement;
    private _lang: Language = "ptBR";
    private _speedMultiplier: number = CONFIG.SPEED.MULTIPLIER.DEFAULT;
    private _tableTheme: 'GREEN' | 'BLUE' = 'GREEN';
    
    private _onStartGame: (enablePowerUps: boolean) => void;
    private _onShowMenu: () => void;
    private _onResetGame: () => void;
    private _onSpeedChange: (speed: number) => void;
    private _onTableThemeToggle: () => void;

    constructor(
        onStartGame: (enablePowerUps: boolean) => void,
        onShowMenu: () => void,
        onResetGame: () => void,
        onSpeedChange: (speed: number) => void,
        onTableThemeToggle: () => void
    ) {
        this._onStartGame = onStartGame;
        this._onShowMenu = onShowMenu;
        this._onResetGame = onResetGame;
        this._onSpeedChange = onSpeedChange;
        this._onTableThemeToggle = onTableThemeToggle;
        
        this._createMenuUI();
        this._createGameOverUI();
        this._createLanguageSelector();
    }

    public showMenu(): void {
        this._menuUI.className = this._menuUI.className.replace("hidden", "flex");
        this._gameOverUI.className = this._gameOverUI.className.replace("flex", "hidden");
    }

    public hideMenu(): void {
        this._menuUI.className = this._menuUI.className.replace("flex", "hidden");
    }

    public showGameOver(
        winner: string,
        player1Name: string,
        player2Name: string,
        currentMatch: MatchInfo | null,
        tournamentComplete: boolean = false,
        champion?: string
    ): void {
        const gameOverText = document.getElementById("gameOverText") as HTMLHeadingElement;
        const winnerText = document.getElementById("winnerText") as HTMLHeadingElement;
        const playAgainBtn = document.getElementById("playAgainButton") as HTMLButtonElement;
        const menuBtn = document.getElementById("menuButton") as HTMLButtonElement;

        if (tournamentComplete) {
            // Tournament Complete layout
            if (gameOverText) {
                gameOverText.textContent = STRINGS[this._lang].tournamentCompleteTitle;
                gameOverText.className = "text-yellow-400 text-5xl mb-5 shadow-lg";
                gameOverText.style.textShadow = "0 0 20px #fff, 0 0 10px #ffd700"; // Keep custom shadow as Tailwind doesn't have exact equivalent
            }
            if (winnerText) {
                winnerText.innerHTML = `🏆 ${STRINGS[this._lang].championLabel}: <span class="text-yellow-400">${champion}</span> 🏆`;
                winnerText.className = "text-white text-4xl mb-8";
            }
            if (playAgainBtn) playAgainBtn.className = playAgainBtn.className.replace("block", "hidden");
            if (menuBtn) {
                menuBtn.className = menuBtn.className.replace("hidden", "block");
                menuBtn.textContent = STRINGS[this._lang].mainMenu;
            }
        } else {
            // Normal game over
            if (gameOverText) {
                gameOverText.textContent = STRINGS[this._lang].gameOver;
                gameOverText.className = "text-white text-5xl m-0 mb-2.5"; // Reset to default
            }
            if (winnerText) {
                winnerText.textContent = `${winner} ${STRINGS[this._lang].wins}`;
                winnerText.className = "text-white text-2xl m-0 mb-5"; // Reset to default
            }

            if (currentMatch) {
                // Next match in tournament
                if (playAgainBtn) {
                    playAgainBtn.className = playAgainBtn.className.replace("hidden", "block");
                    playAgainBtn.textContent = STRINGS[this._lang].nextMatch;
                }
            } else {
                // Practice mode
                if (playAgainBtn) {
                    playAgainBtn.className = playAgainBtn.className.replace("hidden", "block");
                    playAgainBtn.textContent = STRINGS[this._lang].playAgain;
                }
            }
            
            if (menuBtn) {
                menuBtn.className = menuBtn.className.replace("hidden", "inline-block");
                menuBtn.textContent = STRINGS[this._lang].mainMenu;
            }
        }

        this._gameOverUI.className = this._gameOverUI.className.replace("hidden", "flex");
    }

    public hideGameOver(): void {
        this._gameOverUI.className = this._gameOverUI.className.replace("flex", "hidden");
    }

    public updateMatchInfo(
        currentMatch: MatchInfo | null,
        player1Name: string,
        player2Name: string
    ): void {
        const matchInfoElement = document.getElementById("matchInfo");
        if (matchInfoElement) {
            this._updateMatchInfoDisplay(matchInfoElement, currentMatch, player1Name, player2Name);
        }
    }

    public setLanguage(lang: Language): void {
        this._lang = lang;
        this._updateAllUIText();
    }

    public getLanguage(): Language {
        return this._lang;
    }

    public setSpeedMultiplier(speed: number): void {
        this._speedMultiplier = speed;
    }

    public getSpeedMultiplier(): number {
        return this._speedMultiplier;
    }

    public setTableTheme(theme: 'GREEN' | 'BLUE'): void {
        this._tableTheme = theme;
        this._updateTableThemeButton();
    }

    public getTableTheme(): 'GREEN' | 'BLUE' {
        return this._tableTheme;
    }

    private _createMenuUI(): void {
        this._menuUI = document.createElement("div");
        this._menuUI.className = "absolute inset-0 flex flex-col justify-center items-center bg-black/70";
        
        const title = document.createElement("h1");
        title.textContent = "PONG";
        title.className = "text-white text-5xl mb-8";
        
        const matchInfo = document.createElement("div");
        matchInfo.id = "matchInfo";
        matchInfo.className = "text-white text-xl mb-5 text-center";
        
        const subtitle = document.createElement("h2");
        subtitle.textContent = STRINGS[this._lang].selectGameMode;
        subtitle.className = "text-white text-2xl mb-5";
        
        const buttonsContainer = this._createGameModeButtons();
        const speedContainer = this._createSpeedControl();
        const tableColorContainer = this._createTableColorControl();
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(matchInfo);
        this._menuUI.appendChild(subtitle);
        this._menuUI.appendChild(buttonsContainer);
        this._menuUI.appendChild(speedContainer);
        this._menuUI.appendChild(tableColorContainer);
        
        document.body.appendChild(this._menuUI);
    }

    private _createGameModeButtons(): HTMLDivElement {
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "flex flex-row gap-5 justify-center items-center";
        
        const classicContainer = document.createElement("div");
        classicContainer.className = "flex flex-col items-center w-48";
        
        const powerUpsContainer = document.createElement("div");
        powerUpsContainer.className = "flex flex-col items-center w-48";
        
        const classicLabel = document.createElement("div");
        classicLabel.textContent = STRINGS[this._lang].classicMode;
        classicLabel.className = "text-white text-lg mb-2.5 classic-label";
        
        const powerUpsLabel = document.createElement("div");
        powerUpsLabel.textContent = STRINGS[this._lang].powerUpsMode;
        powerUpsLabel.className = "text-white text-lg mb-2.5 powerups-label";
        
        const classicButton = document.createElement("button");
        classicButton.textContent = STRINGS[this._lang].start;
        classicButton.className = "px-5 py-2.5 w-28 text-lg cursor-pointer bg-blue-500 border-none rounded text-white classic-btn hover:bg-blue-600 transition-colors";
        
        const powerUpsButton = document.createElement("button");
        powerUpsButton.textContent = STRINGS[this._lang].start;
        powerUpsButton.className = "px-5 py-2.5 w-28 text-lg cursor-pointer bg-pink-500 border-none rounded text-white powerups-btn hover:bg-pink-600 transition-colors";
        
        classicButton.addEventListener("click", () => {
            this._onStartGame(false);
        });
        
        powerUpsButton.addEventListener("click", () => {
            this._onStartGame(true);
        });
        
        classicContainer.appendChild(classicLabel);
        classicContainer.appendChild(classicButton);
        
        powerUpsContainer.appendChild(powerUpsLabel);
        powerUpsContainer.appendChild(powerUpsButton);
        
        buttonsContainer.appendChild(classicContainer);
        buttonsContainer.appendChild(powerUpsContainer);
        
        return buttonsContainer;
    }

    private _createSpeedControl(): HTMLDivElement {
        const speedContainer = document.createElement("div");
        speedContainer.className = "flex flex-col items-center mt-8 w-72";
        
        const speedLabel = document.createElement("div");
        speedLabel.textContent = STRINGS[this._lang].gameSpeed || "Game Speed";
        speedLabel.className = "text-white text-lg mb-2.5";
        
        const speedSliderContainer = document.createElement("div");
        speedSliderContainer.className = "flex items-center gap-4 w-full";
        
        const minLabel = document.createElement("span");
        minLabel.textContent = `${CONFIG.SPEED.MULTIPLIER.MIN}x`;
        minLabel.className = "text-white text-sm";
        
        const speedSlider = document.createElement("input");
        speedSlider.type = "range";
        speedSlider.min = CONFIG.SPEED.MULTIPLIER.MIN.toString();
        speedSlider.max = CONFIG.SPEED.MULTIPLIER.MAX.toString();
        speedSlider.step = CONFIG.SPEED.MULTIPLIER.STEP.toString();
        speedSlider.value = this._speedMultiplier.toString();
        speedSlider.className = "flex-1 h-1.5 bg-gray-300 rounded outline-none";
        
        const maxLabel = document.createElement("span");
        maxLabel.textContent = `${CONFIG.SPEED.MULTIPLIER.MAX}x`;
        maxLabel.className = "text-white text-sm";
        
        const speedValue = document.createElement("div");
        speedValue.textContent = `${this._speedMultiplier.toFixed(1)}x`;
        speedValue.className = "text-green-500 text-base font-bold mt-1";
        
        speedSlider.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            this._speedMultiplier = parseFloat(target.value);
            speedValue.textContent = `${this._speedMultiplier.toFixed(1)}x`;
            this._onSpeedChange(this._speedMultiplier);
        });
        
        speedSliderContainer.appendChild(minLabel);
        speedSliderContainer.appendChild(speedSlider);
        speedSliderContainer.appendChild(maxLabel);
        
        speedContainer.appendChild(speedLabel);
        speedContainer.appendChild(speedSliderContainer);
        speedContainer.appendChild(speedValue);
        
        return speedContainer;
    }

    private _createTableColorControl(): HTMLDivElement {
        const tableColorContainer = document.createElement("div");
        tableColorContainer.className = "flex flex-col items-center mt-8 w-72";
        
        const tableColorLabel = document.createElement("div");
        tableColorLabel.textContent = STRINGS[this._lang].tableColor || "Table Color";
        tableColorLabel.className = "text-white text-lg mb-4";
        
        const tableColorButton = document.createElement("button");
        tableColorButton.id = "tableColorButton";
        tableColorButton.textContent = this._tableTheme === 'GREEN' ? 
            (STRINGS[this._lang].switchToBlue || "Switch to Blue") : 
            (STRINGS[this._lang].switchToGreen || "Switch to Green");
        tableColorButton.className = `px-5 py-2.5 text-base cursor-pointer border-none rounded text-white w-40 transition-colors ${
            this._tableTheme === 'GREEN' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
        }`;
        
        tableColorButton.addEventListener("click", () => {
            this._tableTheme = this._tableTheme === 'GREEN' ? 'BLUE' : 'GREEN';
            this._updateTableThemeButton();
            this._onTableThemeToggle();
        });
        
        tableColorContainer.appendChild(tableColorLabel);
        tableColorContainer.appendChild(tableColorButton);
        
        return tableColorContainer;
    }

    private _createGameOverUI(): void {
        this._gameOverUI = document.createElement("div");
        this._gameOverUI.className = "absolute inset-0 hidden flex-col justify-center items-center bg-black/70";
        
        const gameOverText = document.createElement("h2");
        gameOverText.id = "gameOverText";
        gameOverText.className = "text-white text-5xl m-0 mb-2.5";
        
        const winnerText = document.createElement("h3");
        winnerText.id = "winnerText";
        winnerText.className = "text-white text-2xl m-0 mb-5";
        
        const playAgainButton = document.createElement("button");
        playAgainButton.id = "playAgainButton";
        playAgainButton.className = "px-5 py-2.5 text-xl cursor-pointer bg-green-500 border-none rounded text-white mb-2.5 w-44 text-center hover:bg-green-600 transition-colors";
        
        playAgainButton.addEventListener("click", () => {
            this._onResetGame();
        });
        
        const menuButton = document.createElement("button");
        menuButton.id = "menuButton";
        menuButton.className = "px-5 py-2.5 text-xl cursor-pointer bg-red-500 border-none rounded text-white w-44 text-center hover:bg-red-600 transition-colors";
        
        menuButton.addEventListener("click", () => {
            this._onShowMenu();
        });
        
        this._gameOverUI.appendChild(gameOverText);
        this._gameOverUI.appendChild(winnerText);
        this._gameOverUI.appendChild(playAgainButton);
        this._gameOverUI.appendChild(menuButton);
        document.body.appendChild(this._gameOverUI);
    }

    private _createLanguageSelector(): void {
        const oldSelector = document.getElementById("languageSelector");
        if (oldSelector) oldSelector.remove();

        const selector = document.createElement("select");
        selector.id = "languageSelector";
        selector.className = "fixed top-6 right-6 z-[10000] px-4 py-2 text-base rounded-lg bg-gray-800 text-white border border-gray-600 shadow-lg";

        const languageLabels: Record<Language, string> = {
            ptBR: "Português (Brasil)",
            en: "English",
            es: "Español",
            fr: "Français",
            de: "Deutsch",
            ru: "Русский"
        };

        for (const lang of Object.keys(languageLabels) as Language[]) {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = languageLabels[lang];
            if (lang === this._lang) option.selected = true;
            selector.appendChild(option);
        }

        selector.addEventListener("change", () => {
            this._lang = selector.value as Language;
            this._updateAllUIText();
        });

        document.body.appendChild(selector);
    }

    private _updateMatchInfoDisplay(
        element: HTMLElement,
        currentMatch: MatchInfo | null,
        player1Name: string,
        player2Name: string
    ): void {
        if (currentMatch) {
            element.innerHTML = `
                <div><strong>${STRINGS[this._lang].currentMatch}</strong></div>
                <div>${player1Name} vs ${player2Name}</div>
                <div>${STRINGS[this._lang].round} ${currentMatch.round}</div>
            `;
        } else if (player1Name !== "Player 1" && player2Name !== "Player 2") {
            element.innerHTML = `
                <div><strong>${STRINGS[this._lang].currentMatch}</strong></div>
                <div>${player1Name} vs ${player2Name}</div>
                <div>${STRINGS[this._lang].practiceMode}</div>
            `;
        } else {
            element.innerHTML = `
                <div style="color: #ffa500;">${STRINGS[this._lang].noTournament}</div>
                <div>${STRINGS[this._lang].practiceMode}</div>
            `;
        }
    }

    private _updateAllUIText(): void {
        const subtitle = this._menuUI.querySelector("h2");
        if (subtitle) subtitle.textContent = STRINGS[this._lang].selectGameMode;

        const classicLabel = this._menuUI.querySelector(".classic-label");
        if (classicLabel) classicLabel.textContent = STRINGS[this._lang].classicMode;
        const classicBtn = this._menuUI.querySelector(".classic-btn");
        if (classicBtn) classicBtn.textContent = STRINGS[this._lang].start;

        const puLabel = this._menuUI.querySelector(".powerups-label");
        if (puLabel) puLabel.textContent = STRINGS[this._lang].powerUpsMode;
        const puBtn = this._menuUI.querySelector(".powerups-btn");
        if (puBtn) puBtn.textContent = STRINGS[this._lang].start;

        const gameOverText = document.getElementById("gameOverText");
        if (gameOverText) gameOverText.textContent = STRINGS[this._lang].gameOver;

        const playAgainBtn = document.getElementById("playAgainButton");
        if (playAgainBtn) playAgainBtn.textContent = STRINGS[this._lang].playAgain;

        const menuBtn = document.getElementById("menuButton");
        if (menuBtn) menuBtn.textContent = STRINGS[this._lang].mainMenu;

        this._updateTableThemeButton();
    }

    private _updateTableThemeButton(): void {
        const tableColorButton = document.getElementById("tableColorButton");
        if (tableColorButton) {
            tableColorButton.textContent = this._tableTheme === 'GREEN' ? 
                (STRINGS[this._lang].switchToBlue || "Switch to Blue") : 
                (STRINGS[this._lang].switchToGreen || "Switch to Green");
            
            // Update classes instead of inline styles
            tableColorButton.className = tableColorButton.className.replace(
                /bg-(blue|green)-(500|600)/g, 
                this._tableTheme === 'GREEN' ? 'bg-blue-500' : 'bg-green-500'
            ).replace(
                /hover:bg-(blue|green)-(500|600)/g,
                this._tableTheme === 'GREEN' ? 'hover:bg-blue-600' : 'hover:bg-green-600'
            );
        }
    }
}
