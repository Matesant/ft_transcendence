export interface PongInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  onInput?: (e: Event) => void;
  extraClass?: string;
}

export function PongInput({ type = 'text', placeholder = '', value = '', id, name, required = false, disabled = false, onInput, extraClass = '' }: PongInputProps): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  if (id) input.id = id;
  if (name) input.name = name;
  input.required = required;
  input.disabled = disabled;
  input.className = `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${extraClass}`;
  if (onInput) input.addEventListener('input', onInput);
  return input;
} 