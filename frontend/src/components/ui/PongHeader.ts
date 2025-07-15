import { PongButton } from './PongButton';
import { navigateTo } from '../../router/Router';

export interface PongHeaderProps {
  rightContent?: HTMLElement | null;
  homeOnly?: boolean;
}

export function PongHeader({ rightContent = null, homeOnly = false }: PongHeaderProps = {}): HTMLElement {
  const header = document.createElement('header');
  header.className = 'w-full max-w-5xl mx-auto flex justify-between items-center px-4 md:px-8 py-4';

  const logo = document.createElement('div');
  logo.className = 'text-2xl md:text-3xl font-extrabold neon-glow-green select-none tracking-wide';
  logo.textContent = 'ft_transcendence';

  header.appendChild(logo);

  if (homeOnly) {
    const leftBox = document.createElement('div');
    leftBox.className = 'flex items-center justify-start';
    const backBtn = PongButton({
      text: 'Voltar',
      variant: 'primary',
      onClick: () => navigateTo('/'),
      extraClass: 'w-auto px-4 py-2 text-base font-semibold rounded ml-4'
    });
    leftBox.appendChild(backBtn);
    header.appendChild(leftBox);
  } else if (rightContent) {
    header.appendChild(rightContent);
  }

  return header;
} 