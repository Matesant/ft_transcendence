import { AView } from "../AView";
import { apiUrl } from "../../utils/api";
import { router } from "../../router/Router";

export class Friends extends AView {
  private friends: { alias: string; status: string; is_online: number }[] = [];
  private pendingReceived: { alias: string }[] = [];
  private updateInterval: number | null = null;

  public async render(parent: HTMLElement = document.body): Promise<void> {
    // Garantir que o usuário está marcado como online
    await this.setUserOnline();
    
    const friendsContainer = document.createElement("div");
    friendsContainer.className =
      "w-full min-h-screen p-5 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans animate-fadeInUp";
    friendsContainer.innerHTML = `
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
      <div class="flex flex-col md:flex-row gap-10 w-full max-w-4xl justify-center items-start mt-10">
        <!-- Received Requests -->
        <div class="flex-1 bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl min-w-[300px]">
          <h2 class="text-2xl font-bold mb-6 text-center">Received</h2>
          <div id="received-list" class="flex flex-col gap-4 mb-4"></div>
        </div>
        <!-- Friends List -->
        <div class="flex-1 bg-white/10 backdrop-blur-3xl rounded-3xl p-8 border border-white/20 shadow-2xl min-w-[300px]">
          <h2 class="text-2xl font-bold mb-6 text-center">Friends</h2>
          <div id="friends-list" class="flex flex-col gap-4 mb-4"></div>
        </div>
      </div>
      <!-- Add new friend -->
      <div class="w-full max-w-md mt-12 bg-white/10 backdrop-blur-3xl rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col items-center">
        <label class="text-lg font-semibold mb-2">Add new friend</label>
        <div class="flex w-full gap-2">
          <input id="add-friend-input" type="text" placeholder="Enter username" class="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all" />
          <button id="add-friend-btn" class="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-all text-white text-xl flex items-center justify-center"><span>✔️</span></button>
        </div>
        <div id="add-friend-message" class="text-sm mt-2"></div>
      </div>
    `;

    parent.appendChild(friendsContainer);
    this.setupNavigation(friendsContainer);
    this.loadUserAvatar(friendsContainer);

    // Definir usuário como online ao carregar a página
    await this.setUserOnline();

    await this.loadAndRenderLists(friendsContainer);

    // Atualizar lista de amigos a cada 30 segundos para refletir mudanças de status
    this.updateInterval = window.setInterval(async () => {
      try {
        await this.loadAndRenderLists(friendsContainer);
      } catch (e) {
        console.warn('Failed to update friends list:', e);
      }
    }, 30000);

    const addBtn = friendsContainer.querySelector("#add-friend-btn")! as HTMLButtonElement;
    const addInput = friendsContainer.querySelector("#add-friend-input")! as HTMLInputElement;
    const addMsg = friendsContainer.querySelector("#add-friend-message")! as HTMLElement;
    addBtn.addEventListener("click", async () => {
      const username = addInput.value.trim();
      if (!username) return;
      addBtn.disabled = true;
      addMsg.textContent = "";
      try {
        await this.addFriend(username);
        addMsg.textContent = `Solicitação enviada para: ${username}`;
        addMsg.className = "text-green-300 mt-2";
        addInput.value = "";
        await this.loadAndRenderLists(friendsContainer);
      } catch (e: any) {
        addMsg.textContent = e.message || "Erro ao adicionar amigo";
        addMsg.className = "text-red-300 mt-2";
      } finally {
        addBtn.disabled = false;
      }
    });
  }

  private async loadAndRenderLists(container: HTMLElement) {
    try {
      [this.friends, this.pendingReceived] = await Promise.all([
        this.fetchFriends(),
        this.fetchPendingReceived()
      ]);
    } catch (e) {
      this.friends = [];
      this.pendingReceived = [];
    }
    this.renderReceived(this.pendingReceived, container.querySelector("#received-list")!);
    this.renderFriends(this.friends, container.querySelector("#friends-list")!);
  }

  private async fetchFriends(): Promise<{ alias: string; status: string; is_online: number }[]> {
    const res = await fetch(apiUrl(3003, "/users/friends"), { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar amigos");
    const data = await res.json();
    return data.friends || [];
  }

  private async fetchPendingReceived(): Promise<{ alias: string }[]> {
    const res = await fetch(apiUrl(3003, "/users/friends/pending"), { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar pendentes");
    const data = await res.json();
    return data.pending || [];
  }

  private async addFriend(alias: string) {
    const res = await fetch(apiUrl(3003, "/users/friends/add"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend: alias }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao adicionar amigo");
    return data;
  }

  private async acceptFriend(from: string) {
    const res = await fetch(apiUrl(3003, "/users/friends/accept"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao aceitar");
    return data;
  }

  private async rejectFriend(from: string) {
    const res = await fetch(apiUrl(3003, "/users/friends/reject"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao rejeitar");
    return data;
  }

  private async removeFriend(alias: string) {
    const res = await fetch(apiUrl(3003, "/users/friends/remove"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend: alias }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao remover");
    return data;
  }

  private renderReceived(received: { alias: string }[], container: Element) {
    container.innerHTML = "";
    if (received.length === 0) {
      container.innerHTML = '<div class="text-white/60 text-center">Nenhuma solicitação recebida.</div>';
      return;
    }
    received.forEach((user) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2 border border-white/20 shadow-sm";
      row.innerHTML = `
        <span class="flex-1 text-lg font-medium">${user.alias}</span>
        <button class="accept-btn hover:text-green-400 text-2xl transition-all" title="Accept">✔️</button>
        <button class="decline-btn hover:text-red-400 text-2xl transition-all" title="Decline">✖️</button>
      `;
      row.querySelector(".accept-btn")!.addEventListener("click", async () => {
        row.querySelector(".accept-btn")!.setAttribute("disabled", "true");
        try {
          await this.acceptFriend(user.alias);
          await this.loadAndRenderLists(container.closest(".w-full.min-h-screen")!);
        } catch (e: any) {
          alert(e.message || "Erro ao aceitar");
        }
      });
      row.querySelector(".decline-btn")!.addEventListener("click", async () => {
        row.querySelector(".decline-btn")!.setAttribute("disabled", "true");
        try {
          await this.rejectFriend(user.alias);
          await this.loadAndRenderLists(container.closest(".w-full.min-h-screen")!);
        } catch (e: any) {
          alert(e.message || "Erro ao rejeitar");
        }
      });
      container.appendChild(row);
    });
  }

  private renderFriends(friends: { alias: string; status: string; is_online: number }[], container: Element) {
    container.innerHTML = "";
    if (friends.length === 0) {
      container.innerHTML = '<div class="text-white/60 text-center">Nenhum amigo encontrado.</div>';
      return;
    }
    friends.forEach((user) => {
      const isOnline = user.is_online === 1;
      const onlineIndicator = isOnline 
        ? '<div class="w-4 h-4 rounded-full bg-green-500 border-2 border-green-300 shadow-lg animate-pulse" title="Online"></div>'
        : '<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 shadow-lg" title="Offline"></div>';
      
      const statusText = isOnline ? '<span class="text-green-300 text-xs">online</span>' : '<span class="text-red-300 text-xs">offline</span>';
      
      const row = document.createElement("div");
      row.className =
        "flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2 border border-white/20 shadow-sm";
      row.innerHTML = `
        <div class="flex items-center gap-2 flex-1">
          ${onlineIndicator}
          <div class="flex flex-col">
            <span class="text-lg font-medium">${user.alias}</span>
            ${statusText}
          </div>
        </div>
        ${user.status === 'pending' ? '<span class="text-yellow-300 text-sm font-semibold">pending</span>' : `<button class="remove-btn hover:text-red-400 text-2xl transition-all" title="Remove">✖️</button>`}
      `;
      if (user.status !== 'pending') {
        row.querySelector(".remove-btn")!.addEventListener("click", async () => {
          row.querySelector(".remove-btn")!.setAttribute("disabled", "true");
          try {
            await this.removeFriend(user.alias);
            await this.loadAndRenderLists(container.closest(".w-full.min-h-screen")!);
          } catch (e: any) {
            alert(e.message || "Erro ao remover");
          }
        });
      }
      container.appendChild(row);
    });
  }

  private async loadUserAvatar(container: HTMLElement): Promise<void> {
    const avatarContainer = container.querySelector("#user-avatar-container");
    try {
      const response = await fetch(apiUrl(3003, "/users/me"), { credentials: "include" });
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

  private setupNavigation(container: HTMLElement): void {
    const dashboardBtn = container.querySelector('[data-route="/dashboard"]');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        history.pushState("", "", "/dashboard");
        router();
      });
    }
    const logoutBtn = container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        try {
          // Atualizar status offline antes do logout
          await fetch(apiUrl(3003, '/users/status/offline'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        } catch (statusError) {
          console.warn('Failed to update offline status:', statusError);
        }
        
        try {
          const response = await fetch(apiUrl(3001, '/auth/logout'), {
            method: 'POST',
            credentials: 'include'
          });
          sessionStorage.clear();
          history.pushState("", "", "/login");
          router();
        } catch (error) {
          history.pushState("", "", "/login");
          router();
        }
      });
    }
    const avatarContainer = container.querySelector('#user-avatar-container');
    if (avatarContainer) {
      avatarContainer.addEventListener('click', (e: Event) => {
        e.preventDefault();
        history.pushState("", "", "/settings");
        router();
      });
    }
  }

  private async setUserOnline(): Promise<void> {
    try {
      const response = await fetch(apiUrl(3003, '/users/status/online'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Enviar um objeto vazio como body
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to set user online:', response.status, errorData);
      } else {
        const data = await response.json();
      }
    } catch (error) {
      console.warn('Failed to update online status:', error);
    }
  }

  public dispose(): void {
    // Limpar o intervalo de atualização
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    const friendsContainer = document.querySelector(
      "div.w-full.min-h-screen.bg-gradient-to-br"
    );
    if (friendsContainer && friendsContainer.parentNode) {
      friendsContainer.parentNode.removeChild(friendsContainer);
    }
  }
}