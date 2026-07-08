import { Injectable, signal, effect, computed } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'ivory';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<AppTheme>(this.getStoredTheme());

  readonly theme = this._theme.asReadonly();

  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const themeVal = this._theme();
      if (typeof document !== 'undefined') {
        const root = document.documentElement;

        root.classList.remove('light', 'dark', 'ivory');

        root.classList.add(themeVal);

        localStorage.setItem('quran_theme', themeVal);
      }
    });
  }

  setTheme(themeVal: AppTheme): void {
    this._theme.set(themeVal);
  }

  toggle(): void {
    this._theme.update((v) => (v === 'dark' ? 'light' : 'dark'));
  }

  private getStoredTheme(): AppTheme {
    if (typeof localStorage === 'undefined') return 'dark';
    const stored = localStorage.getItem('quran_theme') as AppTheme | null;
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'ivory')) {
      return stored;
    }
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'ivory';
  }
}
