import { LANGUAGES, Language } from "../../views/i18n";
import { getCurrentLanguage, changeLanguage, getText } from "../../utils/language";

export function createLanguageSelector(onChange?: () => void): HTMLDivElement {
    // Create a container for the language selector
    const container = document.createElement("div");
    container.id = "globalLanguageSelector";
    container.className = "fixed bottom-6 right-6 z-[99999] bg-gray-800/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 overflow-hidden";
    container.style.boxShadow = '0 0 15px rgba(0,0,0,0.7)';
    
    // Language title
    const title = document.createElement("div");
    title.className = "px-4 py-2 bg-blue-600 text-white font-semibold text-center";
    title.textContent = "🌐 Language / Idioma";
    container.appendChild(title);
    
    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex flex-col p-2 gap-2";
    
    // Get language names from translations
    const languageLabels: Record<Language, string> = {
        ptBR: getText('languagePtBR'),
        en: getText('languageEn'),
        es: getText('languageEs')
    };
    
    // Flag icons for each language
    const flagIcons: Record<Language, string> = {
        ptBR: "🇧🇷",
        en: "🇬🇧",
        es: "🇪🇸"
    };

    // Create a button for each language
    const currentLang = getCurrentLanguage();
    
    LANGUAGES.forEach(lang => {
        const button = document.createElement("button");
        button.className = `flex items-center w-full px-4 py-2 rounded ${
            lang === currentLang 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700/80 text-white/90 hover:bg-gray-600'
        } transition-all duration-200`;
        
        const flag = document.createElement("span");
        flag.className = "text-xl mr-3";
        flag.textContent = flagIcons[lang];
        
        const label = document.createElement("span");
        label.textContent = languageLabels[lang];
        
        button.appendChild(flag);
        button.appendChild(label);
        
        button.addEventListener("click", () => {
            if (lang !== currentLang) {
                changeLanguage(lang);
                console.log(`Language changed to: ${lang}`);
                
                // Update selected button styles
                document.querySelectorAll("#globalLanguageSelector button").forEach(btn => {
                    btn.classList.remove("bg-blue-500", "text-white");
                    btn.classList.add("bg-gray-700/80", "text-white/90", "hover:bg-gray-600");
                });
                
                button.classList.remove("bg-gray-700/80", "text-white/90", "hover:bg-gray-600");
                button.classList.add("bg-blue-500", "text-white");
                
                if (onChange) {
                    onChange();
                } else {
                    window.location.reload();
                }
            }
        });
        
        buttonContainer.appendChild(button);
    });
    
    container.appendChild(buttonContainer);
    
    // Minimize button
    const minimizeContainer = document.createElement("div");
    minimizeContainer.className = "px-3 py-1 border-t border-gray-600/50 bg-gray-900/50 text-center";
    
    const minimizeButton = document.createElement("button");
    minimizeButton.className = "text-xs text-gray-400 hover:text-white";
    minimizeButton.textContent = "⬇️ minimize";
    
    let isMinimized = false;
    minimizeButton.addEventListener("click", () => {
        if (isMinimized) {
            buttonContainer.style.display = "flex";
            title.style.display = "block";
            minimizeButton.textContent = "⬇️ minimize";
            isMinimized = false;
        } else {
            buttonContainer.style.display = "none";
            title.style.display = "none";
            minimizeButton.textContent = "🌐";
            isMinimized = true;
        }
    });
    
    minimizeContainer.appendChild(minimizeButton);
    container.appendChild(minimizeContainer);
    
    return container;
}