import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReciterStateService } from '../../../core/services/reciter-state.service';
import { NavigationSidebarService } from '../../../core/services/navigation-sidebar.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
})
export class HeaderComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly reciterState = inject(ReciterStateService);
  protected readonly navSidebar = inject(NavigationSidebarService);
  private readonly router = inject(Router);
  protected readonly mobileMenuOpen = signal(false);

  protected isOnSurahRoute(): boolean {
    return this.router.url.startsWith('/surah');
  }
}
