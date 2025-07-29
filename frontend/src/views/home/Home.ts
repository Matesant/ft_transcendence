import { AView } from "../AView";
import { PongButton } from "../../components/ui";
import { navigateTo } from "../../router/Router";
import { PongFooter } from "../../components/ui/PongFooter";

export class Home extends AView {
  private elements: HTMLElement[] = [];

  public render(parent: HTMLElement = document.body): void {
    parent.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans';

    const header = document.createElement('header');
    header.className = 'w-full flex justify-between items-center px-8 py-6';

    const logo = document.createElement('div');
    logo.className = 'flex items-center cursor-pointer transition-all duration-300 hover:scale-105';
    logo.innerHTML = `
      <img src="/images/transcendence-logo.svg" alt="Transcendence Logo" class="max-h-36 w-auto drop-shadow-lg">
    `;

    header.appendChild(logo);

    const main = document.createElement('main');
    main.className = 'flex flex-1 flex-col items-center justify-center w-full px-4 max-w-6xl mx-auto';

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8 w-full';

    const leftCard = document.createElement('div');
    leftCard.className = 'bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20 shadow-2xl';
    
    const cardTitle = document.createElement('h1');
    cardTitle.className = 'text-5xl font-bold mb-6 text-white drop-shadow-lg';
    cardTitle.textContent = '🏓 ft_transcendence';
    
    const desc = document.createElement('p');
    desc.className = 'text-lg text-white/80 mb-8 leading-relaxed';
    desc.textContent = 'The classic Pong, reimagined for the 21st century.';
    
    const playNowBtn = PongButton({
      text: '🚀 PLAY NOW',
      variant: 'primary',
      onClick: () => navigateTo('/login')
    });
    playNowBtn.className = 'w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white py-6 px-12 text-2xl rounded-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-3 shadow-2xl hover:shadow-green-500/50 max-w-sm mx-auto animate-pulse hover:animate-none border-2 border-green-300/50 hover:border-green-200 relative overflow-hidden';
    
    playNowBtn.style.cssText += `
      box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 
                  0 0 60px rgba(34, 197, 94, 0.4), 
                  inset 0 0 20px rgba(255, 255, 255, 0.1);
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      animation: glow 3s ease-in-out infinite;
    `;
    
    leftCard.appendChild(cardTitle);
    leftCard.appendChild(desc);
    leftCard.appendChild(playNowBtn);
    
    const rightCard = document.createElement('div');
    rightCard.className = 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl';
    
    const howToPlayTitle = document.createElement('h2');
    howToPlayTitle.className = 'text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3';
    howToPlayTitle.innerHTML = '🎮 Como Jogar';
    
    const tipsList = document.createElement('div');
    tipsList.className = 'space-y-6 text-left';
    
    const tips = [
      { icon: '⬅️➡️', text: 'Use as setas ou A/D para mover sua raquete' },
      { icon: '🎯', text: 'Rebata a bola para marcar pontos' },
      { icon: '⚡', text: 'Primeiro a 5 pontos vence a partida' },
      { icon: '🏆', text: 'Participe de torneios para ganhar ranking' },
      { icon: '👥', text: 'Convide amigos para partidas personalizadas' }
    ];
    
    tips.forEach(tip => {
      const tipItem = document.createElement('div');
      tipItem.className = 'flex items-start gap-4 text-white/90 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200';
      tipItem.innerHTML = `
        <span class="text-xl flex-shrink-0">${tip.icon}</span>
        <span class="text-base leading-relaxed">${tip.text}</span>
      `;
      tipsList.appendChild(tipItem);
    });
    
    rightCard.appendChild(howToPlayTitle);
    rightCard.appendChild(tipsList);
    
    cardsContainer.appendChild(leftCard);
    cardsContainer.appendChild(rightCard);
    main.appendChild(cardsContainer);
    
    const featuresContainer = document.createElement('div');
    featuresContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8';
    
    const feature3D = document.createElement('div');
    feature3D.className = 'bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl';
    feature3D.innerHTML = `
      <div class="text-4xl mb-4">🎮</div>
      <h3 class="text-xl font-bold text-white mb-3">Totalmente em 3D</h3>
      <p class="text-white/80 text-sm leading-relaxed">Gráficos modernos com efeitos visuais impressionantes e física realista</p>
    `;
    
    const featureTournaments = document.createElement('div');
    featureTournaments.className = 'bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl';
    featureTournaments.innerHTML = `
      <div class="text-4xl mb-4">🏆</div>
      <h3 class="text-xl font-bold text-white mb-3">Torneios Locais e Partidas Online!</h3>
      <p class="text-white/80 text-sm leading-relaxed">Compete em torneios épicos ou desafie jogadores do mundo todo</p>
    `;
    
    const featureProfile = document.createElement('div');
    featureProfile.className = 'bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl';
    featureProfile.innerHTML = `
      <div class="text-4xl mb-4">👤</div>
      <h3 class="text-xl font-bold text-white mb-3">Perfil Personalizado!</h3>
      <p class="text-white/80 text-sm leading-relaxed">Customize seu avatar, acompanhe estatísticas e mostre suas conquistas</p>
    `;
    
    featuresContainer.appendChild(feature3D);
    featuresContainer.appendChild(featureTournaments);
    featuresContainer.appendChild(featureProfile);
    main.appendChild(featuresContainer);
    
    const creatorsSection = document.createElement('div');
    creatorsSection.className = 'w-full mt-16 mb-8';
    
    const creatorsTitle = document.createElement('h2');
    creatorsTitle.className = 'text-4xl font-bold text-white mb-12 text-center';
    creatorsTitle.innerHTML = '👨‍💻 Criadores do Projeto';
    
    const creatorsContainer = document.createElement('div');
    creatorsContainer.className = 'flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto';
    
    const creators = [
      { 
        name: 'Alissao', 
        image: '/images/alissao.svg',
        github: 'https://github.com/alissonmarcs',
        linkedin: 'https://www.linkedin.com/in/alissonmarcs/'
      },
      { 
        name: 'Cesar', 
        image: '/images/cesar.svg',
        github: 'https://github.com/cauemendess',
        linkedin: 'https://www.linkedin.com/in/caue-silva-12880b272/'
      },
      { 
        name: 'Dani', 
        image: '/images/dani.svg',
        github: 'https://github.com/daniele-frade',
        linkedin: 'https://www.linkedin.com/in/daniele-frade/'
      },
      { 
        name: 'Mateus', 
        image: '/images/mateus.svg',
        github: 'https://github.com/Matesant',
        linkedin: 'https://www.linkedin.com/in/matesant/'
      },
      { 
        name: 'Vini', 
        image: '/images/vini.svg',
        github: 'https://github.com/Vinni-Cedraz',
        linkedin: 'https://www.linkedin.com/in/vinn%C3%ADcius-ribeiro/'
      }
    ];
    
    creators.forEach(creator => {
      const creatorCard = document.createElement('div');
      creatorCard.className = 'bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 text-center border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl group w-32 sm:w-36 md:w-40 flex-shrink-0';
      
      creatorCard.innerHTML = `
        <div class="relative mb-4">
          <img src="${creator.image}" alt="${creator.name}" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto rounded-full border-4 border-white/30 shadow-lg group-hover:border-white/50 transition-all duration-300 group-hover:scale-110 bg-white">
          <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-400/20 to-blue-400/20 group-hover:from-purple-400/40 group-hover:to-blue-400/40 transition-all duration-300"></div>
        </div>
        <h3 class="text-sm sm:text-base md:text-lg font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">${creator.name}</h3>
        <div class="flex justify-center gap-2 sm:gap-3">
          <a href="${creator.github}" target="_blank" rel="noopener noreferrer" 
             class="p-1.5 sm:p-2 bg-gray-800/50 hover:bg-gray-700/70 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white hover:text-purple-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="${creator.linkedin}" target="_blank" rel="noopener noreferrer"
             class="p-1.5 sm:p-2 bg-blue-600/50 hover:bg-blue-500/70 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 text-white hover:text-blue-200 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      `;
      
      creatorsContainer.appendChild(creatorCard);
    });
    
    creatorsSection.appendChild(creatorsTitle);
    creatorsSection.appendChild(creatorsContainer);
    main.appendChild(creatorsSection);
    
    const style = document.createElement('style');
    style.textContent = `
      /* Scroll invisível para toda a página */
      html, body {
        overflow-x: hidden;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* Internet Explorer 10+ */
      }
      
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none; /* Safari and Chrome */
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 
                      0 0 60px rgba(34, 197, 94, 0.4), 
                      inset 0 0 20px rgba(255, 255, 255, 0.1);
        }
        50% {
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.8), 
                      0 0 80px rgba(34, 197, 94, 0.6), 
                      inset 0 0 30px rgba(255, 255, 255, 0.2);
        }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
    `;
    document.head.appendChild(style);
    
    playNowBtn.addEventListener('mouseenter', () => {
      playNowBtn.style.backgroundImage = 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%), linear-gradient(to right, #22c55e, #16a34a, #15803d)';
      playNowBtn.style.backgroundSize = '1000px 100%, 100% 100%';
      playNowBtn.style.animation = 'glow 3s ease-in-out infinite';
    });
    
    playNowBtn.addEventListener('mouseleave', () => {
      playNowBtn.style.backgroundImage = '';
      playNowBtn.style.animation = 'glow 3s ease-in-out infinite';
    });

    const footer = PongFooter();

    container.appendChild(header);
    container.appendChild(main);
    container.appendChild(footer);
    parent.appendChild(container);
    this.elements.push(container);
  }

  public dispose(): void {
    this.elements.forEach((el) => el.parentNode?.removeChild(el));
    this.elements = [];
  }
} 