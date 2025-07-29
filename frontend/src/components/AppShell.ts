import { router } from "../router/Router";

export class AppShell {
  private static instance: AppShell;
  private currentView: string = "";
  
  static getInstance(): AppShell {
    if (!AppShell.instance) {
      AppShell.instance = new AppShell();
    }
    return AppShell.instance;
  }
  
  public render(content: HTMLElement): void {
    document.body.innerHTML = `
      <div class="min-h-screen bg-slate-900 text-white flex">
        <!-- Sidebar -->
        <div class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 shadow-lg transition-all duration-300" id="sidebar">
          ${this.renderSidebar()}
        </div>
        
        <!-- Main content -->
        <div class="flex-1 ml-64">
          <!-- Top navigation -->
          <nav class="bg-slate-800 shadow-md p-4 flex items-center justify-between">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              PONG TOURNAMENT
            </h1>
            <div id="userMenuContainer" class="flex items-center gap-3">
              <!-- User menu will be injected here -->
            </div>
          </nav>
          
          <!-- Page content -->
          <main id="pageContent" class="p-6">
            <!-- View content gets injected here -->
          </main>
        </div>
      </div>
    `;
    
    // Insert the view content
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      pageContent.innerHTML = '';
      pageContent.appendChild(content);
    }
    
    this.setupUserMenu();
    this.setupEventListeners();
  }
  
  private renderSidebar(): string {
    return `
      <div class="p-5">
        <div class="flex items-center justify-center mb-8">
          <div class="text-3xl font-bold text-blue-400">PONG</div>
        </div>
        <ul class="space-y-2">
          <li>
            <a href="/" class="sidebar-link ${this.currentView === 'home' ? 'active' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="/game" class="sidebar-link ${this.currentView === 'game' ? 'active' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 7H7v6h6V7z" />
                <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd" />
              </svg>
              <span>Play Game</span>
            </a>
          </li>
          <li>
            <a href="/tournament" class="sidebar-link ${this.currentView === 'tournament' ? 'active' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              <span>Tournaments</span>
            </a>
          </li>
          <li>
            <a href="/leaderboard" class="sidebar-link ${this.currentView === 'leaderboard' ? 'active' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Leaderboard</span>
            </a>
          </li>
          <li>
            <a href="/profile" class="sidebar-link ${this.currentView === 'profile' ? 'active' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              <span>Profile</span>
            </a>
          </li>
          <li id="authLinks">
            <!-- Auth links are dynamically added -->
          </li>
        </ul>
      </div>
    `;
  }
  
  private setupUserMenu(): void {
    const userMenu = document.getElementById('userMenuContainer');
    if (userMenu) {
      fetch('http://localhost:3001/auth/session', { credentials: 'include' })
        .then(resp => resp.json())
        .then(data => {
          if (data.authenticated) {
            userMenu.innerHTML = `
              <div class="dropdown relative">
                <button class="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded px-3 py-2">
                  <span>${data.user.alias}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                <div class="dropdown-content hidden absolute right-0 mt-2 w-48 bg-slate-800 shadow-lg rounded py-2 z-50">
                  <a href="/profile" class="block px-4 py-2 hover:bg-slate-700">Profile</a>
                  <a href="/settings" class="block px-4 py-2 hover:bg-slate-700">Settings</a>
                  <div class="border-t border-slate-700 my-1"></div>
                  <button id="logoutBtn" class="w-full text-left px-4 py-2 hover:bg-slate-700">Logout</button>
                </div>
              </div>
            `;
            
            document.getElementById('authLinks')!.innerHTML = '';
            
            const dropdownBtn = userMenu.querySelector('button');
            const dropdownContent = userMenu.querySelector('.dropdown-content');
            
            dropdownBtn?.addEventListener('click', () => {
              dropdownContent?.classList.toggle('hidden');
            });
            
            document.getElementById('logoutBtn')?.addEventListener('click', this.handleLogout);
          } else {
            userMenu.innerHTML = `
              <a href="/login" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Login</a>
              <a href="/register" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">Register</a>
            `;
            
            document.getElementById('authLinks')!.innerHTML = `
              <a href="/login" class="sidebar-link ${this.currentView === 'login' ? 'active' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>Login</span>
              </a>
              <a href="/register" class="sidebar-link ${this.currentView === 'register' ? 'active' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                <span>Register</span>
              </a>
            `;
          }
        })
        .catch(err => {
          console.error("Error checking auth status:", err);
          userMenu.innerHTML = `
            <a href="/login" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm">Login</a>
            <a href="/register" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">Register</a>
          `;
        });
    }
  }
  
  private setupEventListeners(): void {
    // Add click listeners to all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (href) {
          history.pushState(null, '', href);
          router();
        }
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      }
    });
  }
  
  private handleLogout(): void {
    fetch('http://localhost:3001/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      window.location.href = '/';
    }).catch(err => {
      console.error("Logout error:", err);
    });
  }
  
  public setCurrentView(view: string): void {
    this.currentView = view;
  }
}