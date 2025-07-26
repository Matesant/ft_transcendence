import { LANGUAGES, STRINGS, Language } from "../../views/i18n";
import { getCurrentLanguage, changeLanguage, getText } from "../../utils/language";  // Add getText here

export function createLanguageSelector(onChange?: () => void): HTMLSelectElement {
    const selector = document.createElement("select");
    selector.id = "globalLanguageSelector";
    selector.className = "fixed top-4 right-4 z-[9999] px-3 py-2 bg-gray-800/80 text-white rounded-md border border-gray-700 backdrop-blur-sm";
    
    // Get language names from translations
    const languageLabels: Record<Language, string> = {
        ptBR: getText('languagePtBR'),
        en: getText('languageEn'),
        es: getText('languageEs')
    };

    LANGUAGES.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = languageLabels[lang];
        if (lang === getCurrentLanguage()) option.selected = true;
        selector.appendChild(option);
    });
    
    selector.addEventListener("change", () => {
        changeLanguage(selector.value as Language);
        if (onChange) {
            onChange();
        } else {
            window.location.reload();
        }
    });
    
    return selector;

}