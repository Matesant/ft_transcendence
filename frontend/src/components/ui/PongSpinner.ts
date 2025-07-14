/**
 * PongSpinner Component
 * A custom loading spinner
 */
export interface PongSpinnerOptions {
  size?: 'sm' | 'md' | 'lg';
  additionalClasses?: string;
  id?: string;
}

export function createPongSpinner(options: PongSpinnerOptions = {}): HTMLDivElement {
  const spinner = document.createElement('div');
  
  // Base classes
  let classes = 'pong-spinner';
  
  // Add size classes
  switch (options.size) {
    case 'sm':
      classes += ' w-6 h-6 border-2';
      break;
    case 'lg':
      classes += ' w-16 h-16 border-6';
      break;
    default: // md
      classes += ' w-10 h-10 border-4';
      break;
  }
  
  // Add additional classes
  if (options.additionalClasses) {
    classes += ` ${options.additionalClasses}`;
  }
  
  spinner.className = classes;
  
  if (options.id) {
    spinner.id = options.id;
  }
  
  return spinner;
}

/**
 * Show spinner in container
 */
export function showSpinner(container: HTMLElement, options: PongSpinnerOptions = {}): HTMLDivElement {
  const spinner = createPongSpinner(options);
  container.appendChild(spinner);
  return spinner;
}

/**
 * Hide spinner by element or ID
 */
export function hideSpinner(container: HTMLElement, spinnerOrId?: HTMLDivElement | string): void {
  if (spinnerOrId) {
    if (typeof spinnerOrId === 'string') {
      const spinner = container.querySelector(`#${spinnerOrId}`);
      if (spinner) {
        spinner.remove();
      }
    } else {
      spinnerOrId.remove();
    }
  } else {
    // Remove all spinners in container
    const spinners = container.querySelectorAll('.pong-spinner');
    spinners.forEach(spinner => spinner.remove());
  }
} 