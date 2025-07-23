class UserInfo extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.renderLoading();
      this.loadData();
    }
  
    private renderLoading() {
      this.innerHTML = `<div class="p-4">Carregando...</div>`;
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
            debugger;
          const alias = data.user.alias;
          const email = data.user.email;
          const is2fa = data.user.is_2fa_enabled;
  
          this.innerHTML = `
            <div class="p-4 space-y-2 border rounded">
              <div class="text-lg font-bold">Alias: ${alias}</div>
              <div>Email: ${email}</div>
              <div>2FA Enabled: ${is2fa ? "true" : "false"}</div>
            </div>
          `;
        } else {
          this.innerHTML = `<div class="p-4">Usuário não autenticado</div>`;
        }
      } catch (err) {
        console.error(err);
        this.innerHTML = `<div class="p-4 text-red-500">Erro ao carregar dados</div>`;
      }
    }
  }
  
  customElements.define("settings-info", UserInfo);
  