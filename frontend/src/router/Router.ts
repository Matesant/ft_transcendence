import { RetryStrategy } from "@babylonjs/core";
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
    "/online": Builders.OnlineBuilder,
    "/lobby": Builders.LobbyBuilder,
    "/settings": Builders.SettingsBuilder,
    "/": Builders.HomeBuilder
};

async function isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:3001/auth/verify", {
        credentials: "include",
      });
  
      if (!response.ok) {
        return false;
      }
  
      const data: {
        authenticated: boolean;
        user?: { id: number; alias: string; email: string; is_2fa_enabled: number };
        error?: string;
      } = await response.json();
  
      return data.authenticated === true;
    } catch (error) {
      console.log("Redirect to login:", error);
      return false;
    }
  }
  

let view: AView | undefined = undefined;

export async function router (){

    if (view) {
        view.dispose();
        view = undefined;
    }

    let path: string = location.pathname;
    const isAuth = await isAuthenticated();
    view = routes[path] ? routes[path]() : undefined;

    if (path === "/" || path === "/register" || path === "/login") {
        view.render(document.body);
        return ;
    } else {
        if (!isAuth) {
            history.pushState({}, '', '/login');
            router();
            return ;
        }
        else if (!document.body.querySelector('left-sidebar')) {
            const leftSidebar = document.createElement('left-sidebar');
            document.body.appendChild(leftSidebar);
        }
    }

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