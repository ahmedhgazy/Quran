import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcherComponent {
  protected readonly lang = inject(LanguageService);
}
