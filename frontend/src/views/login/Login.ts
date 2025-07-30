import { AView } from "../AView";
import { PongHeaderPublic } from "../../components/ui/PongHeaderPublic";
import { PongInput } from "../../components/ui";
import { t } from "../../utils/LanguageContext";
import { navigateTo } from "../../router/Router";
import { login } from "../../utils/auth";

export class Login extends AView {
    
    private elements: HTMLElement[] = [];
    private languageListener?: () => void;

    public render(parent: HTMLElement = document.body): void {
        if (this.languageListener) {
            window.removeEventListener('language-changed', this.languageListener);
        }
        this.languageListener = () => this.render(parent);
        window.addEventListener('language-changed', this.languageListener);
        parent.innerHTML = '';
        parent.className = '';

        // Fundo com gradiente igual ao lobby
        const bg = document.createElement('div');
        bg.className = 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans';

        // Header com botão Voltar (no language selector)
        const header = PongHeaderPublic();
        bg.appendChild(header);

        // Conteúdo central
        const main = document.createElement('main');
        main.className = 'flex flex-1 flex-col items-center justify-start pt-16 w-full px-4';

        // Formulário centralizado com estilo glassmorphism
        const formContainer = document.createElement('div');
        formContainer.className = 'bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20';

        const form = document.createElement('form');
        form.id = 'login-form';
        form.className = 'w-full';

        // Alias
        const aliasDiv = document.createElement('div');
        aliasDiv.className = 'mb-4';
        const aliasLabel = document.createElement('label');
        aliasLabel.htmlFor = 'username';
        aliasLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        aliasLabel.textContent = t('username');
        aliasDiv.appendChild(aliasLabel);
        
        const aliasInput = PongInput({ id: 'username', name: 'alias', type: 'text', required: true });
        aliasInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        aliasDiv.appendChild(aliasInput);
        form.appendChild(aliasDiv);

        // Password
        const passDiv = document.createElement('div');
        passDiv.className = 'mb-4';
        const passLabel = document.createElement('label');
        passLabel.htmlFor = 'password';
        passLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        passLabel.textContent = t('password');
        passDiv.appendChild(passLabel);
        
        const passInput = PongInput({ id: 'password', name: 'password', type: 'password', required: true });
        passInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        passDiv.appendChild(passInput);
        form.appendChild(passDiv);

        // Submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25';
        submitBtn.textContent = t('loginButton');
        form.appendChild(submitBtn);

        // Forgot password link
        const forgotPasswordDiv = document.createElement('div');
        forgotPasswordDiv.className = 'mt-4 mb-6 text-center';
        const forgotPasswordLink = document.createElement('a');
        forgotPasswordLink.href = '#';
        forgotPasswordLink.className = 'text-sm text-white/60 hover:text-white/80 cursor-pointer transition-colors duration-200';
        forgotPasswordLink.textContent = t('forgotPassword');
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // You may want to navigate to your forgot password route here
        });
        forgotPasswordDiv.appendChild(forgotPasswordLink);
        form.appendChild(forgotPasswordDiv);

        // Separator
        const separatorDiv = document.createElement('div');
        separatorDiv.className = 'flex items-center my-6';
        const line1 = document.createElement('div');
        line1.className = 'flex-1 border-t border-white/20';
        const orText = document.createElement('span');
        orText.className = 'px-4 text-sm text-white/60';
        orText.textContent = t('or');
        const line2 = document.createElement('div');
        line2.className = 'flex-1 border-t border-white/20';
        separatorDiv.appendChild(line1);
        separatorDiv.appendChild(orText);
        separatorDiv.appendChild(line2);
        form.appendChild(separatorDiv);

        // Google login button
        const googleBtn = document.createElement('button');
        googleBtn.type = 'button';
        googleBtn.className = 'w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white py-4 px-6 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg flex items-center justify-center gap-3';
        googleBtn.onclick = () => {
            // You may want to handle Google login here
        };
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
            <span>${t('googleLogin')}</span>
        `;
        form.appendChild(googleBtn);

        // Register box
        const registerBox = document.createElement('div');
        registerBox.className = 'mt-12 flex flex-col items-center';
        const registerText = document.createElement('span');
        registerText.className = 'text-sm text-white/80 mb-3';
        registerText.textContent = t('noAccount');
        const registerBtn = document.createElement('button');
        registerBtn.type = 'button';
        registerBtn.className = 'bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-2 text-base font-semibold rounded-lg transition-all duration-200 hover:-translate-y-1';
        registerBtn.textContent = t('registerButton');
        registerBtn.onclick = () => {
            navigateTo("/register");
        };
        registerBox.appendChild(registerText);
        registerBox.appendChild(registerBtn);
        form.appendChild(registerBox);

        formContainer.appendChild(form);
        main.appendChild(formContainer);
        bg.appendChild(main);

        // Footer (if needed)
        // const footer = PongFooter();
        // bg.appendChild(footer);

        parent.appendChild(bg);
        this.elements.push(bg);

        // Error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'text-red-400 text-center mt-4 mb-2 font-semibold hidden';
        form.appendChild(errorMsg);

        // Submit handler
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const alias = (aliasInput as HTMLInputElement).value;
            const password = (passInput as HTMLInputElement).value;
            errorMsg.classList.add('hidden');
            const ok = await login(alias, password);
            if (ok) {
                navigateTo('/dashboard');
            } else {
                errorMsg.textContent = t('loginError');
                errorMsg.classList.remove('hidden');
            }
        });
    }

    public dispose(): void {
        if (this.languageListener) {
            window.removeEventListener('language-changed', this.languageListener);
            this.languageListener = undefined;
        }
        Array.from(document.body.children).forEach(child => {
            document.body.removeChild(child);
        });
    }
}