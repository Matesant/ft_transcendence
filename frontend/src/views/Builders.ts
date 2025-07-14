import { Game } from "./game/Game";
import { Tournament } from "./tournament/Tournament";
import { Home } from "./home/Home";
import { Login } from "./login/Login";
import { Register } from "./register/Register";
import { TwoFactorAuth } from "./TwoFactorAuth";
import { AView } from "./AView";

export class Builders {
    public static GameBuilder(): AView {
        return new Game();
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

    public static TwoFactorAuthBuilder(): AView {
        return new TwoFactorAuth();
    }

    public static TournamentBuilder(): AView {
        return new Tournament(); // Assuming Tournament is similar to Game for now
    }
}