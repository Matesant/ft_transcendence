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

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
