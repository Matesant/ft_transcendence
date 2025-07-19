import { AView } from "../views/AView";
import { Builders } from "../views/Builders";

const routes: {[key: string]: () => AView } = {
    "/game": Builders.GameBuilder,
    "/tournament": Builders.TournamentBuilder,
    "/login": Builders.LoginBuilder,
    "/register": Builders.RegisterBuilder,
    "/dashboard": Builders.DashboardBuilder,
    "/players": Builders.PlayersBuilder,
    "/player": Builders.PlayerBuilder,
    "/settings": Builders.SettingsBuilder,
    "/": Builders.HomeBuilder
};

let view: AView | undefined = undefined;

export function router (){

    if (view) {
        view.dispose();
    }

    let path: string = location.pathname;

    if (path === "/" || path === "/register" || path === "/login" || path === "/game") {
        document.body.innerHTML = "";
    } else {
        
        if (!document.body.querySelector('left-sidebar')) {
            const leftSidebar = document.createElement('left-sidebar');
            document.body.appendChild(leftSidebar);
        }

    }

    view = routes[path] ? routes[path]() : undefined;
    
    if (view) {
        view.render(document.body);
    }
    else {
        document.body.innerHTML = "<h1>404 Not Found</h1>";
    }
}

export function navigateTo(path: string) {
    window.history.pushState({}, '', path);
    router();
}