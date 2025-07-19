import { router } from "./router/Router";
import "./components/itemSidebar"
import "./components/startTournament";
import "./components/tournamentRounds";
import "./components/playersTable";
import "./components/playerProfile";
import "./components/Sidebar";

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
