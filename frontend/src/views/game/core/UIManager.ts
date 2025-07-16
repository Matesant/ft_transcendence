import { Language } from "../../i18n";
import { STRINGS } from "../../i18n";
import { GameMode } from "./GameMode";

export class UIManager {
    private _lang: Language = "ptBR";
    private _menuUI: HTMLDivElement;
    private _gameOverUI: HTMLDivElement;

    constructor() {}

    public createMenuUI(player1Name: string, player2Name: string, currentMatch: any, onClassic: () => void, onPowerUp: () => void, onHost: () => void, onJoin: () => void): HTMLDivElement {
        const menuUI = document.createElement("div");
        menuUI.style.position = "absolute";
        menuUI.style.top = "0";
        menuUI.style.left = "0";
        menuUI.style.width = "100%";
        menuUI.style.height = "100%";
        menuUI.style.display = "flex";
        menuUI.style.flexDirection = "column";
        menuUI.style.justifyContent = "center";
        menuUI.style.alignItems = "center";
        menuUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";

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
        this.updateMatchInfoDisplay(matchInfo, player1Name, player2Name, currentMatch);

        const subtitle = document.createElement("h2");
        subtitle.textContent = STRINGS[this._lang].selectGameMode;
        subtitle.style.color = "white";
        subtitle.style.fontSize = "24px";
        subtitle.style.marginBottom = "20px";

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
        classicButton.addEventListener("click", onClassic);

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
        powerUpsButton.addEventListener("click", onPowerUp);

        classicContainer.appendChild(classicLabel);
        classicContainer.appendChild(classicButton);
        powerUpsContainer.appendChild(powerUpsLabel);
        powerUpsContainer.appendChild(powerUpsButton);
        buttonsContainer.appendChild(classicContainer);
        buttonsContainer.appendChild(powerUpsContainer);

        const multiplayerTitle = document.createElement("h2");
        multiplayerTitle.textContent = "Multiplayer";
        multiplayerTitle.style.color = "white";
        multiplayerTitle.style.fontSize = "24px";
        multiplayerTitle.style.marginTop = "30px";
        multiplayerTitle.style.marginBottom = "20px";

        const multiplayerContainer = document.createElement("div");
        multiplayerContainer.style.display = "flex";
        multiplayerContainer.style.flexDirection = "row";
        multiplayerContainer.style.gap = "20px";

        const hostButton = document.createElement("button");
        hostButton.textContent = "HOST GAME";
        hostButton.style.padding = "10px 20px";
        hostButton.style.fontSize = "18px";
        hostButton.style.cursor = "pointer";
        hostButton.style.backgroundColor = "#42b4f4";
        hostButton.style.border = "none";
        hostButton.style.borderRadius = "5px";
        hostButton.style.color = "white";
        hostButton.addEventListener("click", onHost);

        const joinButton = document.createElement("button");
        joinButton.textContent = "JOIN GAME";
        joinButton.style.padding = "10px 20px";
        joinButton.style.fontSize = "18px";
        joinButton.style.cursor = "pointer";
        joinButton.style.backgroundColor = "#f4c542";
        joinButton.style.border = "none";
        joinButton.style.borderRadius = "5px";
        joinButton.style.color = "white";
        joinButton.addEventListener("click", onJoin);

        multiplayerContainer.appendChild(hostButton);
        multiplayerContainer.appendChild(joinButton);

        menuUI.appendChild(title);
        menuUI.appendChild(matchInfo);
        menuUI.appendChild(subtitle);
        menuUI.appendChild(buttonsContainer);
        menuUI.appendChild(multiplayerTitle);
        menuUI.appendChild(multiplayerContainer);

        document.body.appendChild(menuUI);
        this._menuUI = menuUI;
        return menuUI;
    }

    public createGameOverUI(onPlayAgain: () => void, onMenu: () => void): HTMLDivElement {
        const gameOverUI = document.createElement("div");
        gameOverUI.style.position = "absolute";
        gameOverUI.style.top = "0";
        gameOverUI.style.left = "0";
        gameOverUI.style.width = "100%";
        gameOverUI.style.height = "100%";
        gameOverUI.style.display = "none";
        gameOverUI.style.flexDirection = "column";
        gameOverUI.style.justifyContent = "center";
        gameOverUI.style.alignItems = "center";
        gameOverUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";

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
        playAgainButton.addEventListener("click", onPlayAgain);

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
        menuButton.addEventListener("click", onMenu);

        gameOverUI.appendChild(gameOverText);
        gameOverUI.appendChild(winnerText);
        gameOverUI.appendChild(playAgainButton);
        gameOverUI.appendChild(menuButton);
        document.body.appendChild(gameOverUI);
        this._gameOverUI = gameOverUI;
        return gameOverUI;
    }

    public updateMatchInfoDisplay(element: HTMLElement, player1Name: string, player2Name: string, currentMatch: any): void {
        if (currentMatch) {
            element.innerHTML = `
                <div><strong>${STRINGS[this._lang].currentMatch}</strong></div>
                <div>${player1Name} vs ${player2Name}</div>
                <div>${STRINGS[this._lang].round} ${currentMatch.round}</div>
            `;
        } else if (
            player1Name !== "Player 1" &&
            player2Name !== "Player 2"
        ) {
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

    public updateAllUIText(): void {
        if (!this._menuUI) return;
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
        const matchInfo = document.getElementById("matchInfo");
        if (matchInfo) this.updateMatchInfoDisplay(matchInfo, "Player 1", "Player 2", null);
        if (this._gameOverUI) {
            const gameOverText = document.getElementById("gameOverText");
            if (gameOverText) gameOverText.textContent = STRINGS[this._lang].gameOver;
            const playAgainBtn = document.getElementById("playAgainButton");
            if (playAgainBtn) {
                playAgainBtn.textContent = STRINGS[this._lang].playAgain;
            }
            const menuBtn = document.getElementById("menuButton");
            if (menuBtn) menuBtn.textContent = STRINGS[this._lang].mainMenu;
        }
    }

    public setLanguage(lang: Language): void {
        this._lang = lang;
        this.updateAllUIText();
    }

    public get lang() { return this._lang; }
}
