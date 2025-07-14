import { AView } from "../views/AView";
import { Builders } from "../views/Builders";

const routes: {[key: string]: () => AView } = {
    "/game": Builders.GameBuilder,
    "/tournament": Builders.TournamentBuilder,
    "/login": Builders.LoginBuilder,
    "/register": Builders.RegisterBuilder,
    "/2fa": Builders.TwoFactorAuthBuilder,
    "/": Builders.HomeBuilder
};

let currentView: AView | undefined = undefined;

// Navigation function
export function navigateTo(path: string) {
    history.pushState(null, '', path);
    router();
}

export function router() {
    // Dispose current view if exists
    if (currentView) {
        currentView.dispose();
    }

    // Clear body
    document.body.innerHTML = "";
    
    // Get current path
    let path: string = location.pathname;
    
    // Get view builder
    const viewBuilder = routes[path];
    
    if (viewBuilder) {
        // Create new view
        currentView = viewBuilder();
        
        // Render view with body as parent
        currentView.render(document.body);
    } else {
        // 404 page
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-4 pong-bg">
                <div class="text-center">
                    <h1 class="text-6xl font-bold neon-glow-red mb-4">404</h1>
                    <p class="text-xl text-white mb-8">Page not found</p>
                    <button class="pong-btn pong-btn-primary" onclick="window.location.pathname = '/'">
                        GO HOME
                    </button>
                </div>
            </div>
        `;
    }
}