import { router } from "./router/Router";

// Initialize router when DOM is loaded
window.addEventListener("DOMContentLoaded", router);

// Handle browser navigation (back/forward buttons)
window.addEventListener("popstate", router);
