import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Language } from '../../../core/services/language.service';
import { ThemeService, AppTheme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-welcome-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-modal.html',
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
      .animate-fade-out {
        animation: fadeOut 0.3s ease-in forwards;
      }
      .animate-scale-in {
        animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .animate-scale-out {
        animation: scaleOut 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
      }
      .animate-spin-slow {
        animation: spin 60s linear infinite;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.9) translateY(10px);
          opacity: 0;
        }
        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }
      @keyframes scaleOut {
        from {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
        to {
          transform: scale(0.95) translateY(10px);
          opacity: 0;
        }
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class WelcomeModalComponent {
  private readonly langService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);

  protected readonly isRendered = signal<boolean>(!this.checkVisitedBefore());
  protected readonly isClosing = signal<boolean>(false);

  protected readonly isArabic = computed(() => this.langService.lang() === 'ar');
  protected readonly activeTheme = computed(() => this.themeService.theme());

  protected setLang(lang: Language): void {
    this.langService.setLanguage(lang);
  }

  protected setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
  }

  protected onGetStarted(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('has_visited_before', 'true');
    }

    this.isClosing.set(true);

    setTimeout(() => {
      this.isRendered.set(false);
    }, 300);
  }

  private checkVisitedBefore(): boolean {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('has_visited_before') === 'true';
    }
    return true;
  }
}
