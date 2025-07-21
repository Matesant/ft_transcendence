import { AView } from "../AView";
import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api"; // Adicione este import

export class Dashboard extends AView {

  public render(parent: HTMLElement = document.body): void {
    // Create main dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';
    dashboardContainer.innerHTML = `
      <div class="dashboard-header">
        <button class="home-btn" data-route="/dashboard">
          <svg class="home-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-right">
          <div class="user-profile">
            <div class="user-avatar" id="user-avatar-container">
              <!-- Avatar será carregado aqui -->
            </div>
            <button class="logout-btn">🚪 logout</button>
          </div>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="game-modes">
          <button class="game-mode-btn" data-route="/lobby">
            <span class="btn-icon">🎮</span>
            <span class="btn-text">online</span>
          </button>
          <button class="game-mode-btn" data-route="/tournament">
            <span class="btn-icon">🕹️</span>
            <span class="btn-text">Local</span>
          </button>
          <button class="players-btn" data-route="/players">
            <span class="btn-icon">👥</span>
            <span class="btn-text">Jogadores</span>
          </button>
          <button class="settings-btn" data-route="/settings">
            <span class="btn-icon">⚙️</span> 
            <span class="btn-text">Settings</span>
          </button>
        </div>
        
        <div class="statistics-section">
          <div class="stats-container">
            <div class="stats-placeholder">
              <p>Suas estatísticas aparecerão aqui em breve!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .dashboard-container {
        width: 100%;
        min-height: 100vh;
        padding: 20px;
        box-sizing: border-box;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
        width: 100%;
        max-width: 900px;
        padding: 20px;
        animation: slideDown 0.6s ease-out;
      }
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      
      .user-profile {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      
      .user-avatar {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 3px solid rgba(255,255,255,0.4);
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }

      .user-avatar:hover {
        transform: scale(1.05);
        border-color: rgba(255,255,255,0.6);
      }

      .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .dashboard-content {
        display: flex;
        flex-direction: column;
        gap: 40px;
        align-items: center;
        width: 100%;
        max-width: 1200px;
        animation: fadeInUp 0.8s ease-out;
      }
      
      .game-modes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 30px;
        width: 100%;
        max-width: 1000px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 50px;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }
      
      .home-btn, .logout-btn {
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 12px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        color: white;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .home-btn {
        padding: 12px;
        font-size: 15px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .home-icon {
        width: 28px;
        height: 28px;
        transition: all 0.3s ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      
      .home-btn:hover .home-icon {
        transform: scale(1.1);
      }
      
      .logout-btn {
        padding: 10px 20px;
        font-size: 13px;
      }
      
      .home-btn:hover, .logout-btn:hover {
        background: rgba(255,255,255,0.25);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        border-color: rgba(255,255,255,0.5);
      }
      
      .game-mode-btn, .players-btn, .settings-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        padding: 35px 100px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 18px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(15px);
        color: white;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 160px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        position: relative;
        overflow: hidden;
      }
      
      .btn-icon {
        font-size: 32px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      
      .btn-text {
        font-size: 16px;
        text-align: center;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        line-height: 1.3;
      }
      
      .game-mode-btn:hover, .players-btn:hover, .settings-btn:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        border-color: rgba(255,255,255,0.5);
      }
      
      .game-mode-btn:active, .players-btn:active, .settings-btn:active {
        transform: translateY(-4px) scale(0.98);
      }
      
      .statistics-section {
        width: 100%;
        max-width: 1000px;
      }
      
      .stats-container {
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 20px;
        padding: 40px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(20px);
        min-height: 250px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      
      .stats-container:hover {
        border-color: rgba(255,255,255,0.4);
        background: rgba(255,255,255,0.15);
      }
      
      .stats-container h3 {
        margin: 0 0 30px 0;
        font-size: 24px;
        font-weight: 600;
        text-align: center;
        color: white;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      .stats-placeholder {
        color: rgba(255,255,255,0.8);
        font-size: 16px;
        font-style: italic;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-top: 10px;
      }
      
      .stat-item {
        background: rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        border: 1px solid rgba(255,255,255,0.2);
      }
      
      .stat-item:hover {
        background: rgba(255,255,255,0.15);
        transform: translateY(-2px);
      }
      
      .stat-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
      
      /* Animações */
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;

    // Append styles and content
    document.head.appendChild(style);
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
      avatar.src = data.avatar;
      avatar.alt = data.alias;
      avatar.style.width = "100%";
      avatar.style.height = "100%";
      avatar.style.objectFit = "cover";

      // Limpa o container e adiciona a imagem
      avatarContainer.innerHTML = "";
      avatarContainer.appendChild(avatar);

      // Atualiza as estatísticas com apenas vitórias, derrotas e win rate
      if (statsContainer) {
        const totalGames = data.wins + data.losses;
        const winRate = totalGames > 0 ? Math.round((data.wins / totalGames) * 100) : 0;
        
        statsContainer.innerHTML = `
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">🏆</div>
              <div class="stat-label">Vitórias</div>
              <div class="stat-value">${data.wins}</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">💔</div>
              <div class="stat-label">Derrotas</div>
              <div class="stat-value">${data.losses}</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📊</div>
              <div class="stat-label">Win Rate</div>
              <div class="stat-value">${winRate}%</div>
            </div>
          </div>
        `;
      }

    } catch (err) {
      // Em caso de erro, mantém o texto padrão
      avatarContainer.textContent = "foto user";
      if (statsContainer) {
        statsContainer.innerHTML = "<p>Não foi possível carregar as estatísticas</p>";
      }
    }
  }

  private setupNavigation(container: HTMLElement): void {
    // Add click listeners to buttons with data-route attribute
    const navigationButtons = container.querySelectorAll('button[data-route]');
    navigationButtons.forEach(button => {
      button.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const route = (e.target as HTMLElement).getAttribute('data-route');
        if (route) {
          history.pushState("", "", route);
          router();
        }
      });
    });

    // Handle logout button separately
    const logoutBtn = container.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        // Add logout logic here
        // For example: clear session, redirect to login
        history.pushState("", "", "/login");
        router();
      });
    }

    // Handle avatar click to redirect to player profile
    const avatarContainer = container.querySelector('#user-avatar-container');
    if (avatarContainer) {
      avatarContainer.addEventListener('click', (e: Event) => {
        e.preventDefault();
        history.pushState("", "", "/player"); // Redireciona para /player
        router();
      });
      
      // Add cursor pointer style to show it's clickable
      (avatarContainer as HTMLElement).style.cursor = 'pointer';
    }
  }

  public dispose(): void {
    // Remove only dashboard container and styles
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer && dashboardContainer.parentNode) {
      dashboardContainer.parentNode.removeChild(dashboardContainer);
    }
    
    // Remove dashboard styles
    const dashboardStyles = document.querySelector('style');
    if (dashboardStyles && dashboardStyles.parentNode) {
      dashboardStyles.parentNode.removeChild(dashboardStyles);
    }
  }
}