import { AView } from "../AView";
import { PongHeaderPublic } from "../../components/ui/PongHeaderPublic";
import { PongHeader, PongFooter, PongInput, PongButton } from "../../components/ui";
import { apiUrl } from "../../utils/api";
import { navigateTo } from "../../router/Router";
import { TwoFactorAuth } from "../../components/2fa-form";
import { PongModal } from "../../components/ui/PongModal";

export class Login extends AView {
    
    private elements: HTMLElement[] = [];

    // Helper function to map login errors to user-friendly messages
    private mapLoginError(errorMessage: string): { title: string; message: string } {
        const error = errorMessage.toLowerCase();
        
        // Credenciais inválidas (usuário não encontrado ou senha incorreta)
        if (error.includes('invalid alias or password') || error.includes('invalid credentials') || error.includes('wrong password')) {
            return {
                title: "Login Failed",
                message: "Invalid username or password. Please check your credentials and try again."
            };
        }
        
        // Campos obrigatórios não preenchidos
        if (error.includes('alias and password are required')) {
            return {
                title: "Missing Information",
                message: "Please fill in both username and password fields."
            };
        }
        
        // Usuário não encontrado (caso específico)
        if (error.includes('user not found')) {
            return {
                title: "User Not Found",
                message: "No account found with this username. Please check your username or register a new account."
            };
        }
        
        // Erros de servidor interno
        if (error.includes('internal server error') || error.includes('something went wrong')) {
            return {
                title: "Server Error",
                message: "A server error occurred. Please try again later."
            };
        }
        
        // Erros de conexão de rede
        if (error.includes('network') || error.includes('fetch') || error.includes('failed to fetch')) {
            return {
                title: "Connection Error",
                message: "Unable to connect to the server. Please check your internet connection and try again."
            };
        }
        
        // Timeouts
        if (error.includes('timeout')) {
            return {
                title: "Request Timeout",
                message: "The request took too long to complete. Please try again."
            };
        }
        
        // Erro padrão para casos não mapeados
        return {
            title: "Login Error",
            message: "An unexpected error occurred during login. Please try again."
        };
    }

    // Helper function to show error modal
    private showErrorModal(message: string, title: string = "Error"): void {
        const modal = PongModal({
            message: message,
            title: title,
            type: 'error',
            onClose: () => {
                // Optional: any cleanup when modal closes
            }
        });
        document.body.appendChild(modal);
    }

    public render(parent: HTMLElement = document.body): void {
        parent.innerHTML = '';
        parent.className = '';

        const bg = document.createElement('div');
        bg.className = 'min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans';

        const header = PongHeaderPublic({ homeOnly: true });
        bg.appendChild(header);

        const main = document.createElement('main');
        main.className = 'flex flex-1 flex-col items-center justify-start pt-16 w-full px-4';

        const formContainer = document.createElement('div');
        formContainer.className = 'bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20';

        const cardTitle = document.createElement('h2');
        cardTitle.className = 'text-2xl font-bold mb-6 text-center';
        cardTitle.textContent = 'Login';
        formContainer.appendChild(cardTitle);

        const form = document.createElement('form');
        form.id = 'login-form';
        form.className = 'w-full';

        const aliasDiv = document.createElement('div');
        aliasDiv.className = 'mb-4';
        const aliasLabel = document.createElement('label');
        aliasLabel.htmlFor = 'username';
        aliasLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        aliasLabel.textContent = 'Alias';
        aliasDiv.appendChild(aliasLabel);
        
        const aliasInput = PongInput({ id: 'username', name: 'alias', type: 'text', required: true });
        aliasInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        aliasDiv.appendChild(aliasInput);
        form.appendChild(aliasDiv);

        const passDiv = document.createElement('div');
        passDiv.className = 'mb-4';
        const passLabel = document.createElement('label');
        passLabel.htmlFor = 'password';
        passLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        passLabel.textContent = 'Password';
        passDiv.appendChild(passLabel);
        
        const passInput = PongInput({ id: 'password', name: 'password', type: 'password', required: true });
        passInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        passDiv.appendChild(passInput);
        form.appendChild(passDiv);

        const submitBtn = PongButton({
            text: 'Login',
            variant: 'primary',
            extraClass: 'w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25',
        });
        form.appendChild(submitBtn);

        const forgotPasswordDiv = document.createElement('div');
        forgotPasswordDiv.className = 'mt-4 mb-6 text-center';
        const forgotPasswordLink = document.createElement('a');
        forgotPasswordLink.href = '#';
        forgotPasswordLink.className = 'text-sm text-white/60 hover:text-white/80 cursor-pointer transition-colors duration-200';
        forgotPasswordLink.textContent = 'Esqueceu a senha?';
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/forgotPassword');
        });
        forgotPasswordDiv.appendChild(forgotPasswordLink);
        form.appendChild(forgotPasswordDiv);

        const separatorDiv = document.createElement('div');
        separatorDiv.className = 'flex items-center my-6';
        const line1 = document.createElement('div');
        line1.className = 'flex-1 border-t border-white/20';
        const orText = document.createElement('span');
        orText.className = 'px-4 text-sm text-white/60';
        orText.textContent = 'OU';
        const line2 = document.createElement('div');
        line2.className = 'flex-1 border-t border-white/20';
        separatorDiv.appendChild(line1);
        separatorDiv.appendChild(orText);
        separatorDiv.appendChild(line2);
        form.appendChild(separatorDiv);

        const googleBtn = PongButton({
            text: '',
            variant: 'secondary',
            extraClass: 'w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white py-4 px-6 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg flex items-center justify-center gap-3',
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
            <span>Entrar com Google</span>
        `;

        form.appendChild(googleBtn);

        // Texto e botão de registro
        const registerBox = document.createElement('div');
        registerBox.className = 'mt-12 flex flex-col items-center';
        const registerText = document.createElement('span');
        registerText.className = 'text-sm text-white/80 mb-3';
        registerText.textContent = 'Não tem uma conta?';
        const registerBtn = PongButton({
            text: 'Registrar',
            variant: 'secondary',
            onClick: () => navigateTo('/register'),
            extraClass: 'bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-2 text-base font-semibold rounded-lg transition-all duration-200 hover:-translate-y-1'
        });
        registerBox.appendChild(registerText);
        registerBox.appendChild(registerBtn);
        form.appendChild(registerBox);

        formContainer.appendChild(form);
        main.appendChild(formContainer);
        bg.appendChild(main);

        const footer = PongFooter();
        bg.appendChild(footer);

        parent.appendChild(bg);
        this.elements.push(bg);

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
                    if ('require2FA' in result) {
                        this.twoFa(data.alias, result);
                    } else {
                        // Atualizar status online após login bem-sucedido
                        try {
                            await fetch(apiUrl(3003, '/users/status/online'), {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({})
                            });
                        } catch (statusError) {
                            console.warn('Failed to update online status:', statusError);
                        }
                        navigateTo('/dashboard');
                    }
                } else {
                    const errorResponse = await response.json();
                    const mappedError = this.mapLoginError(errorResponse.error);
                    this.showErrorModal(mappedError.message, mappedError.title);
                }
            } catch (error) {
                const mappedError = this.mapLoginError(String(error));
                this.showErrorModal(mappedError.message, mappedError.title);
            }
        });
    }

    public twoFa(alias: string, data: {message: string, success: boolean}): void {
        Array.from(document.body.children).forEach(child => {
              document.body.removeChild(child);
          });

          sessionStorage.setItem("alias", alias);
          navigateTo('/2fa');
    }

    public dispose(): void {
        Array.from(document.body.children).forEach(child => {
              document.body.removeChild(child);
          });
    }
}