import { AView } from "./views/AView";
import { Builders } from "./views/Builders";

let routes: {[key: string]: () => AView } = {
    "/game": Builders.GameBuilder,
    "/login": Builders.LoginBuilder,
    "/": Builders.HomeBuilder
};

let path: string = location.pathname;
let view: AView | undefined = routes[path] ? routes[path]() : undefined;
if (view) {
    view.render();
}
else {
    document.body.innerHTML = "<h1>404 Not Found</h1>";
}
