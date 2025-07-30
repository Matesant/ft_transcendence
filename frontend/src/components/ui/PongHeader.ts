import { PongButton } from './PongButton';
import { navigateTo } from '../../router/Router';
import './LanguageSelector';

export interface PongHeaderProps {
  rightContent?: HTMLElement | null;
  homeOnly?: boolean;
}

export function PongHeader({ rightContent = null, homeOnly = false }: PongHeaderProps = {}): HTMLElement {
  const header = document.createElement('header');
  header.className = 'w-full flex justify-between items-center px-4 md:px-8 py-4';

  const logo = document.createElement('div');
  logo.className = 'cursor-pointer transition-all duration-300 hover:scale-105';
  logo.addEventListener('click', () => navigateTo('/dashboard'));
  
  const logoImg = document.createElement('img');
  logoImg.src = '/images/transcendence-logo.svg';
  logoImg.alt = 'Transcendence Logo';
  logoImg.className = 'max-h-36 w-auto drop-shadow-lg';
  
  logo.appendChild(logoImg);

  header.appendChild(logo);


  // Always show language selector on the right
  const rightBox = document.createElement('div');
  rightBox.className = 'flex items-center gap-4';
  if (homeOnly) {
    const backBtn = PongButton({
      text: 'Voltar',
      variant: 'primary',
      onClick: () => navigateTo('/'),
      extraClass: 'w-auto px-4 py-2 text-base font-semibold rounded ml-4'
    });
    rightBox.appendChild(backBtn);
  }
  if (rightContent) {
    rightBox.appendChild(rightContent);
  }
  const langSelector = document.createElement('language-selector');
  rightBox.appendChild(langSelector);
  header.appendChild(rightBox);

  return header;
} 