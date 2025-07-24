class UserInfo extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.loadData();
    }

    public async renderAvatar() {

      try {
        const response = await fetch("http://localhost:3003/users/me", {credentials: "include"});
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
  
        return `
          <img class="w-24 h-24 rounded-full object-cover mb-2" src="${data.profile.avatar}" alt="${data.profile.alias}"></img>
        `;

  
      } catch (err) {
        console.error("Network error:", err);
      }

      return '';
    }
  
    private async loadData() {
      try {
        const resp = await fetch("http://localhost:3001/auth/verify", {
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
          const avatarHtml = await this.renderAvatar();
  
          this.innerHTML = `
            <div class="mx-auto w-140 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4 text-center space-y-2 mt-7">
              <div id="user-info" class="mb-2 flex flex-col items-center">${avatarHtml}</div>
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
  