class UserInfo extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.renderLoading();
      this.loadData();
    }
  
    private renderLoading() {
      this.innerHTML = `
        <div class="mx-auto w-96 border border-black rounded p-4 text-center">
          Carregando...
        </div>
      `;
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
  
          this.innerHTML = `
            <div class="mx-auto w-96 border border-black rounded p-4 mt-6 text-center space-y-2">
              <div class="text-lg font-bold">${alias}</div>
              <div>${email}</div>
              <div>2FA: ${is2fa ? "enabled" : "disabled"}</div>
              ${
                is2fa
                  ? `<disable-2fa-button data-alias="${alias}"></disable-2fa-button>`
                  : `<enable-2fa-button data-alias="${alias}"></enable-2fa-button>`
              }
            </div>
          `;
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
  