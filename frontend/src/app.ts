import { AView } from "./views/AView";
import { ViewBuilders } from "./views/Builders";

let routes: {[key: string]: () => AView } = {
    "/game": ViewBuilders.GameBuilder,
    "/login": ViewBuilders.LoginBuilder,
    "/": ViewBuilders.HomeBuilder
};

let path: string = location.pathname;
let view: AView | undefined = routes[path] ? routes[path]() : undefined;
if (view) {
    view.render();
}
else {
    document.body.innerHTML = "<h1>404 Not Found</h1>";
}
