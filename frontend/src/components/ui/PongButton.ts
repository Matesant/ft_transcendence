export type PongButtonVariant = 'primary' | 'secondary' | 'danger';

export interface PongButtonProps {
  text: string;
  variant?: PongButtonVariant;
  onClick?: (e: MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  extraClass?: string;
}

export function PongButton({ text, variant = 'primary', onClick, type = 'submit', disabled = false, extraClass = '' }: PongButtonProps): HTMLButtonElement {
  const button = document.createElement('button');
  let base = 'px-4 py-2 rounded font-semibold transition w-full ';
  let variantClass = '';
  switch (variant) {
    case 'primary':
      variantClass = 'bg-blue-600 text-white hover:bg-blue-700';
      break;
    case 'secondary':
      variantClass = 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600';
      break;
    case 'danger':
      variantClass = 'bg-red-600 text-white hover:bg-red-700';
      break;
  }
  button.className = `${base} ${variantClass} ${extraClass}`;
  button.type = type;
  button.textContent = text;
  button.disabled = disabled;
  if (onClick) button.addEventListener('click', onClick);
  return button;
} 