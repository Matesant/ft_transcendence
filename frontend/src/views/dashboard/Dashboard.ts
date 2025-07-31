import { AView } from "../AView";
import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api";
import { t } from "../../utils/LanguageContext";
import { PongHeaderPublic } from "../../components/ui/PongHeaderPublic";

export class Dashboard extends AView {
  public render(parent: HTMLElement = document.body): void {
    parent.innerHTML = '';
    // Add header with language selector (dashboard is first page after login)
    const header = PongHeaderPublic({ homeOnly: true });
    parent.appendChild(header);

    // Create main dashboard container using only Tailwind classes
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'w-full min-h-screen p-5 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans';
    dashboardContainer.innerHTML = `
      <div class="flex flex-col gap-10 items-center w-full max-w-5xl animate-fadeInUp mt-10">
        <div class="grid grid-cols-4 gap-8 w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-12 border border-white/20 shadow-2xl">
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/lobby">
            <span class="text-4xl drop-shadow-lg">🎮</span>
            <span class="text-lg text-center leading-relaxed font-bold">${t('online')}</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/tournament">
            <span class="text-4xl drop-shadow-lg">🕹️</span>
            <span class="text-lg text-center leading-relaxed font-bold">${t('local')}</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/ranking">
            <span class="text-4xl drop-shadow-lg">🏆</span>
            <span class="text-lg text-center leading-relaxed font-bold">${t('ranking')}</span>
          </button>
          <button class="flex flex-col items-center gap-4 py-9 px-24 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md text-white cursor-pointer font-semibold transition-all duration-500 min-h-40 shadow-xl hover:bg-white/20 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-white/50 active:-translate-y-1 active:scale-98 relative overflow-hidden" data-route="/friends">
            <span class="text-4xl drop-shadow-lg">💬</span> 
            <span class="text-lg text-center leading-relaxed font-bold">${t('friends')}</span>
          </button>
        </div>
        
        <div class="w-full max-w-4xl">
          <div class="stats-container border-2 border-white/30 rounded-3xl p-10 bg-white/10 backdrop-blur-3xl min-h-64 text-center shadow-2xl transition-all duration-300 hover:border-white/40 hover:bg-white/15">
            <div class="stats-placeholder text-white/80 text-lg italic">
              <p>${t('dashboardStatsSoon')}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append content
    parent.appendChild(dashboardContainer);

    // Add event listeners to navigation buttons
    this.setupNavigation(dashboardContainer);
    
    // Load user avatar
    this.loadUserAvatar(dashboardContainer);
  }

  private async loadUserAvatar(container: HTMLElement): Promise<void> {
    const avatarContainer = container.querySelector("#user-avatar-container");
    const statsContainer = container.querySelector(".stats-placeholder");

    try {
      const response = await fetch(apiUrl(3003, "/users/me"), {credentials: "include"});
      if (!response.ok) throw new Error("Falha na request");
      const data = await response.json();

      // Cria o avatar
      const avatar = document.createElement("img");
      avatar.src = data.profile.avatar;
      avatar.alt = data.profile.alias;
      avatar.className = "w-full h-full object-cover";

      // Limpa o container e adiciona a imagem
      if (avatarContainer) {
        avatarContainer.innerHTML = "";
        avatarContainer.appendChild(avatar);
      }

      // Atualiza as estatísticas com apenas vitórias, derrotas e win rate usando Tailwind
      if (statsContainer) {
        const totalGames = data.profile.wins + data.profile.losses;
        const winRate = totalGames > 0 ? Math.round((data.profile.wins / totalGames) * 100) : 0;

        statsContainer.innerHTML = `
          <div class="grid grid-cols-3 gap-6 mt-4">
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">🏆</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">${t('userWins')}</div>
              <div class="text-2xl font-bold text-white">${data.profile.wins}</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">💔</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">${t('losses')}</div>
              <div class="text-2xl font-bold text-white">${data.profile.losses}</div>
            </div>
            <div class="bg-white/10 rounded-2xl p-6 text-center transition-all duration-300 border border-white/20 hover:bg-white/15 hover:-translate-y-1 shadow-lg">
              <div class="text-3xl mb-3 drop-shadow-lg">📊</div>
              <div class="text-sm text-white/70 mb-2 uppercase tracking-widest font-medium">${t('winRate')}</div>
              <div class="text-2xl font-bold text-white">${winRate}%</div>
            </div>
          </div>
        `;
      }

    } catch (err) {
      // Em caso de erro, mantém o texto padrão
      if (avatarContainer) {
        avatarContainer.textContent = t('userPhoto');
      }
      if (statsContainer) {
        statsContainer.innerHTML = `<p class='text-white/80'>${t('dashboardStatsError')}</p>`;
      }
    }
  }

  private setupNavigation(container: HTMLElement): void {
    // Add click listeners to buttons with data-route attribute
    const navigationButtons = container.querySelectorAll('button[data-route]');
    navigationButtons.forEach(button => {
      button.addEventListener('click', (e: Event) => {
        e.preventDefault();
        // Use currentTarget to get the button element instead of the clicked element (emoji)
        const route = (e.currentTarget as HTMLElement).getAttribute('data-route');
        if (route) {
          history.pushState("", "", route);
          router();
        }
      });
    });

    // Handle logout button separately
    const logoutBtn = container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        
        try {
          // Call logout API endpoint
          const response = await fetch(apiUrl(3001, '/auth/logout'), {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            // Clear any session storage if needed
            sessionStorage.clear();
            // Redirect to login
            history.pushState("", "", "/login");
            router();
          } else {
            console.error('Logout failed');
            // Even if logout fails on server, redirect to login
            history.pushState("", "", "/login");
            router();
          }
        } catch (error) {
          console.error('Logout error:', error);
          // Redirect to login even on error
          history.pushState("", "", "/login");
          router();
        }
      });
    }

    // Handle avatar click to redirect to player profile
    const avatarContainer = container.querySelector('#user-avatar-container');
    if (avatarContainer) {
      avatarContainer.addEventListener('click', (e: Event) => {
        e.preventDefault();
        history.pushState("", "", "/settings"); // Redireciona para /player
        router();
      });
    }
  }

  public dispose(): void {
    // Remove dashboard container by finding it
    const dashboardContainer = document.querySelector('div.w-full.min-h-screen.bg-gradient-to-br');
    if (dashboardContainer && dashboardContainer.parentNode) {
      dashboardContainer.parentNode.removeChild(dashboardContainer);
    }
  }
}