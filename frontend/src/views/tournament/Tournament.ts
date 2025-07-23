import { AView } from "../AView";
import { router } from "../../router/Router";

export class Tournament extends AView {
    
    private element: HTMLElement;

    public render(parent: HTMLElement = document.body): void {
        // Create main tournament container using the same style as Dashboard
        const tournamentContainer = document.createElement('div');
        tournamentContainer.className = 'w-full min-h-screen max-h-screen overflow-y-auto p-5 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans custom-scrollbar';
        
        // Header similar to Dashboard
        const header = document.createElement('div');
        header.className = 'flex justify-start items-center mb-10 w-full p-5 animate-slideDown';
        header.innerHTML = `
            <div class="flex items-center cursor-pointer transition-all duration-300 hover:scale-105" data-route="/dashboard">
                <img src="/images/transcendence-logo.svg" alt="Transcendence Logo" class="max-h-16 w-auto drop-shadow-lg">
            </div>
        `;

        // Main content container
        const mainContent = document.createElement('div');
        mainContent.className = 'flex flex-col gap-10 items-center w-full max-w-5xl animate-fadeInUp';

        // Content based on tournament state
        const contentContainer = document.createElement('div');
        contentContainer.className = 'w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-12 border border-white/20 shadow-2xl';

        let round_in_progress = sessionStorage.getItem("round_in_progress");
        
        if (round_in_progress === "true") {
            // Tournament in progress - show rounds component
            const element = document.createElement('tournament-rounds');
            contentContainer.appendChild(element);
        } else {
            // Start new tournament - show start tournament component
            const element = document.createElement('start-tournament');
            contentContainer.appendChild(element);
        }

        // Assemble the layout
        tournamentContainer.appendChild(header);
        mainContent.appendChild(contentContainer);
        tournamentContainer.appendChild(mainContent);

        // Append to parent
        parent.appendChild(tournamentContainer);

        // Setup navigation
        this.setupNavigation(tournamentContainer);
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