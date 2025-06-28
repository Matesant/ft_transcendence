import { Game } from "./views/game/Game";
import { Login } from "./views/login/Login";
import { AView } from "./views/AView";
import { Home } from "./views/home/Home";

let routes: string[] = ["/game", "/login"];

if (location.pathname === "/game") {
    const gameView: AView = new Game();
    gameView.render();
}
else if (location.pathname === "/login") {
    const loginView: AView = new Login();
    loginView.render();
}
else {
    const homeView: AView = new Home();
    homeView.render();
}