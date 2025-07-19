import { Game } from "./game/Game";
import { GameModeSelector } from "./game/GameModeSelector";
import { Lobby } from "./lobby/Lobby";
import { Tournament } from "./tournament/Tournament";
import { Home } from "./home/Home";
import { Login } from "./login/Login";
import { Register } from "./register/Register";
import { Dashboard } from "./dashboard/Dashboard";
import { Players } from "./players/Players";
import { Player } from "./player/Player";
import { AView } from "./AView";

export class Builders {
    public static GameBuilder(): AView {
        return new LocalGameWrapper();
    }

    public static LobbyBuilder(): AView {
        return new Lobby();
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

    public static DashboardBuilder(): AView {
        return new Dashboard();
    }

    public static PlayersBuilder(): AView {
        return new Players();
    }

    public static PlayerBuilder(): AView {
        return new Player();
    }
}

class LocalGameWrapper extends AView {
    private _game: Game | null = null;

    public render(): void {
        this._game = new Game('local');
        this._game.render();
    }

    public dispose(): void {
        if (this._game) {
            this._game.dispose();
        }
    }
}