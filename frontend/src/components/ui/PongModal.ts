// frontend/src/components/ui/PongModal.ts

export interface PongModalProps {
	message: string;
	onClose?: () => void;
	title?: string;
	type?: 'error' | 'success' | 'warning' | 'info';
}

export function PongModal({ message, onClose, title = "Error", type = 'error' }: PongModalProps): HTMLDivElement {
	const overlay = document.createElement("div");
	overlay.className = `
		fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50
		animate-in fade-in duration-200
	`;

	const modal = document.createElement("div");
	modal.className = `
		bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4
		border border-white/20 animate-in zoom-in duration-200
		flex flex-col items-center
	`;

	// Ícone baseado no tipo
	const iconMap = {
		error: '❌',
		success: '✅',
		warning: '⚠️',
		info: 'ℹ️'
	};

	const colorMap = {
		error: {
			title: 'text-red-400',
			icon: 'text-red-400',
			button: 'bg-red-500 hover:bg-red-600',
			border: 'border-red-400/30'
		},
		success: {
			title: 'text-green-400',
			icon: 'text-green-400',
			button: 'bg-green-500 hover:bg-green-600',
			border: 'border-green-400/30'
		},
		warning: {
			title: 'text-yellow-400',
			icon: 'text-yellow-400',
			button: 'bg-yellow-500 hover:bg-yellow-600',
			border: 'border-yellow-400/30'
		},
		info: {
			title: 'text-blue-400',
			icon: 'text-blue-400',
			button: 'bg-blue-500 hover:bg-blue-600',
			border: 'border-blue-400/30'
		}
	};

	const colors = colorMap[type];

	// Container do ícone
	const iconContainer = document.createElement("div");
	iconContainer.className = `text-4xl mb-4 ${colors.icon} drop-shadow-lg`;
	iconContainer.textContent = iconMap[type];

	// Título
	const titleEl = document.createElement("h2");
	titleEl.className = `text-2xl font-bold mb-4 ${colors.title} drop-shadow-lg`;
	titleEl.textContent = title;

	// Mensagem
	const msgEl = document.createElement("p");
	msgEl.className = "text-base text-white/90 mb-6 leading-relaxed text-center";
	msgEl.textContent = message;

	// Botão de fechar
	const closeBtn = document.createElement("button");
	closeBtn.className = `
		${colors.button} text-white font-bold py-3 px-8 rounded-xl
		transition-all duration-200 hover:-translate-y-1 shadow-lg
		border border-white/20 hover:shadow-xl
	`;
	closeBtn.textContent = "Fechar";
	closeBtn.onclick = () => {
		overlay.classList.add('animate-out', 'fade-out');
		modal.classList.add('animate-out', 'zoom-out');
		setTimeout(() => {
			overlay.remove();
			if (onClose) onClose();
		}, 200);
	};

	// Adicionar elementos ao modal
	modal.appendChild(iconContainer);
	modal.appendChild(titleEl);
	modal.appendChild(msgEl);
	modal.appendChild(closeBtn);
	overlay.appendChild(modal);

	// Fecha ao clicar fora do modal
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) {
			overlay.classList.add('animate-out', 'fade-out');
			modal.classList.add('animate-out', 'zoom-out');
			setTimeout(() => {
				overlay.remove();
				if (onClose) onClose();
			}, 200);
		}
	});

	// Fecha com ESC
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			overlay.classList.add('animate-out', 'fade-out');
			modal.classList.add('animate-out', 'zoom-out');
			setTimeout(() => {
				overlay.remove();
				if (onClose) onClose();
			}, 200);
		}
	});

	return overlay;
}