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
        this._menuUI.style.display = "flex";
        this._gameOverUI.style.display = "none";
    }

    public hideMenu(): void {
        this._menuUI.style.display = "none";
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
                gameOverText.style.fontSize = "3rem";
                gameOverText.style.color = "#ffd700";
                gameOverText.style.textShadow = "0 0 20px #fff, 0 0 10px #ffd700";
                gameOverText.style.marginBottom = "20px";
            }
            if (winnerText) {
                winnerText.innerHTML = `🏆 ${STRINGS[this._lang].championLabel}: <span style="color:#ffd700;">${champion}</span> 🏆`;
                winnerText.style.fontSize = "2.5rem";
                winnerText.style.color = "#fff";
                winnerText.style.marginBottom = "30px";
            }
            if (playAgainBtn) playAgainBtn.style.display = "none";
            if (menuBtn) {
                menuBtn.style.display = "block";
                menuBtn.textContent = STRINGS[this._lang].mainMenu;
            }
        } else {
            // Normal game over
            if (gameOverText) gameOverText.textContent = STRINGS[this._lang].gameOver;
            if (winnerText) winnerText.textContent = `${winner} ${STRINGS[this._lang].wins}`;

            if (currentMatch) {
                // Next match in tournament
                if (playAgainBtn) {
                    playAgainBtn.style.display = "block";
                    playAgainBtn.textContent = STRINGS[this._lang].nextMatch;
                }
            } else {
                // Practice mode
                if (playAgainBtn) {
                    playAgainBtn.style.display = "block";
                    playAgainBtn.textContent = STRINGS[this._lang].playAgain;
                }
            }
            
            if (menuBtn) {
                menuBtn.style.display = "inline-block";
                menuBtn.textContent = STRINGS[this._lang].mainMenu;
            }
        }

        this._gameOverUI.style.display = "flex";
    }

    public hideGameOver(): void {
        this._gameOverUI.style.display = "none";
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
        this._menuUI.style.position = "absolute";
        this._menuUI.style.top = "0";
        this._menuUI.style.left = "0";
        this._menuUI.style.width = "100%";
        this._menuUI.style.height = "100%";
        this._menuUI.style.display = "flex";
        this._menuUI.style.flexDirection = "column";
        this._menuUI.style.justifyContent = "center";
        this._menuUI.style.alignItems = "center";
        this._menuUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const title = document.createElement("h1");
        title.textContent = "PONG";
        title.style.color = "white";
        title.style.fontSize = "48px";
        title.style.marginBottom = "30px";
        
        const matchInfo = document.createElement("div");
        matchInfo.id = "matchInfo";
        matchInfo.style.color = "white";
        matchInfo.style.fontSize = "20px";
        matchInfo.style.marginBottom = "20px";
        matchInfo.style.textAlign = "center";
        
        const subtitle = document.createElement("h2");
        subtitle.textContent = STRINGS[this._lang].selectGameMode;
        subtitle.style.color = "white";
        subtitle.style.fontSize = "24px";
        subtitle.style.marginBottom = "20px";
        
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
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.flexDirection = "row";
        buttonsContainer.style.gap = "20px";
        buttonsContainer.style.justifyContent = "center";
        buttonsContainer.style.alignItems = "center";
        
        const classicContainer = document.createElement("div");
        classicContainer.style.display = "flex";
        classicContainer.style.flexDirection = "column";
        classicContainer.style.alignItems = "center";
        classicContainer.style.width = "200px";
        
        const powerUpsContainer = document.createElement("div");
        powerUpsContainer.style.display = "flex";
        powerUpsContainer.style.flexDirection = "column";
        powerUpsContainer.style.alignItems = "center";
        powerUpsContainer.style.width = "200px";
        
        const classicLabel = document.createElement("div");
        classicLabel.textContent = STRINGS[this._lang].classicMode;
        classicLabel.style.color = "white";
        classicLabel.style.fontSize = "18px";
        classicLabel.style.marginBottom = "10px";
        classicLabel.classList.add("classic-label");
        
        const powerUpsLabel = document.createElement("div");
        powerUpsLabel.textContent = STRINGS[this._lang].powerUpsMode;
        powerUpsLabel.style.color = "white";
        powerUpsLabel.style.fontSize = "18px";
        powerUpsLabel.style.marginBottom = "10px";
        powerUpsLabel.classList.add("powerups-label");
        
        const classicButton = document.createElement("button");
        classicButton.textContent = STRINGS[this._lang].start;
        classicButton.style.padding = "10px 20px";
        classicButton.style.width = "120px";
        classicButton.style.fontSize = "18px";
        classicButton.style.cursor = "pointer";
        classicButton.style.backgroundColor = "#4286f4";
        classicButton.style.border = "none";
        classicButton.style.borderRadius = "5px";
        classicButton.style.color = "white";
        classicButton.classList.add("classic-btn");
        
        const powerUpsButton = document.createElement("button");
        powerUpsButton.textContent = STRINGS[this._lang].start;
        powerUpsButton.style.padding = "10px 20px";
        powerUpsButton.style.width = "120px";
        powerUpsButton.style.fontSize = "18px";
        powerUpsButton.style.cursor = "pointer";
        powerUpsButton.style.backgroundColor = "#f44283";
        powerUpsButton.style.border = "none";
        powerUpsButton.style.borderRadius = "5px";
        powerUpsButton.style.color = "white";
        powerUpsButton.classList.add("powerups-btn");
        
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
        speedContainer.style.display = "flex";
        speedContainer.style.flexDirection = "column";
        speedContainer.style.alignItems = "center";
        speedContainer.style.marginTop = "30px";
        speedContainer.style.width = "300px";
        
        const speedLabel = document.createElement("div");
        speedLabel.textContent = STRINGS[this._lang].gameSpeed || "Game Speed";
        speedLabel.style.color = "white";
        speedLabel.style.fontSize = "18px";
        speedLabel.style.marginBottom = "10px";
        
        const speedSliderContainer = document.createElement("div");
        speedSliderContainer.style.display = "flex";
        speedSliderContainer.style.alignItems = "center";
        speedSliderContainer.style.gap = "15px";
        speedSliderContainer.style.width = "100%";
        
        const minLabel = document.createElement("span");
        minLabel.textContent = `${CONFIG.SPEED.MULTIPLIER.MIN}x`;
        minLabel.style.color = "white";
        minLabel.style.fontSize = "14px";
        
        const speedSlider = document.createElement("input");
        speedSlider.type = "range";
        speedSlider.min = CONFIG.SPEED.MULTIPLIER.MIN.toString();
        speedSlider.max = CONFIG.SPEED.MULTIPLIER.MAX.toString();
        speedSlider.step = CONFIG.SPEED.MULTIPLIER.STEP.toString();
        speedSlider.value = this._speedMultiplier.toString();
        speedSlider.style.flex = "1";
        speedSlider.style.height = "6px";
        speedSlider.style.background = "#ddd";
        speedSlider.style.outline = "none";
        speedSlider.style.borderRadius = "3px";
        
        const maxLabel = document.createElement("span");
        maxLabel.textContent = `${CONFIG.SPEED.MULTIPLIER.MAX}x`;
        maxLabel.style.color = "white";
        maxLabel.style.fontSize = "14px";
        
        const speedValue = document.createElement("div");
        speedValue.textContent = `${this._speedMultiplier.toFixed(1)}x`;
        speedValue.style.color = "#4CAF50";
        speedValue.style.fontSize = "16px";
        speedValue.style.fontWeight = "bold";
        speedValue.style.marginTop = "5px";
        
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
        tableColorContainer.style.display = "flex";
        tableColorContainer.style.flexDirection = "column";
        tableColorContainer.style.alignItems = "center";
        tableColorContainer.style.marginTop = "30px";
        tableColorContainer.style.width = "300px";
        
        const tableColorLabel = document.createElement("div");
        tableColorLabel.textContent = STRINGS[this._lang].tableColor || "Table Color";
        tableColorLabel.style.color = "white";
        tableColorLabel.style.fontSize = "18px";
        tableColorLabel.style.marginBottom = "15px";
        
        const tableColorButton = document.createElement("button");
        tableColorButton.id = "tableColorButton";
        tableColorButton.textContent = this._tableTheme === 'GREEN' ? 
            (STRINGS[this._lang].switchToBlue || "Switch to Blue") : 
            (STRINGS[this._lang].switchToGreen || "Switch to Green");
        tableColorButton.style.padding = "10px 20px";
        tableColorButton.style.fontSize = "16px";
        tableColorButton.style.cursor = "pointer";
        tableColorButton.style.backgroundColor = this._tableTheme === 'GREEN' ? "#2196F3" : "#4CAF50";
        tableColorButton.style.border = "none";
        tableColorButton.style.borderRadius = "5px";
        tableColorButton.style.color = "white";
        tableColorButton.style.width = "160px";
        
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
        this._gameOverUI.style.position = "absolute";
        this._gameOverUI.style.top = "0";
        this._gameOverUI.style.left = "0";
        this._gameOverUI.style.width = "100%";
        this._gameOverUI.style.height = "100%";
        this._gameOverUI.style.display = "none";
        this._gameOverUI.style.flexDirection = "column";
        this._gameOverUI.style.justifyContent = "center";
        this._gameOverUI.style.alignItems = "center";
        this._gameOverUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const gameOverText = document.createElement("h2");
        gameOverText.id = "gameOverText";
        gameOverText.style.color = "#fff";
        gameOverText.style.fontSize = "48px";
        gameOverText.style.margin = "0 0 10px";
        
        const winnerText = document.createElement("h3");
        winnerText.id = "winnerText";
        winnerText.style.color = "#fff";
        winnerText.style.fontSize = "24px";
        winnerText.style.margin = "0 0 20px";
        
        const playAgainButton = document.createElement("button");
        playAgainButton.id = "playAgainButton";
        playAgainButton.style.padding = "10px 20px";
        playAgainButton.style.fontSize = "20px";
        playAgainButton.style.cursor = "pointer";
        playAgainButton.style.backgroundColor = "#4CAF50";
        playAgainButton.style.border = "none";
        playAgainButton.style.borderRadius = "5px";
        playAgainButton.style.color = "white";
        playAgainButton.style.marginBottom = "10px";
        playAgainButton.style.width = "180px";
        playAgainButton.style.textAlign = "center";
        
        playAgainButton.addEventListener("click", () => {
            this._onResetGame();
        });
        
        const menuButton = document.createElement("button");
        menuButton.id = "menuButton";
        menuButton.style.padding = "10px 20px";
        menuButton.style.fontSize = "20px";
        menuButton.style.cursor = "pointer";
        menuButton.style.backgroundColor = "#f44336";
        menuButton.style.border = "none";
        menuButton.style.borderRadius = "5px";
        menuButton.style.color = "white";
        menuButton.style.width = "180px";
        menuButton.style.textAlign = "center";
        
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
        selector.style.position = "fixed";
        selector.style.top = "24px";
        selector.style.right = "24px";
        selector.style.zIndex = "10000";
        selector.style.padding = "8px 16px";
        selector.style.fontSize = "1rem";
        selector.style.borderRadius = "8px";
        selector.style.background = "#222";
        selector.style.color = "#fff";
        selector.style.border = "1px solid #444";
        selector.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

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
            (tableColorButton as HTMLButtonElement).style.backgroundColor = 
                this._tableTheme === 'GREEN' ? "#2196F3" : "#4CAF50";
        }
    }
}
