import { apiUrl } from "../utils/api";

class UserInfo extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.loadData();
    }

    private setupNavigation(): void {
      // Navegação para dashboard
      const dashboardBtn = this.querySelector('[data-route="/dashboard"]');
      if (dashboardBtn) {
        dashboardBtn.addEventListener('click', (e: Event) => {
          e.preventDefault();
          history.pushState("", "", "/dashboard");
          // Chame seu router aqui, se necessário
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
      }
    }
    
    private async loadUserAvatar(): Promise<void> {
      const avatarContainer = this.querySelector("#user-avatar-container");
      try {
        const response = await fetch(apiUrl(3003, '/users/me'), { credentials: "include" });
        if (!response.ok) throw new Error("Falha na request");
        const data = await response.json();
        const avatar = document.createElement("img");
        avatar.src = data.profile.avatar;
        avatar.alt = data.profile.alias;
        avatar.className = "w-full h-full object-cover";
        avatarContainer!.innerHTML = "";
        avatarContainer!.appendChild(avatar);
      } catch (err) {
        avatarContainer!.textContent = "foto user";
      }
    }
  
    private async loadData() {


      try {
        const resp = await fetch(apiUrl(3001, '/auth/verify'), {
          credentials: "include",
        });
        if (!resp.ok) {
          throw new Error(`HTTP error! status: ${resp.status}`);
        }
        const data = await resp.json();
  
        if (data.authenticated && data.user) {
          const alias = data.user.alias;
          const email = data.user.email;
          const is2fa = data.user.is_2fa_enabled;
  
          this.innerHTML = `
            
            <div class="flex justify-between items-center mb-10 w-full p-5 animate-slideDown">
              <div class="flex items-center cursor-pointer transition-all duration-300 hover:scale-105" data-route="/dashboard">
                <img src="/images/transcendence-logo.svg" alt="Transcendence Logo" class="max-h-36 w-auto drop-shadow-lg">
              </div>
              <div class="flex items-center gap-5">
                <div class="flex items-center gap-5">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-xs border-2 border-white/40 overflow-hidden transition-all duration-300 hover:scale-105 hover:border-white/60 shadow-2xl cursor-pointer" id="user-avatar-container">
                    <!-- Avatar será carregado aqui -->
                  </div>
                  <button class="logout-btn py-2.5 px-5 text-xs border-2 border-white/30 rounded-xl bg-white/15 backdrop-blur-sm text-white cursor-pointer font-medium transition-all duration-300 hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/50 relative overflow-hidden">🚪 logout</button>
                </div>
              </div>
            </div>


            <div class="mx-auto w-140 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 text-center space-y-2 mt-7">
              <div class="text-lg font-bold">${alias}</div>
              <div>${email}</div>
              <div>2FA ${is2fa ? "enabled" : "disabled"}</div>
              ${
                is2fa
                  ? `<disable-2fa-button data-alias="${alias}"></disable-2fa-button>`
                  : `<enable-2fa-button data-alias="${alias}"></enable-2fa-button>`
              }

            <!-- Botão que abre o modal -->
            <button id="openModalBtn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Choose avatar
            </button>

              <upload-avatar></upload-avatar>
            </div>

          <!-- Modal -->
          <div id="avatarModal"
               class="fixed inset-0  flex items-center justify-center hidden">
            <div id="modalContent"
                 class="bg-white rounded-lg p-4 shadow-lg">
              <select-avatar></select-avatar>
            </div>
          </div>
          `;

          this.setupNavigation();
          
        // Logout
        const logoutBtn = this.querySelector('.logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', async (e: Event) => {
            e.preventDefault();
            try {
              await fetch(apiUrl(3001, '/auth/logout'), {
                method: 'POST',
                credentials: 'include'
              });
              sessionStorage.clear();
              history.pushState("", "", "/login");
              window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (error) {
              history.pushState("", "", "/login");
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          });
        }

        this.loadUserAvatar();

        // lógica do modal
        const modal = this.querySelector("#avatarModal") as HTMLDivElement;
        const modalContent = this.querySelector("#modalContent") as HTMLDivElement;
        const openBtn = this.querySelector("#openModalBtn") as HTMLButtonElement;

        openBtn.addEventListener("click", () => {
          modal.classList.remove("hidden");
        });

        // Fecha ao clicar fora do conteúdo
        modal.addEventListener("click", (e) => {
          if (!modalContent.contains(e.target as Node)) {
            modal.classList.add("hidden");
          }
        });


        } else {
          this.innerHTML = `
            <div class="mx-auto w-96 border border-black rounded p-4 text-center">
              Usuário não autenticado
            </div>
          `;
        }
      } catch (err) {
        console.error(err);
        this.innerHTML = `
          <div class="mx-auto w-96 border border-black rounded p-4 text-center text-red-500">
            Erro ao carregar dados
          </div>
        `;
      }
    }
  }
  
  customElements.define("settings-info", UserInfo);
  