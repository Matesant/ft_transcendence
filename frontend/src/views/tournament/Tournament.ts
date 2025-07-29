import { AView } from "../AView";
import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api";

export class Tournament extends AView {
    
    private element: HTMLElement;

    public render(parent: HTMLElement = document.body): void {
        const tournamentContainer = document.createElement('div');
        tournamentContainer.className = 'w-full min-h-screen max-h-screen overflow-y-auto p-2 pt-2 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans custom-scrollbar';
        
        const header = document.createElement('div');
        header.className = 'flex justify-start items-center mb-4 w-full p-2 animate-slideDown';
        header.innerHTML = `
            <div class="flex items-center cursor-pointer transition-all duration-300 hover:scale-105" data-route="/dashboard">
            <img src="/images/transcendence-logo.svg" alt="Transcendence Logo" class="max-h-36 w-auto drop-shadow-lg">
            </div>
        `;

        const mainContent = document.createElement('div');
        mainContent.className = 'flex flex-col gap-4 items-center w-full max-w-5xl animate-fadeInUp';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-6 border border-white/20 shadow-2xl';

        this.checkTournamentState(contentContainer);

        tournamentContainer.appendChild(header);
        mainContent.appendChild(contentContainer);
        tournamentContainer.appendChild(mainContent);

        parent.appendChild(tournamentContainer);

        this.setupNavigation(tournamentContainer);
    }

    private async checkTournamentState(contentContainer: HTMLElement): Promise<void> {
        const urlParams = new URLSearchParams(window.location.search);
        const forceNew = urlParams.get('new') === 'true';
        
        if (forceNew) {
            sessionStorage.removeItem("round_in_progress");
            const element = document.createElement('start-tournament');
            contentContainer.appendChild(element);
            return;
        }

        try {
            const response = await fetch(apiUrl(3002, '/match/tournament'), {credentials: 'include'});
            
            if (response.ok) {
                const tournamentData = await response.json();
                
                if (tournamentData && tournamentData.rounds && tournamentData.rounds.length > 0) {
                    sessionStorage.setItem("round_in_progress", "true");
                    const element = document.createElement('tournament-rounds');
                    contentContainer.appendChild(element);
                    return;
                }
            }
        } catch (error) {
        }

        sessionStorage.removeItem("round_in_progress");
        const element = document.createElement('start-tournament');
        contentContainer.appendChild(element);
    }

    private setupNavigation(container: HTMLElement): void {
        const backBtn = container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e: Event) => {
                e.preventDefault();
                history.pushState("", "", "/dashboard");
                router();
            });
        }

        const logoContainer = container.querySelector('[data-route="/dashboard"]');
        if (logoContainer) {
            logoContainer.addEventListener('click', (e: Event) => {
                e.preventDefault();
                history.pushState("", "", "/dashboard");
                router();
            });
        }
    }

    public dispose(): void {
        const tournamentContainer = document.querySelector('div.w-full.min-h-screen.bg-gradient-to-br');
        if (tournamentContainer && tournamentContainer.parentNode) {
            tournamentContainer.parentNode.removeChild(tournamentContainer);
        }
        
        Array.from(document.body.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
                document.body.removeChild(child);
            }
        });
    }
}