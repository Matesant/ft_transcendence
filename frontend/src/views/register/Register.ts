import { AView } from "../AView";
import { createPongCard, createPongButton, createPongInput, createPongAlert, showSpinner, hideSpinner } from "../../components/ui";
import { navigateTo } from "../../router/Router";

export class Register extends AView {
    private elements: HTMLElement[] = [];
    private eventListeners: Array<{ element: HTMLElement; event: string; listener: EventListener }> = [];

    public render(parent: HTMLElement): void {
        // Clear parent
        parent.innerHTML = '';

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'min-h-screen flex items-center justify-center p-4 pong-bg';

        // Create register card
        const registerCard = createPongCard('', 'w-full max-w-md');

        // Create title
        const title = document.createElement('h2');
        title.className = 'text-3xl font-bold text-center neon-glow-green mb-8';
        title.textContent = 'REGISTER';

        // Create form
        const form = document.createElement('form');
        form.id = 'register-form';

        // Username input
        const usernameContainer = document.createElement('div');
        usernameContainer.className = 'mb-4';

        const usernameLabel = document.createElement('label');
        usernameLabel.className = 'block text-sm font-medium text-white mb-2';
        usernameLabel.textContent = 'Username';

        const usernameInput = createPongInput({
            type: 'text',
            placeholder: 'Username',
            id: 'register-username',
            name: 'username',
            required: true
        });

        usernameContainer.appendChild(usernameLabel);
        usernameContainer.appendChild(usernameInput);

        // Email input
        const emailContainer = document.createElement('div');
        emailContainer.className = 'mb-4';

        const emailLabel = document.createElement('label');
        emailLabel.className = 'block text-sm font-medium text-white mb-2';
        emailLabel.textContent = 'Email';

        const emailInput = createPongInput({
            type: 'email',
            placeholder: 'Email',
            id: 'register-email',
            name: 'email',
            required: true
        });

        emailContainer.appendChild(emailLabel);
        emailContainer.appendChild(emailInput);

        // Password input
        const passwordContainer = document.createElement('div');
        passwordContainer.className = 'mb-4';

        const passwordLabel = document.createElement('label');
        passwordLabel.className = 'block text-sm font-medium text-white mb-2';
        passwordLabel.textContent = 'Password';

        const passwordInput = createPongInput({
            type: 'password',
            placeholder: 'Password',
            id: 'register-password',
            name: 'password',
            required: true
        });

        passwordContainer.appendChild(passwordLabel);
        passwordContainer.appendChild(passwordInput);

        // Confirm Password input
        const confirmPasswordContainer = document.createElement('div');
        confirmPasswordContainer.className = 'mb-6';

        const confirmPasswordLabel = document.createElement('label');
        confirmPasswordLabel.className = 'block text-sm font-medium text-white mb-2';
        confirmPasswordLabel.textContent = 'Confirm Password';

        const confirmPasswordInput = createPongInput({
            type: 'password',
            placeholder: 'Confirm Password',
            id: 'register-confirm-password',
            name: 'confirmPassword',
            required: true
        });

        confirmPasswordContainer.appendChild(confirmPasswordLabel);
        confirmPasswordContainer.appendChild(confirmPasswordInput);

        // Register button
        const registerButton = createPongButton({
            text: 'REGISTER',
            variant: 'primary',
            type: 'submit',
            additionalClasses: 'w-full',
            id: 'register-btn'
        });

        // Login link
        const loginLink = document.createElement('p');
        loginLink.className = 'text-center text-gray-400 mt-4';
        
        const loginAnchor = document.createElement('a');
        loginAnchor.href = '#';
        loginAnchor.className = 'text-cyan-400 hover:underline';
        loginAnchor.textContent = 'Already have an account? Login here';
        loginAnchor.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/login');
        });
        
        loginLink.appendChild(loginAnchor);

        // Error/Success message area
        const messageArea = document.createElement('div');
        messageArea.id = 'register-message';
        messageArea.className = 'mt-4';

        // Loading spinner area
        const spinnerArea = document.createElement('div');
        spinnerArea.id = 'register-spinner';
        spinnerArea.className = 'mt-4 flex justify-center';

        // Assemble form
        form.appendChild(usernameContainer);
        form.appendChild(emailContainer);
        form.appendChild(passwordContainer);
        form.appendChild(confirmPasswordContainer);
        form.appendChild(registerButton);
        form.appendChild(messageArea);
        form.appendChild(spinnerArea);
        form.appendChild(loginLink);

        // Assemble card
        registerCard.appendChild(title);
        registerCard.appendChild(form);

        // Add to main container
        mainContainer.appendChild(registerCard);

        // Add to parent
        parent.appendChild(mainContainer);

        // Store elements for cleanup
        this.elements.push(mainContainer);

        // Add event listeners
        this.addEventListeners(form);
    }

    private addEventListeners(form: HTMLFormElement): void {
        const handleRegister = async (event: Event) => {
            event.preventDefault();

            const usernameInput = document.getElementById('register-username') as HTMLInputElement;
            const emailInput = document.getElementById('register-email') as HTMLInputElement;
            const passwordInput = document.getElementById('register-password') as HTMLInputElement;
            const confirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement;
            const messageArea = document.getElementById('register-message') as HTMLDivElement;
            const spinnerArea = document.getElementById('register-spinner') as HTMLDivElement;

            if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput || !messageArea || !spinnerArea) {
                return;
            }

            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Clear previous messages
            messageArea.innerHTML = '';

            // Client-side validation
            if (password !== confirmPassword) {
                const errorAlert = createPongAlert({
                    message: 'Passwords do not match.',
                    variant: 'error'
                });
                messageArea.appendChild(errorAlert);
                return;
            }

            if (password.length < 6) {
                const errorAlert = createPongAlert({
                    message: 'Password must be at least 6 characters long.',
                    variant: 'error'
                });
                messageArea.appendChild(errorAlert);
                return;
            }

            // Show loading spinner
            const spinner = showSpinner(spinnerArea);

            try {
                const response = await fetch('http://localhost:3001/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Show success message
                    const successAlert = createPongAlert({
                        message: 'Registration successful! Redirecting to login...',
                        variant: 'success'
                    });
                    messageArea.appendChild(successAlert);

                    // Redirect to login after a short delay
                    setTimeout(() => {
                        navigateTo('/login');
                    }, 2000);
                } else {
                    // Show error message
                    const errorAlert = createPongAlert({
                        message: result.error || 'Registration failed. Please try again.',
                        variant: 'error'
                    });
                    messageArea.appendChild(errorAlert);
                }
            } catch (error) {
                console.error('Error during registration:', error);
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

        form.addEventListener('submit', handleRegister);
        this.eventListeners.push({ element: form, event: 'submit', listener: handleRegister });
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