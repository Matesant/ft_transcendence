/**
 * PongInput Component
 * Styled input field for forms
 */
export interface PongInputOptions {
  type?: string;
  placeholder?: string;
  value?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  additionalClasses?: string;
  onChange?: (event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

export function createPongInput(options: PongInputOptions): HTMLInputElement {
  const input = document.createElement('input');
  
  // Base classes
  let classes = 'pong-input';
  
  // Add additional classes
  if (options.additionalClasses) {
    classes += ` ${options.additionalClasses}`;
  }
  
  input.className = classes;
  input.type = options.type || 'text';
  
  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }
  
  if (options.value) {
    input.value = options.value;
  }
  
  if (options.id) {
    input.id = options.id;
  }
  
  if (options.name) {
    input.name = options.name;
  }
  
  if (options.required) {
    input.required = true;
  }
  
  if (options.disabled) {
    input.disabled = true;
    input.classList.add('opacity-50', 'cursor-not-allowed');
  }
  
  // Event listeners
  if (options.onChange) {
    input.addEventListener('input', options.onChange);
  }
  
  if (options.onFocus) {
    input.addEventListener('focus', options.onFocus);
  }
  
  if (options.onBlur) {
    input.addEventListener('blur', options.onBlur);
  }
  
  return input;
} 