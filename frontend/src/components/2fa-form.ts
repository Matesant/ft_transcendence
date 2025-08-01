import { navigateTo } from "../router/Router";
import { apiUrl } from "../utils/api";
import { PongHeaderPublic } from "./ui/PongHeaderPublic";

export class TwoFactorAuth extends HTMLElement {
  public alias: string = "teste";

  constructor() {
    super();
  }

  connectedCallback() {

    document.body.className = "bg-gradient-to-br from-indigo-500 to-purple-600 text-white h-screen";

    this.innerHTML = `
      <div class="mx-auto mt-20 w-96"> <!-- centralizado horizontal, largura fixa -->
      <h1 class="text-center text-2xl pb-4">Two factor authentication</h1>
        <div class="p-4 space-y-4 border rounded shadow border-2 border-white/20 rounded-2xl bg-white/10 backdrop-blur-md">
          <button id="requestBtn" class="px-4 py-2 bg-blue-500 text-white rounded w-full">Send code to email</button>
          <form id="verifyForm" class="space-y-2 p-4"> <!-- borda preta, arredondada, padding -->
            <input id="codeInput" type="text" placeholder="Type the code" class="border-none rounded-lg bg-black/20 text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 p-2 rounded w-full" required>
            <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded w-full">Check code</button>
          </form>
          <div id="status" class="text-sm"></div>
        </div>
      </div>
    `;

    let header = PongHeaderPublic({ homeOnly: true });
    this.insertAdjacentElement("afterbegin", header);

    const requestBtn = this.querySelector<HTMLButtonElement>("#requestBtn")!;
    const form = this.querySelector<HTMLFormElement>("#verifyForm")!;
    const codeInput = this.querySelector<HTMLInputElement>("#codeInput")!;
    const status = this.querySelector<HTMLDivElement>("#status")!;

    requestBtn.addEventListener("click", async () => {
      status.textContent = "Enviando código...";
      try {
        const res = await fetch(apiUrl(3001, '/auth/2fa/request'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: this.alias })
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = data.message;
        } else {
          status.textContent = data.error || "Erro ao solicitar código";
        }
      } catch (err) {
        status.textContent = "Erro de rede ao solicitar código";
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = codeInput.value.trim();
      if (!code) return;
      status.textContent = "Verificando código...";
      try {
        const res = await fetch(apiUrl(3001, '/auth/2fa/verify'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: this.alias, code }),
          credentials: "include"
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = data.message;
          // Atualizar status online após verificação 2FA bem-sucedida
          try {
            await fetch(apiUrl(3003, '/users/status/online'), {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
          } catch (statusError) {
            console.warn('Failed to update online status:', statusError);
          }
          navigateTo("/dashboard");
        } else {
          status.textContent = data.error || "Falha na verificação";
        }
      } catch (err) {
        status.textContent = "Erro de rede ao verificar código";
      }
    });
  }
}

customElements.define("two-factor-auth", TwoFactorAuth);
