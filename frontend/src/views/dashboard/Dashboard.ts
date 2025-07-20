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
        <button class="home-btn" data-route="/dashboard">voltar home</button>
        <div class="header-right">
          <button class="settings-btn" data-route="/settings">settings</button>
          <div class="user-profile">
            <div class="user-avatar" id="user-avatar-container">
              <!-- Avatar será carregado aqui -->
            </div>
            <button class="logout-btn">logout</button>
          </div>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="game-modes">
          <button class="game-mode-btn" data-route="/lobby">1 v 1 online</button>
          <button class="game-mode-btn" data-route="/game">LOCAL</button>
          <button class="players-btn" data-route="/players">Jogadores</button>
        </div>
        
        <div class="statistics-section">
          <div class="stats-container">
            <h3>estatísticas</h3>
            <!-- Statistics content will go here -->
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
// ...existing code...

    style.textContent = `
      .dashboard-container {
        width: 100%;
        height: 100vh;
        padding: 20px;
        box-sizing: border-box;
        background-color: #f5f5f5;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        width: 100%;
        max-width: 1200px;
      }
      
      .header-right {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      
      .user-profile {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 2px solid #333;
        overflow: hidden;
      }

      .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .dashboard-content {
        display: flex;
        flex-direction: column;
        gap: 30px;
        align-items: center;
        width: 100%;
        max-width: 1200px;
      }
      
      .game-modes {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      /* Botões do header com tamanhos menores */
      .home-btn {
        padding: 12px 24px;
        border: 2px solid #333;
        border-radius: 8px;
        background-color: white;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
      }
      
      .settings-btn {
        padding: 10px 20px;
        border: 2px solid #333;
        border-radius: 8px;
        background-color: white;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
      }
      
      .logout-btn {
        padding: 8px 16px;
        border: 2px solid #333;
        border-radius: 8px;
        background-color: white;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.3s;
      }
      
      /* Botões dos game modes - grandes */
      .game-mode-btn, .players-btn {
        padding: 80px 80px;
        border: 2px solid #333;
        border-radius: 10px;
        background-color: white;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.3s;
        min-width: 200px;
        min-height: 150px;
      }
      
      .home-btn:hover, .settings-btn:hover, .logout-btn:hover,
      .game-mode-btn:hover, .players-btn:hover {
        background-color: #f0f0f0;
        transform: scale(1.05);
      }
      
      .statistics-section {
        width: 100%;
        max-width: 1000px;
      }
      
      .stats-container {
        border: 2px solid #333;
        border-radius: 15px;
        padding: 25px;
        background-color: white;
        min-height: 200px;
        text-align: center;
      }
      
      .stats-container h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        text-align: center;
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

    } catch (err) {
      // Em caso de erro, mantém o texto padrão
      avatarContainer.textContent = "foto user";
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