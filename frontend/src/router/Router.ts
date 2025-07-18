import { AView } from "../views/AView";
import { Builders } from "../views/Builders";

const routes: {[key: string]: () => AView } = {
    "/game": Builders.GameBuilder,
    "/lobby": Builders.LobbyBuilder,
    "/tournament": Builders.TournamentBuilder,
    "/login": Builders.LoginBuilder,
    "/register": Builders.RegisterBuilder,
    "/": Builders.HomeBuilder
};

let view: AView | undefined = undefined;

export async function router (){

    if (view) {
        view.dispose();
    }

    document.body.innerHTML = "";
    let path: string = location.pathname;
    view = routes[path] ? routes[path]() : undefined;
    
    if (view) {
        await view.render();
    }
    else {
        document.body.innerHTML = "<h1>404 Not Found</h1>";
    }
}