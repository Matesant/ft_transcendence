import { router } from "./router/Router";
import "./components/startTournament";
import "./components/tournamentRounds";
import "./components/playersTable";
import "./components/playerProfile";
import "./components/select-avatar";
import "./components/upload-avatar"

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
