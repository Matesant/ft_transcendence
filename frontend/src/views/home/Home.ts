import { AView } from "../AView";
import { PongButton } from "../../components/ui";
import { navigateTo } from "../../router/Router";

export class Home extends AView {
  private elements: HTMLElement[] = [];

  public render(parent: HTMLElement = document.body): void {
    parent.innerHTML = '';

    // Fundo animado
    const bg = document.createElement('div');
    bg.className = 'pong-bg min-h-screen flex flex-col';
    bg.style.minHeight = '100vh';

    // Header
    const header = document.createElement('header');
    header.className = 'w-full max-w-5xl mx-auto flex justify-between items-center px-4 md:px-8 py-4';

    // Logo/título
    const logo = document.createElement('div');
    logo.className = 'text-2xl md:text-3xl font-extrabold neon-glow-green select-none tracking-wide';
    logo.textContent = 'ft_transcendence';

    // Botões Login/Register
    const headerBtns = document.createElement('div');
    headerBtns.className = 'flex gap-3';
    const loginBtn = PongButton({ text: 'Login', variant: 'secondary', onClick: () => navigateTo('/login'), extraClass: 'w-auto px-6 py-2 text-base' });
    const registerBtn = PongButton({ text: 'Register', variant: 'primary', onClick: () => navigateTo('/register'), extraClass: 'w-auto px-6 py-2 text-base' });
    headerBtns.appendChild(loginBtn);
    headerBtns.appendChild(registerBtn);

    header.appendChild(logo);
    header.appendChild(headerBtns);

    // Conteúdo central
    const main = document.createElement('main');
    main.className = 'flex flex-1 flex-col items-center justify-center w-full px-4';

    // Card central
    const card = document.createElement('div');
    card.className = 'bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-8 py-10 mb-8 max-w-lg w-full flex flex-col items-center';
    const cardTitle = document.createElement('h1');
    cardTitle.className = 'text-4xl md:text-5xl font-extrabold mb-4 neon-glow-green tracking-tight';
    cardTitle.textContent = '42 pong';
    card.appendChild(cardTitle);
    main.appendChild(card);

    // Descrição
    const desc = document.createElement('p');
    desc.className = 'text-base md:text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto text-center';
    desc.textContent = 'The classic Pong, reimagined for the 21st century. Play with friends, join tournaments, and climb the leaderboards. Simple to start, hard to master.';
    main.appendChild(desc);

    // Botão PLAY NOW
    const playNowBtn = PongButton({
      text: 'PLAY NOW',
      variant: 'primary',
      onClick: () => navigateTo('/login'),
      extraClass: 'text-lg md:text-xl font-bold py-4 px-12 w-full max-w-xs shadow-lg mt-2'
    });
    main.appendChild(playNowBtn);

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'w-full max-w-5xl mx-auto text-center text-gray-500 py-6 px-4';
    footer.innerHTML = '&copy; 2025 ft_transcendence. Built with <span style="color:#e25555">&lt;3</span> at 42 School.';

    // Montar página
    bg.appendChild(header);
    bg.appendChild(main);
    bg.appendChild(footer);
    parent.appendChild(bg);
    this.elements.push(bg);
  }

  public dispose(): void {
    Array.from(document.body.children).forEach(child => {
        document.body.removeChild(child);
    });
  }
} 