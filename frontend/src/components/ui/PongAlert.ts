export type PongAlertVariant = 'success' | 'error' | 'info';

export interface PongAlertProps {
  message: string;
  variant?: PongAlertVariant;
  extraClass?: string;
}

export function PongAlert({ message, variant = 'info', extraClass = '' }: PongAlertProps): HTMLDivElement {
  const alert = document.createElement('div');
  let base = 'p-4 border font-bold text-center rounded-md ';
  let variantClass = '';
  switch (variant) {
    case 'success':
      variantClass = 'bg-green-100 border-green-400 text-green-800';
      break;
    case 'error':
      variantClass = 'bg-red-100 border-red-400 text-red-600';
      break;
    case 'info':
    default:
      variantClass = 'bg-blue-100 border-blue-400 text-blue-800';
      break;
  }
  alert.className = `${base} ${variantClass} ${extraClass}`;
  alert.textContent = message;
  return alert;
} 