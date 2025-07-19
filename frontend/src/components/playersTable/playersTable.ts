import { router } from "../../router/Router";

class playersTable extends HTMLElement {

    private async getPlayersHtml(): Promise<string> {
        try {
            const response = await fetch("http://localhost:3001/players", {credentials: "include"});
            if (!response.ok) throw new Error("HTTP error");
            const players = await response.json();
  
            const playersHtml = players.map((p: any) => `
                <div class="p-2 bg-white rounded shadow text-center rounded border border-gray-500 hover:border-gray-950">
                    <p class="font-semibold text-gray-800">${p.alias}</p>
                    <p class="text-xs text-gray-500">${p.created_at}</p>
                </div>
            `).join("");
  
            return `
              <section class="bg-gray-100 rounded-lg shadow-lg p-6 w-full max-w-3xl rounded border border-gray-800">
                <h2 class="text-xl font-bold mb-4 text-gray-800">Players</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  ${playersHtml}
                </div>
              </section>
            `;
        } catch (err) {
            return `
              <section class="bg-red-100 text-red-700 rounded-lg shadow-lg p-6 w-full max-w-md text-center rounded border border-gray-800">
                <h2 class="text-lg font-bold mb-2">Network error</h2>
                <p class="text-sm">Não foi possível carregar os players.</p>
              </section>
            `;
        }
    }
  
    public async render(): Promise<void> {
        const playersSection = await this.getPlayersHtml();
  
        // Container geral para cards
        const cardsContainer = `
          <div class="sm:ml-64 mt-8 px-4">
            <div class="flex flex-wrap gap-6 justify-center">
              ${playersSection}
              <!-- ✅ Futuramente, basta adicionar outros <section> aqui -->
            </div>
          </div>
        `;
  
        this.innerHTML = `
          ${cardsContainer}
        `;

        const allPlayerDivs = this.querySelectorAll('.p-2.bg-white.rounded.shadow.text-center.rounded.border.border-gray-500')
        allPlayerDivs.forEach((div) => {
            div.addEventListener('click', () => {
                const alias = div.querySelector('p')?.textContent;
                if (alias) {
                    sessionStorage.setItem("selected_player", alias);
                    history.pushState("", "", "/player");
                    router();
                }
            });
        })
    }

  constructor() {
    super ();
    this.render();
  }

}

customElements.define("players-table", playersTable);
