import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { AudioPlayerComponent } from './shared/components/audio-player/audio-player';
import { ReciterSidebarComponent } from './shared/components/reciter-sidebar/reciter-sidebar';
import { NavigationSidebarComponent } from './shared/components/navigation-sidebar/navigation-sidebar';
import { ToastComponent } from './shared/components/toast/toast';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar';
import { LanguageService } from './core/services/language.service';
import { WelcomeModalComponent } from './shared/components/welcome-modal/welcome-modal';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    AudioPlayerComponent,
    ReciterSidebarComponent,
    NavigationSidebarComponent,
    ToastComponent,
    LoadingBarComponent,
    WelcomeModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly langService = inject(LanguageService);
  private readonly router = inject(Router);

  private readonly currentUrl = signal(this.router.url);

  protected readonly hideFooter = computed(() => {
    const url = this.currentUrl();
    return url.includes('/profile') || url.includes('/login') || url.includes('/register');
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
      });
  }
}
