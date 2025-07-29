import { apiUrl } from '../utils/api';

class selectAvatar extends HTMLElement {
    private selectedPath: string | null = null;
    private container!: HTMLDivElement;
    private messageBox!: HTMLDivElement;
  
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
      <div class="p-4 space-y-4 flex flex-col items-center">
        <div id="avatarsContainer" class="grid grid-cols-3 gap-4 border border-black rounded-lg p-4 w-80"></div>
        <button id="confirmBtn" class="px-4 py-2 bg-blue-500 text-white rounded">
          Usar avatar
        </button>
        <div id="messageBox" class="text-sm text-red-500 text-center"></div>
      </div>
    `;
  
      this.container = this.querySelector("#avatarsContainer") as HTMLDivElement;
      this.messageBox = this.querySelector("#messageBox") as HTMLDivElement;
      const confirmBtn = this.querySelector("#confirmBtn") as HTMLButtonElement;
  
      confirmBtn.addEventListener("click", () => this.confirmSelection());
  
      this.loadAvatars();
    }
  
    private async loadAvatars() {
      try {
        const resp = await fetch(apiUrl(3003, "/users/avatars"), {
          credentials: "include",
        });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();
        this.renderAvatars(data.avatars as string[]);
      } catch (err: any) {
        this.messageBox.textContent = `Erro ao carregar avatares: ${err.message}`;
      }
    }
  
    private renderAvatars(avatars: string[]) {
      this.container.innerHTML = "";
      avatars.forEach((url) => {
        const img = document.createElement("img");
        img.src = url;
        img.className =
          "cursor-pointer border rounded w-24 h-24 object-cover";
        img.addEventListener("click", () => this.selectAvatar(url, img));
        this.container.appendChild(img);
      });
    }
  
    private selectAvatar(url: string, imgEl: HTMLImageElement) {
      Array.from(this.container.children).forEach((child) =>
        (child as HTMLImageElement).classList.remove("ring", "ring-4", "ring-blue-500")
      );
  
      imgEl.classList.add("ring", "ring-4", "ring-blue-500");
      this.selectedPath = url;
    }
  
    private async confirmSelection() {
      if (!this.selectedPath) {
        this.messageBox.textContent = "Por favor, selecione um avatar primeiro.";
        return;
      }

      const avatar = this.selectedPath.replace(apiUrl(3003, "/uploads/"), "");

      try {
        const resp = await fetch(apiUrl(3003, "/users/avatar"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ avatar }),
        });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data.success) {
          this.messageBox.classList.remove("text-red-500");
          this.messageBox.classList.add("text-green-500");
          this.messageBox.textContent = "Avatar atualizado com sucesso!";
        } else {
          this.messageBox.textContent = "Falha ao atualizar avatar.";
        }
      } catch (err: any) {
        this.messageBox.textContent = `Erro ao atualizar: ${err.message}`;
      }
    }
  }
  
  customElements.define("select-avatar", selectAvatar);
  