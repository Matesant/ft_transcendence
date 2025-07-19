import { router } from "../../router/Router";

class playerProfile extends HTMLElement {
  private container!: HTMLDivElement;

  constructor() {
      super();
  }

  connectedCallback() {
      // cria o container principal
      this.container = document.createElement("div");
      this.container.className = `
          ml-64 flex justify-center w-[calc(100%-16rem)] p-4
      `;
      this.appendChild(this.container);

      this.loadProfile();
  }

  async loadProfile() {
      const player_name = sessionStorage.getItem("selected_player");
      if (!player_name) {
          this.container.innerHTML = `<p class="text-red-500">Player not selected.</p>`;
          return;
      }

      const url = `http://localhost:3003/users/${player_name}`;

      try {
          const resp = await fetch(url, {credentials: "include"});
          if (!resp.ok) {
              throw new Error(`HTTP error! status: ${resp.status}`);
          }
          const data = await resp.json();
          this.renderProfile(data);
      } catch (err) {
          console.error(err);
          this.container.innerHTML = `
              <div class="text-center text-red-500">Network error when loading profile.</div>
          `;
      }
  }

  renderProfile(data: any) {
      const profile = data.profile;
      const history: any[] = data.history || [];

      const historyHtml = history.length > 0
          ? history.map(item => {
    
            let itemResultStyle = 'inline-block px-2 py-1 rounded-full text-xs font-semibold ';

            if (item.result === 'win') {
                itemResultStyle += 'bg-green-100 text-green-800';
            }
            else if (item.result === 'loss') {
                itemResultStyle += 'bg-red-100 text-red-800';
            }

            return `
              <tr class="border-b">
                  <td class="py-2 px-4 text-center">${item.opponent}</td>
                  <td class="py-2 px-4 text-center"> <div class="${itemResultStyle}">${item.result}</div></td>
                  <td class="py-2 px-4 text-center">${new Date(item.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'})}</td>
              </tr>
          `;
          }).join("")
          : `<tr><td colspan="3" class="py-2 px-4 text-center text-gray-500">Nenhum histórico disponível.</td></tr>`;

      this.container.innerHTML = `
          <div class="max-w-md w-full">
              <div class="flex flex-col items-center mb-6">
                  <img src="${profile.avatar}" alt="avatar" class="w-32 h-32 rounded-full mb-4 object-cover" />
                  <h1 class="text-2xl font-bold">${profile.alias}</h1>
              </div>
              <h2 class="text-xl font-semibold mb-4 text-center border-b pb-2">Match history</h2>
              <div class="overflow-x-auto">
                  <table class="min-w-full bg-white border border-gray-800">
                      <thead>
                          <tr class="bg-gray-100 border-b border-gray-800">
                              <th class="py-2 px-4 text-center">Opponent</th>
                              <th class="py-2 px-4 text-center">Result</th>
                              <th class="py-2 px-4 text-center">Date</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${historyHtml}
                      </tbody>
                  </table>
              </div>
          </div>
      `;
  }
}

customElements.define("player-profile", playerProfile);
