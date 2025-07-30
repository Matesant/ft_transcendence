import { AView } from "../AView";
import { PongHeaderPublic } from "../../components/ui/PongHeaderPublic";
import { PongHeader, PongFooter, PongInput, PongButton, PongSpinner } from "../../components/ui";
import { apiUrl } from "../../utils/api";
import { navigateTo } from "../../router/Router";
import { PongModal } from "../../components/ui/PongModal";

export class ForgotPassword extends AView {
    
    private elements: HTMLElement[] = [];
    private currentStep: 'request' | 'reset' = 'request';
    private userAlias: string = '';
    private isLoading: boolean = false;

    // Helper function to map password reset request errors to user-friendly messages
    private mapRequestResetError(errorMessage: string): { title: string; message: string } {
        const error = errorMessage.toLowerCase();
        
        if (error.includes('alias is required')) {
            return {
                title: "Missing Information",
                message: "Please enter your username to request a password reset."
            };
        }
        
        if (error.includes('error sending reset code')) {
            return {
                title: "Email Error",
                message: "Unable to send the reset code to your email. Please try again later."
            };
        }
        
        if (error.includes('network') || error.includes('fetch')) {
            return {
                title: "Connection Error",
                message: "Unable to connect to the server. Please check your internet connection and try again."
            };
        }
        
        if (error.includes('timeout')) {
            return {
                title: "Request Timeout",
                message: "The request took too long to complete. Please try again."
            };
        }
        
        return {
            title: "Request Error",
            message: "An unexpected error occurred while requesting the reset code. Please try again."
        };
    }

    // Helper function to map password reset errors to user-friendly messages
    private mapPasswordResetError(errorMessage: string): { title: string; message: string } {
        const error = errorMessage.toLowerCase();
        
        if (error.includes('alias, code, new password and confirm password are required')) {
            return {
                title: "Missing Information",
                message: "Please fill in all required fields: username, code, new password, and confirm password."
            };
        }
        
        if (error.includes('passwords do not match')) {
            return {
                title: "Password Mismatch",
                message: "The new password and confirm password do not match. Please try again."
            };
        }
        
        if (error.includes('password must be at least 6 characters long')) {
            return {
                title: "Password Too Short",
                message: "The new password must be at least 6 characters long."
            };
        }
        
        if (error.includes('invalid or expired reset code')) {
            return {
                title: "Invalid Code",
                message: "The reset code is invalid or has expired. Please request a new code."
            };
        }
        
        if (error.includes('error resetting password')) {
            return {
                title: "Reset Error",
                message: "Unable to reset your password. Please try again later."
            };
        }
        
        if (error.includes('network') || error.includes('fetch')) {
            return {
                title: "Connection Error",
                message: "Unable to connect to the server. Please check your internet connection and try again."
            };
        }
        
        if (error.includes('timeout')) {
            return {
                title: "Request Timeout",
                message: "The request took too long to complete. Please try again."
            };
        }
        
        return {
            title: "Reset Error",
            message: "An unexpected error occurred while resetting your password. Please try again."
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

    // Helper function to show success modal
    private showSuccessModal(message: string, title: string = "Success"): void {
        const modal = PongModal({
            message: message,
            title: title,
            type: 'success',
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

        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold text-center text-white mb-2';
        title.textContent = this.currentStep === 'request' ? 'Esqueceu sua senha?' : 'Redefinir Senha';

        const subtitle = document.createElement('p');
        subtitle.className = 'text-center text-white/70 text-sm mb-8';
        subtitle.textContent = this.currentStep === 'request' 
            ? 'Digite seu alias para receber um código de verificação no e-mail'
            : 'Digite o código recebido no e-mail e sua nova senha';

        formContainer.appendChild(title);
        formContainer.appendChild(subtitle);

        const form = document.createElement('form');
        form.id = 'forgot-password-form';
        form.className = 'w-full';

        if (this.currentStep === 'request') {
            this.renderRequestStep(form);
        } else {
            this.renderResetStep(form);
        }

        formContainer.appendChild(form);
        main.appendChild(formContainer);
        bg.appendChild(main);

        const footer = PongFooter();
        bg.appendChild(footer);

        parent.appendChild(bg);
        this.elements.push(bg);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            if (this.isLoading) return;
            
            if (this.currentStep === 'request') {
                await this.handleRequestReset(event);
            } else {
                await this.handlePasswordReset(event);
            }
        });
    }

    private renderRequestStep(form: HTMLFormElement): void {
        const aliasDiv = document.createElement('div');
        aliasDiv.className = 'mb-6';
        const aliasLabel = document.createElement('label');
        aliasLabel.htmlFor = 'alias';
        aliasLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        aliasLabel.textContent = 'Alias';
        aliasDiv.appendChild(aliasLabel);
        
        const aliasInput = PongInput({ id: 'alias', name: 'alias', type: 'text', required: true });
        aliasInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        aliasInput.placeholder = 'Digite seu alias';
        aliasDiv.appendChild(aliasInput);
        form.appendChild(aliasDiv);

        const submitBtn = PongButton({
            text: this.isLoading ? '' : 'Enviar Código',
            variant: 'primary',
            extraClass: `w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25 mb-6 flex items-center justify-center ${this.isLoading ? 'opacity-75 cursor-not-allowed' : ''}`,
        });

        if (this.isLoading) {
            const spinner = PongSpinner({ size: 'sm', extraClass: 'border-white border-t-white/30' });
            const loadingText = document.createElement('span');
            loadingText.className = 'ml-2';
            loadingText.textContent = 'Enviando...';
            submitBtn.appendChild(spinner);
            submitBtn.appendChild(loadingText);
        }

        form.appendChild(submitBtn);

        const backToLoginDiv = document.createElement('div');
        backToLoginDiv.className = 'text-center';
        const backToLoginLink = document.createElement('a');
        backToLoginLink.href = '#';
        backToLoginLink.className = 'text-sm text-white/60 hover:text-white/80 cursor-pointer transition-colors duration-200';
        backToLoginLink.textContent = 'Voltar para o login';
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/login');
        });
        backToLoginDiv.appendChild(backToLoginLink);
        form.appendChild(backToLoginDiv);
    }

    private renderResetStep(form: HTMLFormElement): void {
        const aliasInfoDiv = document.createElement('div');
        aliasInfoDiv.className = 'mb-4 p-3 bg-black/20 rounded-lg';
        const aliasInfoLabel = document.createElement('span');
        aliasInfoLabel.className = 'text-sm text-white/70';
        aliasInfoLabel.textContent = `Redefinindo senha para: ${this.userAlias}`;
        aliasInfoDiv.appendChild(aliasInfoLabel);
        form.appendChild(aliasInfoDiv);

        const codeDiv = document.createElement('div');
        codeDiv.className = 'mb-4';
        const codeLabel = document.createElement('label');
        codeLabel.htmlFor = 'code';
        codeLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        codeLabel.textContent = 'Código de Verificação';
        codeDiv.appendChild(codeLabel);
        
        const codeInput = PongInput({ id: 'code', name: 'code', type: 'text', required: true });
        codeInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        codeInput.placeholder = 'Digite o código recebido';
        codeDiv.appendChild(codeInput);
        form.appendChild(codeDiv);

        const passwordDiv = document.createElement('div');
        passwordDiv.className = 'mb-4';
        const passwordLabel = document.createElement('label');
        passwordLabel.htmlFor = 'password';
        passwordLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        passwordLabel.textContent = 'Nova Senha';
        passwordDiv.appendChild(passwordLabel);
        
        const passwordInput = PongInput({ id: 'password', name: 'password', type: 'password', required: true });
        passwordInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        passwordInput.placeholder = 'Digite sua nova senha';
        passwordDiv.appendChild(passwordInput);
        form.appendChild(passwordDiv);

        const confirmPasswordDiv = document.createElement('div');
        confirmPasswordDiv.className = 'mb-6';
        const confirmPasswordLabel = document.createElement('label');
        confirmPasswordLabel.htmlFor = 'confirmPassword';
        confirmPasswordLabel.className = 'block text-sm font-medium text-white/90 mb-2';
        confirmPasswordLabel.textContent = 'Confirmar Nova Senha';
        confirmPasswordDiv.appendChild(confirmPasswordLabel);
        
        const confirmPasswordInput = PongInput({ id: 'confirmPassword', name: 'confirmPassword', type: 'password', required: true });
        confirmPasswordInput.className = 'w-full p-4 border-none rounded-lg bg-black/20 text-white text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30';
        confirmPasswordInput.placeholder = 'Confirme sua nova senha';
        confirmPasswordDiv.appendChild(confirmPasswordInput);
        form.appendChild(confirmPasswordDiv);

        const submitBtn = PongButton({
            text: this.isLoading ? '' : 'Redefinir Senha',
            variant: 'primary',
            extraClass: `w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25 mb-6 flex items-center justify-center ${this.isLoading ? 'opacity-75 cursor-not-allowed' : ''}`,
        });

        if (this.isLoading) {
            const spinner = PongSpinner({ size: 'sm', extraClass: 'border-white border-t-white/30' });
            const loadingText = document.createElement('span');
            loadingText.className = 'ml-2';
            loadingText.textContent = 'Redefinindo...';
            submitBtn.appendChild(spinner);
            submitBtn.appendChild(loadingText);
        }

        form.appendChild(submitBtn);

        const backToRequestDiv = document.createElement('div');
        backToRequestDiv.className = 'text-center';
        const backToRequestLink = document.createElement('a');
        backToRequestLink.href = '#';
        backToRequestLink.className = 'text-sm text-white/60 hover:text-white/80 cursor-pointer transition-colors duration-200';
        backToRequestLink.textContent = 'Voltar para solicitar código';
        backToRequestLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.currentStep = 'request';
            this.render();
        });
        backToRequestDiv.appendChild(backToRequestLink);
        form.appendChild(backToRequestDiv);
    }

    private async handleRequestReset(event: Event): Promise<void> {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            alias: String(formData.get('alias'))
        };
        
        this.isLoading = true;
        this.render();
        
        try {
            const response = await fetch(apiUrl(3001, '/auth/password/request-reset'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                this.userAlias = data.alias;
                this.currentStep = 'reset';
                this.isLoading = false;
                this.showSuccessModal('Código enviado para seu e-mail!', 'Código Enviado');
                this.render();
            } else {
                const errorResponse = await response.json();
                this.isLoading = false;
                this.render();
                const mappedError = this.mapRequestResetError(errorResponse.error);
                this.showErrorModal(mappedError.message, mappedError.title);
            }
        } catch (error) {
            this.isLoading = false;
            this.render();
            const mappedError = this.mapRequestResetError(String(error));
            this.showErrorModal(mappedError.message, mappedError.title);
        }
    }

    private async handlePasswordReset(event: Event): Promise<void> {
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const password = String(formData.get('password'));
        const confirmPassword = String(formData.get('confirmPassword'));
        
        if (password !== confirmPassword) {
            this.showErrorModal('As senhas não coincidem!', 'Password Mismatch');
            return;
        }

        this.isLoading = true;
        this.render();

        const data = {
            alias: this.userAlias,
            code: String(formData.get('code')),
            newPassword: password,
            confirmPassword: confirmPassword
        };
        
        try {
            const response = await fetch(apiUrl(3001, '/auth/password/reset'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.isLoading = false;
                this.showSuccessModal('Senha redefinida com sucesso!', 'Password Reset Success');
                setTimeout(() => {
                    navigateTo('/login');
                }, 2000);
            } else {
                const errorResponse = await response.json();
                this.isLoading = false;
                this.render();
                const mappedError = this.mapPasswordResetError(errorResponse.error);
                this.showErrorModal(mappedError.message, mappedError.title);
            }
        } catch (error) {
            this.isLoading = false;
            this.render();
            const mappedError = this.mapPasswordResetError(String(error));
            this.showErrorModal(mappedError.message, mappedError.title);
        }
    }

    public dispose(): void {
        Array.from(document.body.children).forEach(child => {
              document.body.removeChild(child);
          });
    }
}
