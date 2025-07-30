// LanguageSelector.ts
// A simple language selector web component for the header
import { LANGUAGES, STRINGS, Language } from "../../views/i18n";
import { getLanguage, setLanguage, subscribeLanguageChange } from "../../utils/LanguageContext";

export class LanguageSelector extends HTMLElement {
  private select: HTMLSelectElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.select = document.createElement("select");
    this.select.className = "language-selector";
    this.select.style.marginLeft = "1rem";
    this.select.style.padding = "0.25rem 0.5rem";
    this.select.style.borderRadius = "0.5rem";
    this.select.style.background = "#fff8";
    this.select.style.color = "#222";
    this.select.style.fontWeight = "bold";
    this.select.style.border = "1px solid #ccc";
    this.select.style.cursor = "pointer";
    this.select.style.fontSize = "1rem";
    this.select.style.outline = "none";
    this.select.style.transition = "background 0.2s";
    this.select.onchange = () => {
      setLanguage(this.select.value as Language);
    };
    this.shadowRoot!.appendChild(this.select);
    subscribeLanguageChange(() => this.renderOptions());
    // Listen for global language change events (for non-subscribed components)
    window.addEventListener("language-changed", () => this.renderOptions());
  }

  connectedCallback() {
    // No-op: initial render is handled by subscribeLanguageChange now
  }

  renderOptions() {
    const lang = getLanguage();
    this.select.innerHTML = "";
    LANGUAGES.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = STRINGS[l][`language${l.charAt(0).toUpperCase() + l.slice(1)}`] || l;
      this.select.appendChild(opt);
    });
    // Always set the value after options are rendered, and force update if needed
    setTimeout(() => {
      this.select.value = lang;
    }, 0);
  }
}

customElements.define("language-selector", LanguageSelector);
