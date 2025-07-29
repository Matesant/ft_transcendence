export interface PongSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  extraClass?: string;
}

export function PongSpinner({ size = 'md', extraClass = '' }: PongSpinnerProps = {}): HTMLDivElement {
  const spinner = document.createElement('div');
  let sizeClass = '';
  switch (size) {
    case 'sm':
      sizeClass = 'w-5 h-5 border-2';
      break;
    case 'lg':
      sizeClass = 'w-12 h-12 border-4';
      break;
    case 'md':
    default:
      sizeClass = 'w-8 h-8 border-4';
      break;
  }
  spinner.className = `border-gray-300 border-t-blue-600 border-solid rounded-full animate-spin ${sizeClass} ${extraClass}`;
  return spinner;
} 