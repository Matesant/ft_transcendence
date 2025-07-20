import { AView } from "../AView";
import { PongHeader, PongFooter, PongInput, PongButton } from "../../components/ui";
import { apiUrl } from "../../utils/api";
import { navigateTo } from "../../router/Router";

export class Login extends AView {
    
    private elements: HTMLElement[] = [];

    public render(parent: HTMLElement = document.body): void {
        parent.innerHTML = '';

        // Fundo branco simples
        const bg = document.createElement('div');
        bg.className = 'min-h-screen flex flex-col bg-white';
        bg.style.minHeight = '100vh';

        // Header com botão Voltar
        const header = PongHeader({ homeOnly: true });
        bg.appendChild(header);

        // Conteúdo central
        const main = document.createElement('main');
        main.className = 'flex flex-1 flex-col items-center justify-center w-full px-4';

        // Formulário centralizado
        const formContainer = document.createElement('div');
        formContainer.className = 'bg-white rounded-lg shadow-md w-full max-w-md p-8';

        const cardTitle = document.createElement('h2');
        cardTitle.className = 'text-2xl font-bold mb-6 text-center';
        cardTitle.textContent = 'Login';
        formContainer.appendChild(cardTitle);

        const form = document.createElement('form');
        form.id = 'login-form';
        form.className = 'w-full';

        // Alias
        const aliasDiv = document.createElement('div');
        aliasDiv.className = 'mb-4';
        const aliasLabel = document.createElement('label');
        aliasLabel.htmlFor = 'username';
        aliasLabel.className = 'block text-sm font-medium text-gray-700';
        aliasLabel.textContent = 'Alias';
        aliasDiv.appendChild(aliasLabel);
        aliasDiv.appendChild(PongInput({ id: 'username', name: 'alias', type: 'text', required: true }));
        form.appendChild(aliasDiv);

        // Password
        const passDiv = document.createElement('div');
        passDiv.className = 'mb-4';
        const passLabel = document.createElement('label');
        passLabel.htmlFor = 'password';
        passLabel.className = 'block text-sm font-medium text-gray-700';
        passLabel.textContent = 'Password';
        passDiv.appendChild(passLabel);
        passDiv.appendChild(PongInput({ id: 'password', name: 'password', type: 'password', required: true }));
        form.appendChild(passDiv);

        // Botão submit
        const submitBtn = PongButton({
            text: 'Login',
            variant: 'primary',
            extraClass: 'w-full font-semibold py-2 px-4 rounded-md text-lg',
        });
        form.appendChild(submitBtn);

        // Texto e botão de registro
        const registerBox = document.createElement('div');
        registerBox.className = 'mt-6 flex flex-col items-center';
        const registerText = document.createElement('span');
        registerText.className = 'text-sm text-gray-700 mb-2';
        registerText.textContent = 'Não tem uma conta?';
        const registerBtn = PongButton({
            text: 'Registrar',
            variant: 'secondary',
            onClick: () => navigateTo('/register'),
            extraClass: 'w-auto px-4 py-2 text-base font-semibold rounded'
        });
        registerBox.appendChild(registerText);
        registerBox.appendChild(registerBtn);
        form.appendChild(registerBox);

        formContainer.appendChild(form);
        main.appendChild(formContainer);
        bg.appendChild(main);

        // Footer
        const footer = PongFooter();
        bg.appendChild(footer);

        parent.appendChild(bg);
        this.elements.push(bg);

        // Handler de submit
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form as HTMLFormElement);
            const data = {
                alias: String(formData.get('alias')),
                password: String(formData.get('password'))
            };
            try {
                const response = await fetch(apiUrl(3001, '/auth/login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    const result = await response.json();
                    navigateTo('/dashboard');
                } else {
                    const errorResponse = await response.json();
                    main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Login Failed: ${errorResponse.error}</h1>`;
                }
            } catch (error) {
                main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Login Failed: ${error}</h1>`;
            }
        });
    }

    public dispose(): void {
        Array.from(document.body.children).forEach(child => {
              document.body.removeChild(child);
          });
    }
}