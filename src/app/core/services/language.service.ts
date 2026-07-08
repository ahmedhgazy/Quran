import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly _lang = signal<Language>(this.getStoredLanguage());
  readonly lang = this._lang.asReadonly();

  readonly dir = computed<Direction>(() => (this._lang() === 'ar' ? 'rtl' : 'ltr'));
  readonly isArabic = computed<boolean>(() => this._lang() === 'ar');

  constructor() {
    this.translate.setFallbackLang('ar');

    effect(() => {
      const currentLang = this._lang();
      const currentDir = this.dir();

      this.translate.use(currentLang);
      localStorage.setItem('quran_lang', currentLang);

      if (typeof document !== 'undefined') {
        document.documentElement.dir = currentDir;
        document.documentElement.lang = currentLang;

        if (currentDir === 'rtl') {
          document.documentElement.classList.add('rtl');
          document.documentElement.classList.remove('ltr');
        } else {
          document.documentElement.classList.add('ltr');
          document.documentElement.classList.remove('rtl');
        }
      }
    });
  }

  setLanguage(lang: Language): void {
    this._lang.set(lang);
  }

  toggleLanguage(): void {
    this._lang.set(this._lang() === 'ar' ? 'en' : 'ar');
  }

  private getStoredLanguage(): Language {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('quran_lang') as Language | null;
      if (stored === 'ar' || stored === 'en') {
        return stored;
      }
    }
    return 'ar';
  }
}
