import { router } from "./router/Router";
import "./components/startTournament";
import "./components/tournamentRounds";
import "./components/playersTable";
import "./components/playerProfile";
import "./components/select-avatar";
import "./components/upload-avatar";
import "./components/settings-info";
import "./components/enable-2fa-button";
import "./components/disable-2fa-button";
import "./components/2fa-form";
import { createLanguageSelector } from "./components/ui/LanguageSelector";
import { getCurrentLanguage } from "./utils/language";

// Add the language selector to the document body and ensure language is initialized
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language (ensures it's loaded before components render)
    getCurrentLanguage();
    
    // Add language selector
    const langSelector = createLanguageSelector();
    document.body.appendChild(langSelector);
});

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
