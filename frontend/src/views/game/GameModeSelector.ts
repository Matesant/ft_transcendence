import { Game, GameMode } from "../game/Game";
import { STRINGS, Language } from "../i18n";

export class GameModeSelector {
    private _container: HTMLDivElement;
    private _currentGame: Game | null = null;
    private _lang: Language = "ptBR";

    constructor() {
        this._createUI();
    }

    private _createUI(): void {
        this._container = document.createElement("div");
        this._container.style.position = "fixed";
        this._container.style.top = "0";
        this._container.style.left = "0";
        this._container.style.width = "100%";
        this._container.style.height = "100%";
        this._container.style.display = "flex";
        this._container.style.flexDirection = "column";
        this._container.style.justifyContent = "center";
        this._container.style.alignItems = "center";
        this._container.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
        this._container.style.zIndex = "10000";

        const title = document.createElement("h1");
        title.textContent = "PONG";
        title.style.color = "white";
        title.style.fontSize = "64px";
        title.style.marginBottom = "50px";
        title.style.textAlign = "center";
        title.style.textShadow = "0 0 20px #00ff00, 0 0 40px #00ff00";

        const subtitle = document.createElement("h2");
        subtitle.textContent = "Choose Game Mode";
        subtitle.style.color = "white";
        subtitle.style.fontSize = "28px";
        subtitle.style.marginBottom = "40px";
        subtitle.style.textAlign = "center";

        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.gap = "30px";
        buttonsContainer.style.flexWrap = "wrap";
        buttonsContainer.style.justifyContent = "center";

        // Local Game Button
        const localGameButton = this._createModeButton(
            "🏠 Local Game",
            "Play with a friend on the same computer",
            "#4CAF50",
            () => this._startLocalGame()
        );

        // Multiplayer Button
        const multiplayerButton = this._createModeButton(
            "🌐 Online Multiplayer",
            "Play against someone online",
            "#2196F3",
            () => this._startMultiplayerGame()
        );

        buttonsContainer.appendChild(localGameButton);
        buttonsContainer.appendChild(multiplayerButton);

        this._container.appendChild(title);
        this._container.appendChild(subtitle);
        this._container.appendChild(buttonsContainer);

        document.body.appendChild(this._container);
    }

    private _createModeButton(
        title: string,
        description: string,
        color: string,
        onClick: () => void
    ): HTMLDivElement {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        buttonContainer.style.borderRadius = "15px";
        buttonContainer.style.padding = "30px";
        buttonContainer.style.width = "300px";
        buttonContainer.style.textAlign = "center";
        buttonContainer.style.cursor = "pointer";
        buttonContainer.style.transition = "all 0.3s ease";
        buttonContainer.style.border = `2px solid ${color}`;

        const titleElement = document.createElement("h3");
        titleElement.textContent = title;
        titleElement.style.color = color;
        titleElement.style.fontSize = "24px";
        titleElement.style.margin = "0 0 15px 0";

        const descriptionElement = document.createElement("p");
        descriptionElement.textContent = description;
        descriptionElement.style.color = "white";
        descriptionElement.style.fontSize = "16px";
        descriptionElement.style.margin = "0";
        descriptionElement.style.lineHeight = "1.4";

        buttonContainer.appendChild(titleElement);
        buttonContainer.appendChild(descriptionElement);

        // Hover effects
        buttonContainer.addEventListener("mouseenter", () => {
            buttonContainer.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            buttonContainer.style.transform = "translateY(-5px)";
            buttonContainer.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.3)`;
        });

        buttonContainer.addEventListener("mouseleave", () => {
            buttonContainer.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            buttonContainer.style.transform = "translateY(0)";
            buttonContainer.style.boxShadow = "none";
        });

        buttonContainer.addEventListener("click", onClick);

        return buttonContainer;
    }

    private _startLocalGame(): void {
        // Clean up any existing game first
        if (this._currentGame) {
            this._currentGame.dispose();
            this._currentGame = null;
        }

        this._currentGame = new Game('local', undefined, undefined, () => {
            this._hide();
        });
        this._currentGame.render();
    }

    private async _startMultiplayerGame(): Promise<void> {
        // Get player info (in a real app, this would come from authentication)
        const playerId = this._generatePlayerId();
        const playerName = await this._getPlayerName();

        if (!playerName) {
            alert("Player name is required for multiplayer!");
            return;
        }

        // Clean up any existing game first
        if (this._currentGame) {
            this._currentGame.dispose();
            this._currentGame = null;
        }

        // Hide the selector immediately when starting multiplayer
        this._hide();

        this._currentGame = new Game('remote', playerId, playerName, () => {
            // The game will handle hiding its own internal UI when ready
            console.log("Multiplayer game started successfully");
        });
        this._currentGame.render();
    }

    private async _getPlayerName(): Promise<string | null> {
        // In a real application, this would come from the authentication service
        // For now, we'll use a simple prompt
        return prompt("Enter your player name:") || null;
    }

    private _generatePlayerId(): string {
        // Generate a simple unique ID
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    private _hide(): void {
        this._container.style.display = "none";
    }

    private _show(): void {
        this._container.style.display = "flex";
    }

    public dispose(): void {
        if (this._currentGame) {
            this._currentGame.dispose();
            this._currentGame = null;
        }

        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
    }

    public showModeSelector(): void {
        // Clean up current game if any
        if (this._currentGame) {
            this._currentGame.dispose();
            this._currentGame = null;
        }

        this._show();
    }
}
