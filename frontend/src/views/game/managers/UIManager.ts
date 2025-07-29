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
        
        this._createGameOverUI();
        this._createLanguageSelector();
        
        const initialTableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
        this._tableTheme = initialTableTheme as 'GREEN' | 'BLUE';
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
            if (gameOverText) {
                gameOverText.style.display = "none";
            }
            if (winnerText) {
                winnerText.innerHTML = `🏆 ${STRINGS[this._lang].championLabel}: <span class="text-yellow-400">${champion}</span> 🏆`;
                winnerText.className = "text-white text-6xl mb-8 font-bold";
                winnerText.style.textShadow = "0 0 30px #ffd700, 0 0 20px #fff";
                winnerText.style.textAlign = "center";
                winnerText.style.width = "100%";
            }
            if (playAgainBtn) {
                playAgainBtn.style.display = "none";
                playAgainBtn.disabled = true;
            }
            if (menuBtn) {
                menuBtn.className = "";
                menuBtn.style.cssText = "";
                
                menuBtn.className = "px-8 py-4 text-2xl cursor-pointer bg-blue-500 border-none rounded-xl text-white w-60 text-center hover:bg-blue-600 transition-colors shadow-2xl";
                menuBtn.textContent = STRINGS[this._lang].mainMenu;
                menuBtn.style.position = "absolute";
                menuBtn.style.top = "60%";
                menuBtn.style.left = "50%";
                menuBtn.style.transform = "translateX(-50%)";
                menuBtn.style.display = "block";
            }
        } else {
            if (gameOverText) {
                gameOverText.textContent = STRINGS[this._lang].gameOver;
                gameOverText.className = "text-white text-5xl m-0 mb-2.5";
                gameOverText.style.display = "block";
            }
            if (winnerText) {
                winnerText.textContent = `${winner} ${STRINGS[this._lang].wins}`;
                winnerText.className = "text-white text-2xl m-0 mb-5";
                winnerText.style.cssText = ""; 
            }

            if (currentMatch) {
                if (winnerText) {
                    winnerText.innerHTML = `🎯 ${winner} ${STRINGS[this._lang].wins}`;
                    winnerText.className = "text-green-400 text-3xl mb-6 text-center font-bold";
                    winnerText.style.position = "absolute";
                    winnerText.style.top = "35%";
                    winnerText.style.left = "50%";
                    winnerText.style.transform = "translateX(-50%)";
                    winnerText.style.width = "100%";
                }
                if (gameOverText) {
                    gameOverText.textContent = `Próxima partida: ${currentMatch.player1} vs ${currentMatch.player2}`;
                    gameOverText.className = "text-white text-4xl mb-8 font-bold text-center";
                    gameOverText.style.display = "block";
                    gameOverText.style.position = "absolute";
                    gameOverText.style.top = "45%";
                    gameOverText.style.left = "50%";
                    gameOverText.style.transform = "translateX(-50%)";
                    gameOverText.style.width = "100%";
                }
                if (playAgainBtn) {
                    playAgainBtn.style.cssText = ""; 
                    playAgainBtn.className = "px-10 py-5 text-2xl cursor-pointer bg-green-500 border-none rounded-xl text-white w-56 text-center hover:bg-green-600 transition-colors shadow-lg mb-4 font-bold";
                    playAgainBtn.textContent = "Continuar";
                    playAgainBtn.style.display = "block";
                    playAgainBtn.style.position = "absolute";
                    playAgainBtn.style.top = "62%";
                    playAgainBtn.style.left = "50%";
                    playAgainBtn.style.transform = "translateX(-50%)";
                    playAgainBtn.disabled = false;
                }
                if (menuBtn) {
                    menuBtn.style.cssText = "";
                    menuBtn.className = "px-6 py-3 text-lg cursor-pointer bg-red-500 border-none rounded-lg text-white w-40 text-center hover:bg-red-600 transition-colors shadow-md";
                    menuBtn.textContent = STRINGS[this._lang].mainMenu;
                    menuBtn.style.display = "block";
                    menuBtn.style.position = "absolute";
                    menuBtn.style.top = "72%";
                    menuBtn.style.left = "50%";
                    menuBtn.style.transform = "translateX(-50%)";
                }
            } else {
                if (playAgainBtn) {
                    playAgainBtn.style.cssText = ""; 
                    playAgainBtn.className = "px-5 py-2.5 text-xl cursor-pointer bg-green-500 border-none rounded text-white mb-2.5 w-44 text-center hover:bg-green-600 transition-colors";
                    playAgainBtn.textContent = STRINGS[this._lang].playAgain;
                    playAgainBtn.style.display = "block";
                    playAgainBtn.disabled = false;
                }
                if (menuBtn) {
                    menuBtn.style.cssText = "";
                    menuBtn.className = "px-5 py-2.5 text-xl cursor-pointer bg-red-500 border-none rounded text-white w-44 text-center hover:bg-red-600 transition-colors";
                    menuBtn.textContent = STRINGS[this._lang].mainMenu;
                    menuBtn.style.display = "block";
                }
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
    }

    public getTableTheme(): 'GREEN' | 'BLUE' {
        return this._tableTheme;
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
}
