import { AView } from "../AView";
import { createPongCard, createPongButton, createPongInput, createPongAlert, showSpinner, hideSpinner } from "../../components/ui";
import { navigateTo } from "../../router/Router";

export class Login extends AView {
    private elements: HTMLElement[] = [];
    private eventListeners: Array<{ element: HTMLElement; event: string; listener: EventListener }> = [];

    public render(parent: HTMLElement): void {
        // Clear parent
        parent.innerHTML = '';

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'min-h-screen flex items-center justify-center p-4 pong-bg';

        // Create login card
        const loginCard = createPongCard('', 'w-full max-w-md');

        // Create title
        const title = document.createElement('h2');
        title.className = 'text-3xl font-bold text-center neon-glow-green mb-8';
        title.textContent = 'LOGIN';

        // Create form
        const form = document.createElement('form');
        form.id = 'login-form';

        // Username/Email input
        const usernameContainer = document.createElement('div');
        usernameContainer.className = 'mb-4';

        const usernameLabel = document.createElement('label');
        usernameLabel.className = 'block text-sm font-medium text-white mb-2';
        usernameLabel.textContent = 'Username or Email';

        const usernameInput = createPongInput({
            type: 'text',
            placeholder: 'Username or Email',
            id: 'login-username',
            name: 'username',
            required: true
        });

        usernameContainer.appendChild(usernameLabel);
        usernameContainer.appendChild(usernameInput);

        // Password input
        const passwordContainer = document.createElement('div');
        passwordContainer.className = 'mb-6';

        const passwordLabel = document.createElement('label');
        passwordLabel.className = 'block text-sm font-medium text-white mb-2';
        passwordLabel.textContent = 'Password';

        const passwordInput = createPongInput({
            type: 'password',
            placeholder: 'Password',
            id: 'login-password',
            name: 'password',
            required: true
        });

        passwordContainer.appendChild(passwordLabel);
        passwordContainer.appendChild(passwordInput);

        // Login button
        const loginButton = createPongButton({
            text: 'LOGIN',
            variant: 'primary',
            type: 'submit',
            additionalClasses: 'w-full',
            id: 'login-btn'
        });

        // Register link
        const registerLink = document.createElement('p');
        registerLink.className = 'text-center text-gray-400 mt-4';
        
        const registerAnchor = document.createElement('a');
        registerAnchor.href = '#';
        registerAnchor.className = 'text-cyan-400 hover:underline';
        registerAnchor.textContent = "Don't have an account? Register here";
        registerAnchor.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/register');
        });
        
        registerLink.appendChild(registerAnchor);

        // Error/Success message area
        const messageArea = document.createElement('div');
        messageArea.id = 'login-message';
        messageArea.className = 'mt-4';

        // Loading spinner area
        const spinnerArea = document.createElement('div');
        spinnerArea.id = 'login-spinner';
        spinnerArea.className = 'mt-4 flex justify-center';

        // Assemble form
        form.appendChild(usernameContainer);
        form.appendChild(passwordContainer);
        form.appendChild(loginButton);
        form.appendChild(messageArea);
        form.appendChild(spinnerArea);
        form.appendChild(registerLink);

        // Assemble card
        loginCard.appendChild(title);
        loginCard.appendChild(form);

        // Add to main container
        mainContainer.appendChild(loginCard);

        // Add to parent
        parent.appendChild(mainContainer);

        // Store elements for cleanup
        this.elements.push(mainContainer);

        // Add event listeners
        this.addEventListeners(form);
    }

    private addEventListeners(form: HTMLFormElement): void {
        const handleLogin = async (event: Event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('login-username') as HTMLInputElement;
            const passwordInput = document.getElementById('login-password') as HTMLInputElement;
            const messageArea = document.getElementById('login-message') as HTMLDivElement;
            const spinnerArea = document.getElementById('login-spinner') as HTMLDivElement;

            if (!usernameInput || !passwordInput || !messageArea || !spinnerArea) {
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Clear previous messages
            messageArea.innerHTML = '';

            // Show loading spinner
            const spinner = showSpinner(spinnerArea);

            try {
                const response = await fetch('http://localhost:3001/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Success - check if 2FA is required
                    if (result.requires2FA) {
                        // Store temporary token for 2FA
                        localStorage.setItem('tempToken', result.token);
                        navigateTo('/2fa');
                    } else {
                        // Store JWT and redirect to dashboard
                        localStorage.setItem('jwt', result.token);
                        localStorage.setItem('isAuthenticated', 'true');
                        navigateTo('/dashboard');
                    }
                } else {
                    // Show error message
                    const errorAlert = createPongAlert({
                        message: result.error || 'Login failed. Please check your credentials.',
                        variant: 'error'
                    });
                    messageArea.appendChild(errorAlert);
                }
            } catch (error) {
                console.error('Error during login:', error);
                const errorAlert = createPongAlert({
                    message: 'Network error. Please try again.',
                    variant: 'error'
                });
                messageArea.appendChild(errorAlert);
            } finally {
                // Hide loading spinner
                hideSpinner(spinnerArea, spinner);
            }
        };

        form.addEventListener('submit', handleLogin);
        this.eventListeners.push({ element: form, event: 'submit', listener: handleLogin });
    }

    public dispose(): void {
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, listener }) => {
            element.removeEventListener(event, listener);
        });
        this.eventListeners = [];

        // Remove all elements created by this view
        this.elements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.elements = [];
    }
}