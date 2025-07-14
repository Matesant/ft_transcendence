import { AView } from "../AView";
import { createPongButton } from "../../components/ui";
import { navigateTo } from "../../router/Router";

export class Home extends AView {
    private elements: HTMLElement[] = [];

    public render(parent: HTMLElement): void {
        // Clear parent
        parent.innerHTML = '';

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'min-h-screen flex flex-col items-center justify-center text-center p-4 pong-bg';
        
        // Create title
        const title = document.createElement('h1');
        title.className = 'text-6xl md:text-8xl font-bold neon-glow-green mb-8';
        title.textContent = 'PONG ARENA';
        
        // Create description
        const description = document.createElement('p');
        description.className = 'text-lg md:text-xl text-white max-w-3xl mb-12';
        description.textContent = 'Welcome to the ultimate Pong gaming experience! Challenge players from around the world, climb the leaderboards, and become the Pong champion.';
        
        // Create CTA buttons container
        const ctaContainer = document.createElement('div');
        ctaContainer.className = 'flex flex-col md:flex-row gap-6';
        
        // Create Login button
        const loginButton = createPongButton({
            text: 'LOGIN',
            variant: 'secondary',
            additionalClasses: 'w-full md:w-auto'
        });
        loginButton.addEventListener('click', () => {
            navigateTo('/login');
        });
        
        // Create Register button
        const registerButton = createPongButton({
            text: 'REGISTER',
            variant: 'primary',
            additionalClasses: 'w-full md:w-auto'
        });
        registerButton.addEventListener('click', () => {
            navigateTo('/register');
        });
        
        // Add buttons to container
        ctaContainer.appendChild(loginButton);
        ctaContainer.appendChild(registerButton);
        
        // Create feature sections
        const featuresContainer = document.createElement('div');
        featuresContainer.className = 'text-left max-w-4xl mx-auto mt-16';
        
        const features = [
            {
                title: '🎮 REAL-TIME GAMEPLAY',
                description: 'Experience smooth, lag-free Pong matches with players worldwide.'
            },
            {
                title: '🏆 TOURNAMENT MODE',
                description: 'Compete in exciting tournaments and climb the global leaderboards.'
            },
            {
                title: '👥 SOCIAL FEATURES',
                description: 'Add friends, chat, and challenge players to private matches.'
            },
            {
                title: '📊 STATISTICS & ACHIEVEMENTS',
                description: 'Track your progress, view detailed stats, and unlock achievements.'
            }
        ];
        
        features.forEach(feature => {
            const featureSection = document.createElement('div');
            featureSection.className = 'mb-8';
            
            const featureTitle = document.createElement('h2');
            featureTitle.className = 'text-4xl neon-glow-blue mb-4';
            featureTitle.textContent = feature.title;
            
            const featureDesc = document.createElement('p');
            featureDesc.className = 'text-white text-lg mb-2';
            featureDesc.textContent = feature.description;
            
            featureSection.appendChild(featureTitle);
            featureSection.appendChild(featureDesc);
            featuresContainer.appendChild(featureSection);
        });
        
        // Create footer
        const footer = document.createElement('p');
        footer.className = 'text-sm text-gray-500 mt-20';
        footer.textContent = '© 2024 Pong Arena. All rights reserved.';
        
        // Assemble the view
        mainContainer.appendChild(title);
        mainContainer.appendChild(description);
        mainContainer.appendChild(ctaContainer);
        mainContainer.appendChild(featuresContainer);
        mainContainer.appendChild(footer);
        
        // Add to parent
        parent.appendChild(mainContainer);
        
        // Store elements for cleanup
        this.elements.push(mainContainer);
    }

    public dispose(): void {
        // Remove all elements created by this view
        this.elements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.elements = [];
    }
}