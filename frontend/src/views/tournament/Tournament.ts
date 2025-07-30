import { PongHeaderPublic } from "../../components/ui/PongHeaderPublic";
import { AView } from "../AView";
import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api";

export class Tournament extends AView {
    
    private element: HTMLElement;

  public render(parent: HTMLElement = document.body): void {
    parent.innerHTML = '';
    // Add header with language selector
    const header = PongHeaderPublic();
    parent.appendChild(header);

    // Create main tournament container using the same style as Dashboard
    const tournamentContainer = document.createElement('div');
    tournamentContainer.className = 'w-full min-h-screen max-h-screen overflow-y-auto p-2 pt-2 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans custom-scrollbar';

    // Main content container
    const mainContent = document.createElement('div');
    mainContent.className = 'flex flex-col gap-4 items-center w-full max-w-5xl animate-fadeInUp';

    // Content based on tournament state
    const contentContainer = document.createElement('div');
    contentContainer.className = 'w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-6 border border-white/20 shadow-2xl';

    // Check if there's an active tournament in the backend
    this.checkTournamentState(contentContainer);

    // Assemble the layout
    mainContent.appendChild(contentContainer);
    tournamentContainer.appendChild(mainContent);

    // Append to parent
    parent.appendChild(tournamentContainer);

    // Setup navigation
    this.setupNavigation(tournamentContainer);
    }

    private async checkTournamentState(contentContainer: HTMLElement): Promise<void> {
        // Check if user wants to start a new tournament
        const urlParams = new URLSearchParams(window.location.search);
        const forceNew = urlParams.get('new') === 'true';
        
        if (forceNew) {
            // Force show setup page for new tournament
            sessionStorage.removeItem("round_in_progress");
            const element = document.createElement('start-tournament');
            contentContainer.appendChild(element);
            return;
        }

        try {
            // Check if there's an active tournament in the backend
            const response = await fetch(apiUrl(3002, '/match/tournament'), {credentials: 'include'});
            
            if (response.ok) {
                const tournamentData = await response.json();
                
                // If we have tournament data with rounds, show tournament rounds
                if (tournamentData && tournamentData.rounds && tournamentData.rounds.length > 0) {
                    sessionStorage.setItem("round_in_progress", "true");
                    const element = document.createElement('tournament-rounds');
                    contentContainer.appendChild(element);
                    return;
                }
            }
        } catch (error) {
            console.log('No active tournament found, showing setup page');
        }

        // No tournament found, show setup page
        sessionStorage.removeItem("round_in_progress");
        const element = document.createElement('start-tournament');
        contentContainer.appendChild(element);
    }

    private setupNavigation(container: HTMLElement): void {
        // Handle back to dashboard button
        const backBtn = container.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e: Event) => {
                e.preventDefault();
                history.pushState("", "", "/dashboard");
                router();
            });
        }

        // Handle logo click to go back to dashboard
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
        // Remove tournament container
        const tournamentContainer = document.querySelector('div.w-full.min-h-screen.bg-gradient-to-br');
        if (tournamentContainer && tournamentContainer.parentNode) {
            tournamentContainer.parentNode.removeChild(tournamentContainer);
        }
        
        // Clean up any remaining children that are not left-sidebar
        Array.from(document.body.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
                document.body.removeChild(child);
            }
        });
    }
}