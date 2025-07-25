import { PongButton } from './PongButton';
import { navigateTo } from '../../router/Router';

export interface PongHeaderProps {
  rightContent?: HTMLElement | null;
  homeOnly?: boolean;
}

export function PongHeaderPublic({ rightContent = null, homeOnly = false }: PongHeaderProps = {}): HTMLElement {
  const header = document.createElement('header');
  header.className = 'w-full flex justify-between items-center px-4 md:px-8 py-4';

  const logo = document.createElement('div');
  logo.className = 'cursor-pointer transition-all duration-300 hover:scale-105';
  logo.addEventListener('click', () => navigateTo('/'));
  
  const logoImg = document.createElement('img');
  logoImg.src = '/images/transcendence-logo.svg';
  logoImg.alt = 'Transcendence Logo';
  logoImg.className = 'max-h-36 w-auto drop-shadow-lg';
  
  logo.appendChild(logoImg);

  header.appendChild(logo);

  if (homeOnly) {
    const leftBox = document.createElement('div');
    leftBox.className = 'flex items-center justify-start';
    const backBtn = PongButton({
      text: 'Voltar',
      variant: 'primary',
      onClick: () => history.back(),
      extraClass: 'w-auto px-4 py-2 text-base font-semibold rounded ml-4'
    });
    leftBox.appendChild(backBtn);
    header.appendChild(leftBox);
  } else if (rightContent) {
    header.appendChild(rightContent);
  }

  return header;
} 