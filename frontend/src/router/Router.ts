import { AView } from "../views/AView";
import { Builders } from "../views/Builders";
import { apiUrl } from "../utils/api";

const routes: {[key: string]: () => AView } = {
    "/game": Builders.GameBuilder,
    "/tournament": Builders.TournamentBuilder,
    "/login": Builders.LoginBuilder,
    "/register": Builders.RegisterBuilder,
    "/forgotPassword": Builders.ForgotPasswordBuilder,
    "/dashboard": Builders.DashboardBuilder,
    "/ranking": Builders.PlayersBuilder,
    "/player": Builders.PlayerBuilder,
    "/online": Builders.OnlineBuilder,
    "/lobby": Builders.LobbyBuilder,
    "/settings": Builders.SettingsBuilder,
    "/friends": Builders.FriendsBuilder,
    "/": Builders.HomeBuilder,
    "/2fa": Builders.TwoFaBuilder,
};

async function isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch(apiUrl(3001, "/auth/verify"), {
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
    view = routes[path] ? routes[path]() : undefined;

    if (path === "/" || path === "/register" || path === "/login" || path === "/forgotPassword" || path === "/2fa") {
        view.render(document.body);
        return ;
    } else {
        const isAuth = await isAuthenticated();

        if (!isAuth) {
            history.pushState({}, '', '/login');
            router();
            return ;
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