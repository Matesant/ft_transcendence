import { AView } from "../AView";
import { PongHeader, PongFooter, PongInput, PongButton } from "../../components/ui";
import { navigateTo } from "../../router/Router";
import { apiUrl } from "../../utils/api";

export class Register extends AView {

    private elements: HTMLElement[] = [];

    public render(parent: HTMLElement = document.body): void {
        parent.innerHTML = '';

        // Fundo branco simples
        const bg = document.createElement('div');
        bg.className = 'min-h-screen flex flex-col bg-white';

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
        cardTitle.textContent = 'Register';
        formContainer.appendChild(cardTitle);

        const form = document.createElement('form');
        form.id = 'register-form';
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

        // Email
        const emailDiv = document.createElement('div');
        emailDiv.className = 'mb-4';
        const emailLabel = document.createElement('label');
        emailLabel.htmlFor = 'email';
        emailLabel.className = 'block text-sm font-medium text-gray-700';
        emailLabel.textContent = 'Email';
        emailDiv.appendChild(emailLabel);
        emailDiv.appendChild(PongInput({ id: 'email', name: 'email', type: 'email', required: true }));
        form.appendChild(emailDiv);

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
            text: 'Register',
            variant: 'primary',
            extraClass: 'w-full font-semibold py-2 px-4 rounded-md text-lg',
        });
        form.appendChild(submitBtn);

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
                alias: formData.get('alias'),
                email: formData.get('email'),
                password: formData.get('password'),
            };
            try {
                const response = await fetch(apiUrl(3001, '/auth/register'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    const result = await response.json();
                    // Login automático após registro
                    const loginData = {
                        alias: data.alias,
                        password: data.password
                    };
                    try {
                        const loginResponse = await fetch(apiUrl(3001, '/auth/login'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(loginData)
                        });
                        if (loginResponse.ok) {
                            navigateTo('/dashboard');
                        } else {
                            const loginError = await loginResponse.json();
                            main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Login Failed: ${loginError.error}</h1>`;
                        }
                    } catch (loginError) {
                        main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Login Failed: ${loginError}</h1>`;
                    }
                } else {
                    const errorResponse = await response.json();
                    main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Registration Failed: ${errorResponse.error}</h1>`;
                }
            } catch (error) {
                main.innerHTML = `<h1 class='text-center text-2xl font-bold text-red-600'>Registration Failed: ${error}</h1>`;
            }
        });
    } 

    public dispose(): void {
        Array.from(document.body.children).forEach(child => {
              document.body.removeChild(child);
          });
    }

}