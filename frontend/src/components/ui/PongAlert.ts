/**
 * PongAlert Component
 * For displaying feedback messages (success, error, info)
 */
export type PongAlertVariant = 'success' | 'error' | 'info';

export interface PongAlertOptions {
  message: string;
  variant?: PongAlertVariant;
  additionalClasses?: string;
  id?: string;
}

export function createPongAlert(options: PongAlertOptions): HTMLDivElement {
  const alert = document.createElement('div');
  
  // Base classes
  let classes = 'pong-alert';
  
  // Add variant class
  switch (options.variant || 'info') {
    case 'success':
      classes += ' pong-alert-success';
      break;
    case 'error':
      classes += ' pong-alert-error';
      break;
    case 'info':
      classes += ' pong-alert-info';
      break;
  }
  
  // Add additional classes
  if (options.additionalClasses) {
    classes += ` ${options.additionalClasses}`;
  }
  
  alert.className = classes;
  alert.textContent = options.message;
  
  if (options.id) {
    alert.id = options.id;
  }
  
  return alert;
}

/**
 * Show alert message
 */
export function showAlert(
  container: HTMLElement,
  message: string,
  variant: PongAlertVariant = 'info',
  duration: number = 5000
): void {
  const alert = createPongAlert({ message, variant });
  container.appendChild(alert);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, duration);
  }
}

/**
 * Hide alert by ID
 */
export function hideAlert(container: HTMLElement, alertId: string): void {
  const alert = container.querySelector(`#${alertId}`);
  if (alert) {
    alert.remove();
  }
} 