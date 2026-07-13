import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { HifzProgressDto, HifzStatsDto } from '../models/api.models';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HifzService {
  private readonly api = inject(ApiService);

  // Read-only signals for stats & due count
  readonly stats = signal<HifzStatsDto | null>(null);
  readonly dueVerses = signal<HifzProgressDto[]>([]);
  readonly loading = signal(false);

  loadStats(): void {
    this.api.getHifzStats().subscribe({
      next: (s) => this.stats.set(s),
      error: (err) => console.error('Failed to load Hifz stats', err)
    });
  }

  loadDueVerses(): void {
    this.loading.set(true);
    this.api.getDueHifz().subscribe({
      next: (due) => {
        this.dueVerses.set(due);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load due Hifz verses', err);
        this.loading.set(false);
      }
    });
  }

  submitReview(surahNumber: number, ayahNumber: number, grade: number): Observable<HifzProgressDto> {
    return this.api.reviewHifz(surahNumber, ayahNumber, grade).pipe(
      tap(() => {
        // Refresh local memory and statistics
        this.loadStats();
        // Remove reviewed verse from due list
        this.dueVerses.update((list) =>
          list.filter((x) => !(x.surahNumber === surahNumber && x.ayahNumber === ayahNumber))
        );
      })
    );
  }
}
