import { AView } from "./AView";
import { createPongCard, createPongButton, createPongInput, createPongAlert, showSpinner, hideSpinner } from "../components/ui";
import { navigateTo } from "../router/Router";

export class TwoFactorAuth extends AView {
    private elements: HTMLElement[] = [];
    private eventListeners: Array<{ element: HTMLElement; event: string; listener: EventListener }> = [];

    public render(parent: HTMLElement): void {
        // Clear parent
        parent.innerHTML = '';

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'min-h-screen flex items-center justify-center p-4 pong-bg';

        // Create 2FA card
        const twoFACard = createPongCard('', 'w-full max-w-md');

        // Create title
        const title = document.createElement('h2');
        title.className = 'text-3xl font-bold text-center neon-glow-yellow mb-8';
        title.textContent = 'TWO-FACTOR AUTH';

        // Create description
        const description = document.createElement('p');
        description.className = 'text-center text-white mb-6';
        description.textContent = 'Please enter the 6-digit code from your authenticator app.';

        // Create form
        const form = document.createElement('form');
        form.id = '2fa-form';

        // TOTP Code input
        const codeContainer = document.createElement('div');
        codeContainer.className = 'mb-6';

        const codeLabel = document.createElement('label');
        codeLabel.className = 'block text-sm font-medium text-white mb-2';
        codeLabel.textContent = 'Authentication Code';

        const codeInput = createPongInput({
            type: 'text',
            placeholder: 'XXXXXX',
            id: '2fa-code',
            name: 'code',
            required: true
        });
        codeInput.maxLength = 6;
        codeInput.pattern = '[0-9]{6}';

        codeContainer.appendChild(codeLabel);
        codeContainer.appendChild(codeInput);

        // Verify button
        const verifyButton = createPongButton({
            text: 'VERIFY',
            variant: 'primary',
            type: 'submit',
            additionalClasses: 'w-full',
            id: '2fa-verify-btn'
        });

        // Error/Success message area
        const messageArea = document.createElement('div');
        messageArea.id = '2fa-message';
        messageArea.className = 'mt-4';

        // Loading spinner area
        const spinnerArea = document.createElement('div');
        spinnerArea.id = '2fa-spinner';
        spinnerArea.className = 'mt-4 flex justify-center';

        // Assemble form
        form.appendChild(codeContainer);
        form.appendChild(verifyButton);
        form.appendChild(messageArea);
        form.appendChild(spinnerArea);

        // Assemble card
        twoFACard.appendChild(title);
        twoFACard.appendChild(description);
        twoFACard.appendChild(form);

        // Add to main container
        mainContainer.appendChild(twoFACard);

        // Add to parent
        parent.appendChild(mainContainer);

        // Store elements for cleanup
        this.elements.push(mainContainer);

        // Add event listeners
        this.addEventListeners(form);
    }

    private addEventListeners(form: HTMLFormElement): void {
        const handleVerify = async (event: Event) => {
            event.preventDefault();

            const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
            const messageArea = document.getElementById('2fa-message') as HTMLDivElement;
            const spinnerArea = document.getElementById('2fa-spinner') as HTMLDivElement;

            if (!codeInput || !messageArea || !spinnerArea) {
                return;
            }

            const code = codeInput.value.trim();

            // Clear previous messages
            messageArea.innerHTML = '';

            // Validate code format
            if (!/^\d{6}$/.test(code)) {
                const errorAlert = createPongAlert({
                    message: 'Please enter a valid 6-digit code.',
                    variant: 'error'
                });
                messageArea.appendChild(errorAlert);
                return;
            }

            // Show loading spinner
            const spinner = showSpinner(spinnerArea);

            try {
                const tempToken = localStorage.getItem('tempToken');
                
                const response = await fetch('http://localhost:3001/auth/2fa/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${tempToken}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        code: code
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Success - store final JWT and redirect to dashboard
                    localStorage.removeItem('tempToken'); // Clean up temp token
                    localStorage.setItem('jwt', result.token);
                    localStorage.setItem('isAuthenticated', 'true');
                    
                    const successAlert = createPongAlert({
                        message: 'Authentication successful! Redirecting to dashboard...',
                        variant: 'success'
                    });
                    messageArea.appendChild(successAlert);

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        navigateTo('/dashboard');
                    }, 1500);
                } else {
                    // Show error message
                    const errorAlert = createPongAlert({
                        message: result.error || 'Invalid code. Please try again.',
                        variant: 'error'
                    });
                    messageArea.appendChild(errorAlert);
                    
                    // Clear input for retry
                    codeInput.value = '';
                    codeInput.focus();
                }
            } catch (error) {
                console.error('Error during 2FA verification:', error);
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

        form.addEventListener('submit', handleVerify);
        this.eventListeners.push({ element: form, event: 'submit', listener: handleVerify });

        // Auto-focus on code input
        const codeInput = document.getElementById('2fa-code') as HTMLInputElement;
        if (codeInput) {
            codeInput.focus();
        }
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