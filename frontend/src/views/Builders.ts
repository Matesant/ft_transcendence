import { Game } from "./game/Game";
import { Home } from "./home/Home";
import { Login } from "./login/Login";
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
}