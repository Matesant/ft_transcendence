import { router } from "../router/Router";
import { apiUrl } from "../utils/api";

class playerProfile extends HTMLElement {
  private container!: HTMLDivElement;

  constructor() {
      super();
  }

  connectedCallback() {
      this.container = document.createElement("div");
      this.container.className = `
          flex justify-center items-center w-full p-4
      `;
      this.appendChild(this.container);

      this.loadProfile();
  }

  async loadProfile() {

      var player_name = history.state;

      if (player_name === "") {
          player_name = "me";
      }

      const url = apiUrl(3003, `/users/${player_name}`);

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
    
            let itemResultStyle = 'inline-block px-3 py-1.5 rounded-full text-sm font-semibold ';

            if (item.result === 'win') {
                itemResultStyle += 'bg-green-500/20 text-green-200 border border-green-500/30';
            }
            else if (item.result === 'loss') {
                itemResultStyle += 'bg-red-500/20 text-red-200 border border-red-500/30';
            }

            return `
              <div class="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div class="flex justify-between items-center mb-2">
                      <span class="font-semibold text-white">${item.opponent}</span>
                      <div class="${itemResultStyle}">${item.result.toUpperCase()}</div>
                  </div>
                  <div class="text-sm text-white/70">
                      ${new Date(item.date).toLocaleString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit'
                      })}
                  </div>
              </div>
          `;
          }).join("")
          : `<div class="text-center text-white/60 py-8 px-4 bg-white/5 rounded-xl border border-white/10">
                <div class="text-2xl mb-2">📊</div>
                <p>Nenhum histórico disponível.</p>
             </div>`;

      this.container.innerHTML = `
          <div class="max-w-2xl w-full">
              <!-- Avatar Section -->
              <div class="flex flex-col items-center mb-8">
                  <div class="relative">
                      <img src="${profile.avatar}" alt="avatar" class="w-40 h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl" />
                      <div class="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <h1 class="text-4xl font-bold text-white mt-6 drop-shadow-lg">${profile.alias}</h1>
              </div>
              
              <!-- Match History Section -->
              <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h2 class="text-2xl font-semibold text-white mb-6 text-center flex items-center justify-center gap-3">
                      <span class="text-3xl">🏆</span>
                      Match history
                  </h2>
                  <div class="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                      ${historyHtml}
                  </div>
              </div>
          </div>
      `;
  }
}

customElements.define("player-profile", playerProfile);
