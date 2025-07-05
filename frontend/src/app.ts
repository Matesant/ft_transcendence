import { router } from "./router/Router";
import "./components/itemSidebar/itemSidebar"

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);
