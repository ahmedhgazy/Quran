import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationSidebarService } from '../../../core/services/navigation-sidebar.service';
import { SurahSummary } from '../../../core/models/api.models';

@Component({
  selector: 'app-navigation-sidebar',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation-sidebar.html',
})
export class NavigationSidebarComponent {
  protected readonly state = inject(NavigationSidebarService);
  protected readonly activeTab = signal<'surah' | 'juz' | 'verse'>('surah');

  protected readonly surahSearch = signal('');
  protected readonly filteredSurahs = computed(() => {
    const q = this.surahSearch().toLowerCase();
    const list = this.state.surahs();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameTransliteration.toLowerCase().includes(q) ||
        s.nameArabic.includes(q) ||
        s.number.toString() === q
    );
  });

  protected readonly selectedSurahForVerse = signal<SurahSummary | null>(null);
  protected readonly surahSearchForVerse = signal('');
  protected readonly filteredSurahsForVerse = computed(() => {
    const q = this.surahSearchForVerse().toLowerCase();
    const list = this.state.surahs();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.nameEnglish.toLowerCase().includes(q) ||
        s.nameTransliteration.toLowerCase().includes(q) ||
        s.nameArabic.includes(q) ||
        s.number.toString() === q
    );
  });

  protected getVerseNumbers(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i + 1);
  }
}
