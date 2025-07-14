/**
 * PongCard Component
 * A container for content sections with consistent Pong styling
 */
export function createPongCard(content?: string | HTMLElement, additionalClasses?: string): HTMLDivElement {
  const card = document.createElement('div');
  card.className = `pong-card ${additionalClasses || ''}`.trim();
  
  if (content) {
    if (typeof content === 'string') {
      card.innerHTML = content;
    } else {
      card.appendChild(content);
    }
  }
  
  return card;
} 