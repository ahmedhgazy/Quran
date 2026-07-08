import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { SurahSummary, Ayah } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search',
  imports: [RouterLink, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.html',
})
export class SearchPage {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly matchedSurahs = signal<SurahSummary[]>([]);
  protected readonly matchedAyahs = signal<Ayah[]>([]);
  protected readonly totalResults = signal(0);

  protected readonly suggestions = ['mercy', 'الرحمن', 'patience', 'paradise', 'الجنة'];

  protected search(q?: string): void {
    const term = q ?? this.query();
    if (!term.trim()) return;
    if (q) this.query.set(q);

    this.loading.set(true);
    this.api.search(term, undefined, { page: 1, pageSize: 20 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.matchedSurahs.set(result.matchedSurahs);
        this.matchedAyahs.set(result.matchedAyahs.items);
        this.totalResults.set(result.matchedAyahs.totalCount);
        this.loading.set(false);
      });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.search();
  }
}
