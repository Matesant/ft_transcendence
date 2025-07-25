import { AView } from "../AView";
import { PongHeaderPublic }  from "../../components/ui/PongHeaderPublic";
import { PongHeader, PongFooter, PongInput, PongButton } from "../../components/ui";
import { navigateTo } from "../../router/Router";
import { apiUrl } from "../../utils/api";

export class Register extends AView {

    private elements: HTMLElement[] = [];

    public render(parent: HTMLElement = document.body): void {
        parent.innerHTML = '';

        // Fundo branco simples
        const bg = document.createElement('div');
        bg.className = 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans';

        // Header com botão Voltar
        const header = PongHeaderPublic({ homeOnly: true });
        bg.appendChild(header);

        // Conteúdo central
        const main = document.createElement('main');
        main.className = 'flex flex-1 flex-col items-center justify-center w-full px-4';

        // Formulário centralizado
        const formContainer = document.createElement('div');
        formContainer.className = 'bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20';

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
        aliasLabel.className = 'block text-sm font-medium text-white-700';
        aliasLabel.textContent = 'Alias';
        aliasDiv.appendChild(aliasLabel);
        aliasDiv.appendChild(PongInput({ id: 'username', name: 'alias', type: 'text', required: true , extraClass: 'border-none rounded-lg bg-black/20 text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 p-2 rounded w-full'}));
        form.appendChild(aliasDiv);

        // Email
        const emailDiv = document.createElement('div');
        emailDiv.className = 'mb-4';
        const emailLabel = document.createElement('label');
        emailLabel.htmlFor = 'email';
        emailLabel.className = 'block text-sm font-medium text-white-700';
        emailLabel.textContent = 'Email';
        emailDiv.appendChild(emailLabel);
        emailDiv.appendChild(PongInput({ id: 'email', name: 'email', type: 'email', required: true , extraClass: 'border-none rounded-lg bg-black/20 text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 p-2 rounded w-full'}));
        form.appendChild(emailDiv);

        // Password
        const passDiv = document.createElement('div');
        passDiv.className = 'mb-4';
        const passLabel = document.createElement('label');
        passLabel.htmlFor = 'password';
        passLabel.className = 'block text-sm font-medium text-white-700';
        passLabel.textContent = 'Password';
        passDiv.appendChild(passLabel);
        passDiv.appendChild(PongInput({ id: 'password', name: 'password', type: 'password', required: true, extraClass: 'border-none rounded-lg bg-black/20 text-white text-base focus:outline-none focus:ring-2 focus:ring-white/30 p-2 rounded w-full'}));
        form.appendChild(passDiv);

        // Div para mensagem de erro de senha
        const passwordErrorDiv = document.createElement('div');
        passwordErrorDiv.id = 'password-error';
        passwordErrorDiv.className = 'text-white text-center font-bold text-sm mb-2 min-h-[20px]';
        form.appendChild(passwordErrorDiv);

        // Botão submit
        const submitBtn = PongButton({
            text: 'Register',
            variant: 'primary',
            extraClass: 'w-full font-semibold py-2 px-4 rounded-md text-lg',
        });
        form.appendChild(submitBtn);



        const divider = document.createElement('div');
        divider.className = 'flex items-center my-4';
        divider.innerHTML = `
            <div class="flex-1 border-t border-white/20"></div>
            <span class="mx-2 text-sm text-white/60 font-semibold">ou</span>
            <div class="flex-1 border-t border-white/20"></div>
        `;
        form.appendChild(divider);



        const googleBtn = PongButton({
            text: '',
            variant: 'secondary',
            extraClass: 'w-full font-semibold py-2 px-4 rounded-md text-lg mt-4 flex items-center justify-center gap-2',
            onClick: () => {
                window.location.href = apiUrl(3001, '/auth/google');
            }
        });

        googleBtn.innerHTML = `
            <svg class="w-6 h-6 mr-2" viewBox="0 0 48 48">
                <g>
                    <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.45 2.36 30.62 0 24 0 14.82 0 6.71 5.13 2.69 12.56l7.99 6.21C12.16 13.18 17.62 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.44c-.54 2.91-2.19 5.38-4.67 7.04l7.19 5.6C43.94 37.13 46.1 31.34 46.1 24.5z"/>
                    <path fill="#FBBC05" d="M10.68 28.77c-1.13-3.37-1.13-7.17 0-10.54l-7.99-6.21C.86 16.13 0 20.01 0 24c0 3.99.86 7.87 2.69 11.54l7.99-6.21z"/>
                    <path fill="#EA4335" d="M24 48c6.62 0 12.45-2.18 16.64-5.94l-7.19-5.6c-2.01 1.35-4.59 2.14-7.45 2.14-6.38 0-11.84-3.68-14.32-8.77l-7.99 6.21C6.71 42.87 14.82 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                </g>
            </svg>
            <span>Continuar com o Google</span>
        `;

        form.appendChild(googleBtn);

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

            // Validação de senha forte (6-12 caracteres, maiúscula, minúscula, número, especial)
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,12}$/;
            passwordErrorDiv.textContent = '';
            if (!strongPasswordRegex.test(String(data.password))) {
                passwordErrorDiv.textContent = 'A senha deve ter entre 6 e 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.';
                return;
            }
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