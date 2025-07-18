import { Game } from "./game/Game";
import { GameModeSelector } from "./game/GameModeSelector";
import { Tournament } from "./tournament/Tournament";
import { Lobby } from "./lobby/Lobby";
import { Home } from "./home/Home";
import { Login } from "./login/Login";
import { Register } from "./register/Register";
import { AView } from "./AView";

export class Builders {
    public static GameBuilder(): AView {
        // Return a wrapper that shows the game mode selector
        return new GameModeWrapper();
    }

    public static HomeBuilder(): AView {
        return new Home();
    }

    public static LoginBuilder(): AView {
        return new Login();
    }

    public static RegisterBuilder(): AView {
        return new Register();
    }

    public static TournamentBuilder(): AView {
        return new Tournament(); // Assuming Tournament is similar to Game for now
    }

    public static LobbyBuilder(): AView {
        return new Lobby();
    }
}

// Wrapper class to integrate GameModeSelector with the existing AView pattern
class GameModeWrapper extends AView {
    private _gameModeSelector: GameModeSelector;
    
    constructor() {
        super();
        this._gameModeSelector = new GameModeSelector();
    }
    
    public render(): void {
        // The GameModeSelector handles its own rendering
        // When a mode is selected, it will create and render the appropriate Game instance
    }
    
    public dispose(): void {
        if (this._gameModeSelector) {
            this._gameModeSelector.dispose();
        }
    }
}