import { router } from "./router/Router";
import "./components/itemSidebar/itemSidebar"
import "./components/startTournament/startTournament";
import "./components/tournamentRounds/tournamentRounds";


window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
