/**
 * PongButton Component
 * Base button styling with Pong theme variants
 */
export type PongButtonVariant = 'primary' | 'secondary' | 'danger';

export interface PongButtonOptions {
  text: string;
  variant?: PongButtonVariant;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  additionalClasses?: string;
  onClick?: (event: MouseEvent) => void;
}

export function createPongButton(options: PongButtonOptions): HTMLButtonElement {
  const button = document.createElement('button');
  
  // Base classes
  let classes = 'pong-btn';
  
  // Add variant class
  switch (options.variant || 'primary') {
    case 'primary':
      classes += ' pong-btn-primary';
      break;
    case 'secondary':
      classes += ' pong-btn-secondary';
      break;
    case 'danger':
      classes += ' pong-btn-danger';
      break;
  }
  
  // Add additional classes
  if (options.additionalClasses) {
    classes += ` ${options.additionalClasses}`;
  }
  
  button.className = classes;
  button.textContent = options.text;
  button.type = options.type || 'button';
  
  if (options.disabled) {
    button.disabled = true;
    button.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }
  
  return button;
} 