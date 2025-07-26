import { STRINGS, Language } from "../views/i18n";

// Get the current language from localStorage or use default
export function getCurrentLanguage(): Language {
    return (localStorage.getItem("lang") as Language) || "en";
}

// Get a string from the current language
export function getText(key: string): string {
    const lang = getCurrentLanguage();
    return STRINGS[lang][key] || key;
}

// Change the language and save to localStorage
export function changeLanguage(lang: Language): void {
    localStorage.setItem("lang", lang);
    // Optional: Dispatch a custom event that components can listen for
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}