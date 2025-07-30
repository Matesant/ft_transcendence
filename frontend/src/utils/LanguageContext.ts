// LanguageContext.ts
// Provides a global language context and translation function for the frontend
import { LANGUAGES, STRINGS, Language } from "../views/i18n";

export type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, ...args: any[]) => string;
};


let currentLanguage: Language = "en";
const listeners: Array<(lang: Language) => void> = [];

// Notify all listeners of the current language (for initial UI sync)
export function notifyLanguageChange() {
  const lang = getLanguage();
  listeners.forEach((cb) => cb(lang));
}

export function setLanguage(lang: Language) {
  if (LANGUAGES.includes(lang)) {
    currentLanguage = lang;
    listeners.forEach((cb) => cb(lang));
    localStorage.setItem("lang", lang);
    // Dispatch a custom event to notify the whole app
    window.dispatchEvent(new CustomEvent("language-changed", { detail: lang }));
  }
}

export function getLanguage(): Language {
  const stored = localStorage.getItem("lang");
  if (stored && LANGUAGES.includes(stored as Language)) return stored as Language;
  return currentLanguage;
}

export function subscribeLanguageChange(cb: (lang: Language) => void) {
  listeners.push(cb);
  // Immediately notify the new subscriber of the current language
  cb(getLanguage());
}

export function t(key: string, ...args: any[]): string {
  const lang = getLanguage();
  let str = STRINGS[lang][key] || key;
  if (args.length) {
    args.forEach((val, idx) => {
      str = str.replace(`{${idx}}`, val);
    });
  }
  return str;
}
