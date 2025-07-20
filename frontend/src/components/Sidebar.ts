import { apiUrl } from "../utils/api";

class Sidebar extends HTMLElement {

  constructor() {
    super();
  }

  async connectedCallback() {
    // Monta a base da sidebar
    this.innerHTML = `
      <aside id="default-sidebar"
        class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar">
        <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col items-center">
          <!-- Aqui vão avatar e alias -->
          <div id="user-info" class="mb-6 flex flex-col items-center"></div>

          <ul class="space-y-2 font-medium w-full">
            <item-sidebar href="/dashboard">Dashboard</item-sidebar>
            <item-sidebar href="/tournament">Tournament</item-sidebar>
            <item-sidebar href="/game">Game</item-sidebar>
            <item-sidebar href="/players">Players</item-sidebar>
            <item-sidebar href="/friends">Friends</item-sidebar>
            <item-sidebar href="/settings">Settings</item-sidebar>
            <item-sidebar href="/lobby">Lobby</item-sidebar>
          </ul>
        </div>
      </aside>
    `;

    const userInfoContainer = this.querySelector("#user-info");

    try {
      const response = await fetch(apiUrl(3003, "/users/me"), {credentials: "include"});
      if (!response.ok) throw new Error("Falha na request");
      const data = await response.json();

      // Cria o avatar
      const avatar = document.createElement("img");
      avatar.src = data.avatar;
      avatar.alt = data.alias;
      avatar.className = "w-24 h-24 rounded-full object-cover mb-2";

      // Cria o alias
      const alias = document.createElement("span");
      alias.textContent = data.alias;
      alias.className = "text-lg font-semibold text-gray-900 dark:text-white";

      userInfoContainer.appendChild(avatar);
      userInfoContainer.appendChild(alias);

    } catch (err) {
      // Em caso de erro de rede ou outro problema
      const errorMsg = document.createElement("span");
      errorMsg.textContent = "Network error";
      errorMsg.className = "text-red-500 text-sm text-center";
      userInfoContainer.appendChild(errorMsg);
    }
  }
}

customElements.define("left-sidebar", Sidebar);
