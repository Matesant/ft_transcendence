import { AView } from "../AView";
import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api";

export class Dashboard extends AView {

  public render(parent: HTMLElement = document.body): void {
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'w-full min-h-screen p-5 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans';
    dashboardContainer.innerHTML = `
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
      
      <div class="flex flex-col gap-10 items-center w-full max-w-5xl animate-fadeInUp">
        <div class="grid grid-cols-4 gap-8 w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-12 border border-white/20 shadow-2xl">
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/lobby">
            <span class="text-4xl drop-shadow-lg">🎮</span>
            <span class="text-lg text-center leading-relaxed font-bold">online</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/tournament">
            <span class="text-4xl drop-shadow-lg">🕹️</span>
            <span class="text-lg text-center leading-relaxed font-bold">Local</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/ranking">
            <span class="text-4xl drop-shadow-lg">🏆</span>
            <span class="text-lg text-center leading-relaxed font-bold">Ranking</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/friends">
            <span class="text-4xl drop-shadow-lg">💬</span> 
            <span class="text-lg text-center leading-relaxed font-bold">Friends</span>
          </button>
        </div>
        
        <div class="w-full max-w-4xl">
          <div class="stats-container border-2 border-white/30 rounded-3xl p-10 bg-white/10 backdrop-blur-3xl min-h-64 text-center shadow-2xl transition-all duration-300 hover:border-white/40 hover:bg-white/15">
            <div class="stats-placeholder text-white/80 text-lg italic">
              <p>Suas estatísticas aparecerão aqui em breve!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(dashboardContainer);

    this.setupNavigation(dashboardContainer);
    
    this.loadUserAvatar(dashboardContainer);
  }

  private async loadUserAvatar(container: HTMLElement): Promise<void> {
    const avatarContainer = container.querySelector("#user-avatar-container");
    const statsContainer = container.querySelector(".stats-placeholder");
    
    try {
      const response = await fetch(apiUrl(3003, "/users/me"), {credentials: "include"});
      if (!response.ok) throw new Error("Falha na request");
      const data = await response.json();

      const avatar = document.createElement("img");
      avatar.src = data.profile.avatar;
      avatar.alt = data.profile.alias;
      avatar.className = "w-full h-full object-cover";

      avatarContainer!.innerHTML = "";
      avatarContainer!.appendChild(avatar);

      if (statsContainer) {
        const totalGames = data.profile.wins + data.profile.losses;
        const winRate = totalGames > 0 ? Math.round((data.profile.wins / totalGames) * 100) : 0;
        
        statsContainer.innerHTML = `
          <div class="grid grid-cols-3 gap-6 mt-4">
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">🏆</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">Vitórias</div>
              <div class="text-2xl font-bold text-white">${data.profile.wins}</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">💔</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">Derrotas</div>
              <div class="text-2xl font-bold text-white">${data.profile.losses}</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">📊</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">Win Rate</div>
              <div class="text-2xl font-bold text-white">${winRate}%</div>
            </div>
          </div>
        `;
      }

    } catch (err) {
      avatarContainer!.textContent = "foto user";
      if (statsContainer) {
        statsContainer.innerHTML = "<p class='text-white/80'>Não foi possível carregar as estatísticas</p>";
      }
    }
  }

  private setupNavigation(container: HTMLElement): void {
    const navigationButtons = container.querySelectorAll('button[data-route]');
    navigationButtons.forEach(button => {
      button.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const route = (e.currentTarget as HTMLElement).getAttribute('data-route');
        if (route) {
          history.pushState("", "", route);
          router();
        }
      });
    });

    const logoutBtn = container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        
        try {
          const response = await fetch(apiUrl(3001, '/auth/logout'), {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            sessionStorage.clear();
            history.pushState("", "", "/login");
            router();
          } else {
            console.error('Logout failed');
            history.pushState("", "", "/login");
            router();
          }
        } catch (error) {
          console.error('Logout error:', error);
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

  public dispose(): void {
    const dashboardContainer = document.querySelector('div.w-full.min-h-screen.bg-gradient-to-br');
    if (dashboardContainer && dashboardContainer.parentNode) {
      dashboardContainer.parentNode.removeChild(dashboardContainer);
    }
  }
}