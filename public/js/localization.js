/**
 * Cyber Scavenger Localization System
 * Supports: English (en), Turkish (tr), German (de)
 * Fetches translations from API
 */

class LocalizationManager {
    constructor() {
        this.currentLang = localStorage.getItem('cyber_lang') || this.detectLanguage();
        this.translations = {}; // Cache
        this.init();
    }

    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('tr')) return 'tr';
        if (browserLang.startsWith('de')) return 'de';
        return 'en';
    }

    async setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('cyber_lang', lang);
        document.documentElement.lang = lang;
        await this.loadTranslations(lang);
        this.applyTranslations();
    }

    async loadTranslations(lang) {
        if (this.translations[lang]) return;

        try {
            const res = await fetch(`/api/translations/${lang}`);
            if (!res.ok) throw new Error('Translation load failed');
            this.translations[lang] = await res.json();
        } catch (err) {
            console.error('Failed to load translations:', err);
            // Fallback to empty object to prevent repeated fetches
            this.translations[lang] = {};
        }
    }

    t(key) {
        const dict = this.translations[this.currentLang] || {};
        return dict[key] || key;
    }

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.innerText = text;
            }
        });
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.loadTranslations(this.currentLang);
            this.applyTranslations();
        });
    }
}

const Loc = new LocalizationManager();
window.Loc = Loc; // Expose globally
