import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HifzService } from '../../core/services/hifz.service';
import { AuthService } from '../../core/services/auth.service';
import { HifzProgressDto } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-hifz-dashboard',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './hifz-dashboard.html',
})
export class HifzDashboardPage implements OnInit {
  protected readonly hifzSvc = inject(HifzService);
  protected readonly auth = inject(AuthService);

  // Revision state
  protected readonly activeIndex = signal<number>(0);
  protected readonly revealed = signal<boolean>(false);
  protected readonly reviewedGrade = signal<number | null>(null);

  protected readonly activeCard = computed<HifzProgressDto | null>(() => {
    const list = this.hifzSvc.dueVerses();
    const idx = this.activeIndex();
    return list.length > 0 && idx < list.length ? list[idx] : null;
  });

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.hifzSvc.loadStats();
      this.hifzSvc.loadDueVerses();
    }
  }

  protected revealCard(): void {
    this.revealed.set(true);
  }

  protected submitGrade(grade: number): void {
    const card = this.activeCard();
    if (!card) return;

    this.reviewedGrade.set(grade);

    // Add a slight animation delay before loading the next card
    this.hifzSvc.submitReview(card.surahNumber, card.ayahNumber, grade).subscribe({
      next: () => {
        setTimeout(() => {
          this.revealed.set(false);
          this.reviewedGrade.set(null);
          
          // Move index pointer if there are items left, or reset
          const maxIdx = this.hifzSvc.dueVerses().length;
          if (this.activeIndex() >= maxIdx && maxIdx > 0) {
            this.activeIndex.set(0);
          }
        }, 300);
      },
      error: (err) => {
        console.error('Failed to submit card grade', err);
        this.reviewedGrade.set(null);
      }
    });
  }

  protected skipCard(): void {
    this.revealed.set(false);
    this.reviewedGrade.set(null);
    const list = this.hifzSvc.dueVerses();
    if (list.length === 0) return;
    this.activeIndex.update((idx) => (idx + 1) % list.length);
  }
}
