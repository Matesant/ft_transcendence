import { Game } from "./game/Game";
import { Tournament } from "./tournament/Tournament";
import { Home } from "./home/Home";
import { Login } from "./login/Login";
import { Register } from "./register/Register";
import { ForgotPassword } from "./forgotPassword/ForgotPassword";
import { Dashboard } from "./dashboard/Dashboard";
import { Players } from "./ranking/Ranking";
import { Player } from "./player/Player";
import { Friends } from "./friends/Friends";
import { AView } from "./AView";
import { Lobby } from "./lobby/lobby";
import { Online } from "./online/Online";
import { Settings } from "./settings/Settings";
import { twoFa } from "./2fa/2fa";

export class Builders {
    public static GameBuilder(): AView {
        return new Game();
    }

    public static TwoFaBuilder(): AView {
        return new twoFa();
    }

    public static FriendsBuilder(): AView {
        return new Friends();
    }

    public static SettingsBuilder(): AView {
        return new Settings ();
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

    public static ForgotPasswordBuilder(): AView {
        return new ForgotPassword();
    }

    public static TournamentBuilder(): AView {
        return new Tournament();
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

    public static LobbyBuilder(): AView {
        return new Lobby();
    }

    public static OnlineBuilder(): AView {
        return new Online();
    }
}