export function PongCard(children: HTMLElement[] | HTMLElement | string, extraClass = ""): HTMLDivElement {
  const card = document.createElement("div");
  card.className = `bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 p-6 ${extraClass}`;

  if (typeof children === "string") {
    card.innerHTML = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => card.appendChild(child));
  } else if (children instanceof HTMLElement) {
    card.appendChild(children);
  }

  return card;
} 