import { router } from "../../router/Router";

class playerProfile extends HTMLElement {

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
  
    async connectedCallback() {
      await this.init();
    }
  
    async init() {
      const player = sessionStorage.getItem("selected_player");
      const url = `http://localhost:3003/users/${player}`;
  
      // layout base
      this.shadowRoot.innerHTML = `
        <div class="flex justify-center ml-64 mt-10">
          <div id="content" class="max-w-3xl w-full p-6 bg-white rounded shadow">
            <p class="text-center text-gray-500">Carregando...</p>
          </div>
        </div>
      `;
  
      const content = this.shadowRoot.querySelector("#content");
  
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
        const data = await res.json();
  
        // Monta o HTML do perfil
        const profile = data.profile;
        const history = data.history || [];
  
        // display_name fallback para alias
        const displayName = profile.display_name || profile.alias;
  
        let historyHtml = "";
        if (history.length === 0) {
          historyHtml = `<p class="text-gray-500">Nenhuma partida encontrada.</p>`;
        } else {
          historyHtml = `
            <ul class="divide-y divide-gray-200 mt-4">
              ${history.map(match => `
                <li class="py-2 flex justify-between">
                  <span>vs <strong>${match.opponent}</strong></span>
                  <span class="${match.result === "win" ? "text-green-600" : "text-red-600"}">
                    ${match.result}
                  </span>
                  <span class="text-sm text-gray-400">
                    ${new Date(match.date).toLocaleString()}
                  </span>
                </li>
              `).join("")}
            </ul>
          `;
        }
  
        content.innerHTML = `
          <div class="flex flex-col items-center">
            <img src="/avatars/${profile.avatar}" alt="Avatar" class="w-24 h-24 rounded-full mb-4 shadow">
            <h1 class="text-2xl font-bold">${displayName}</h1>
            <p class="text-gray-500 mb-6">@${profile.alias}</p>
            <h2 class="text-xl font-semibold mb-2">Histórico</h2>
            ${historyHtml}
          </div>
        `;
  
      } catch (err) {
        content.innerHTML = `
          <div class="text-center text-red-600">
            <p class="font-semibold">Network error</p>
            <p class="text-sm mt-2">${err.message}</p>
          </div>
        `;
      }
    }
  
  }
  
  customElements.define("player-profile", playerProfile);
  
