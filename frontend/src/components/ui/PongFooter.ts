export function PongFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'w-full max-w-5xl mx-auto text-center text-white py-6 px-4';
  footer.innerHTML = '&copy; 2025 ft_transcendence. Built with <span style="color:#e25555">&lt;3</span> at 42 School.';
  return footer;
} 