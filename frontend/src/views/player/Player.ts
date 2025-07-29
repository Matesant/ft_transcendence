import { AView } from "../AView";
import { router } from "../../router/Router";

export class Player extends AView
{
    public render(parent: HTMLElement = document.body): void{
        const playerContainer = document.createElement('div');
        playerContainer.className = 'w-full min-h-screen p-1 pt-1 box-border bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center font-sans custom-scrollbar';
        
        const header = document.createElement('div');
        header.className = 'flex justify-start items-center mb-1 w-full p-1 animate-slideDown';
        header.innerHTML = `
            <div class="flex items-center cursor-pointer transition-all duration-300 hover:scale-105" data-route="/dashboard">
                <img src="/images/transcendence-logo.svg" alt="Transcendence Logo" class="max-h-36 w-auto drop-shadow-lg">
            </div>
        `;

        const mainContent = document.createElement('div');
        mainContent.className = 'flex flex-col gap-1 items-center w-full max-w-5xl animate-fadeInUp pt-1';

        const contentContainer = document.createElement('div');
        contentContainer.className = 'w-full max-w-4xl bg-white/10 backdrop-blur-3xl rounded-3xl p-3 border border-white/20 shadow-2xl';

        let element = document.createElement('player-profile');
        contentContainer.appendChild(element);

        playerContainer.appendChild(header);
        mainContent.appendChild(contentContainer);
        playerContainer.appendChild(mainContent);

        parent.appendChild(playerContainer);

        this.setupNavigation(playerContainer);
    }

    private setupNavigation(container: HTMLElement): void {
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
        const playerContainer = document.querySelector('div.w-full.min-h-screen.bg-gradient-to-br');
        if (playerContainer && playerContainer.parentNode) {
            playerContainer.parentNode.removeChild(playerContainer);
        }
        
        Array.from(document.body.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'left-sidebar') {
                document.body.removeChild(child);
            }
        });
    }
}