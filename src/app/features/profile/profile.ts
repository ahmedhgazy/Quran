import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import {
  LastReadDto,
  BookmarkDto,
  KhatmPlanDto,
  HabitStatsDto,
  ReadingLogItemDto,
} from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

interface HeatmapCell {
  date: Date;
  dateStr: string;
  versesCount: number;
  intensityClass: string;
  tooltip: string;
}

@Component({
  selector: 'app-profile',
  imports: [RouterLink, TranslatePipe, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly lastRead = signal<LastReadDto | null>(null);
  protected readonly loadingKhatm = signal(true);
  protected readonly loadingHabit = signal(true);

  protected readonly habitStats = signal<HabitStatsDto | null>(null);
  protected readonly showGoalEdit = signal(false);
  protected readonly editGoalValue = signal(10);
  protected readonly heatmapGrid = signal<HeatmapCell[][]>([]);

  protected readonly khatmPlan = signal<KhatmPlanDto | null>(null);

  protected planWizardName = 'My Khatm Plan';
  protected planWizardDays = 30;
  protected quickStartPage = 1;
  protected quickEndPage = 5;

  ngOnInit(): void {
    this.api
      .getLastRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (lr) => this.lastRead.set(lr), error: () => {} });

    this.loadKhatmPlan();
    this.loadHabitStats();
  }

  private loadKhatmPlan(): void {
    this.loadingKhatm.set(true);
    this.api
      .getKhatmPlan()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.khatmPlan.set(p);
          this.loadingKhatm.set(false);
        },
        error: () => {
          this.khatmPlan.set(null);
          this.loadingKhatm.set(false);
        },
      });
  }

  protected getCalculatedPace(): number {
    return Math.round((604 / this.planWizardDays) * 10) / 10;
  }

  protected createKhatmPlan(): void {
    const today = new Date();
    const start = today.toISOString();
    const end = new Date(today.setDate(today.getDate() + this.planWizardDays)).toISOString();

    this.api
      .createKhatmPlan(this.planWizardName, start, end)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.khatmPlan.set(p),
      });
  }

  protected toggleKhatmPage(planId: number, pageNumber: number, isRead: boolean): void {
    this.api
      .updateKhatmPage(planId, pageNumber, isRead)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.khatmPlan.set(p),
      });
  }

  protected markKhatmPageRange(planId: number, isRead: boolean): void {
    this.api
      .markKhatmPageRange(planId, this.quickStartPage, this.quickEndPage, isRead)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.khatmPlan.set(p),
      });
  }

  protected deleteKhatmPlan(planId: number): void {
    if (confirm('Are you sure you want to cancel the current Khatm goal plan?')) {
      this.api
        .deleteKhatmPlan(planId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.khatmPlan.set(null),
        });
    }
  }

  protected getKhatmPagesArray(plan: KhatmPlanDto): { page: number; isRead: boolean }[] {
    const arr = [];
    for (let i = 1; i <= 604; i++) {
      arr.push({ page: i, isRead: plan.readPages.charAt(i - 1) === '1' });
    }
    return arr;
  }

  protected getPlanDaysRemaining(plan: KhatmPlanDto): number {
    const end = new Date(plan.endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    return diff;
  }

  private loadHabitStats(): void {
    this.loadingHabit.set(true);
    this.api
      .getHabitStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.habitStats.set(stats);
          this.editGoalValue.set(stats.dailyGoalVerses);
          this.computeHeatmapGrid(stats.activityHeatmap);
          this.loadingHabit.set(false);
        },
        error: () => this.loadingHabit.set(false),
      });
  }

  protected toggleGoalEdit(): void {
    this.showGoalEdit.update((v) => !v);
  }

  protected saveHabitGoal(): void {
    this.api
      .updateHabitGoal(this.editGoalValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.habitStats.set(stats);
          this.showGoalEdit.set(false);
        },
      });
  }

  private computeHeatmapGrid(logs: ReadingLogItemDto[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logsMap = new Map<string, number>();
    for (const log of logs) {
      const dateKey = new Date(log.date).toDateString();
      logsMap.set(dateKey, log.versesCount);
    }

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const columns: HeatmapCell[][] = [];
    const currentDate = new Date(startDate);

    for (let w = 0; w < 53; w++) {
      const week: HeatmapCell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateKey = currentDate.toDateString();
        const verses = logsMap.get(dateKey) ?? 0;

        let intensityClass = 'bg-slate-100 dark:bg-slate-800/40';
        if (verses > 0 && verses < 5) {
          intensityClass = 'bg-emerald-500/20 dark:bg-emerald-400/20';
        } else if (verses >= 5 && verses < 15) {
          intensityClass = 'bg-emerald-500/45 dark:bg-emerald-400/45';
        } else if (verses >= 15 && verses < 30) {
          intensityClass = 'bg-emerald-500/75 dark:bg-emerald-400/75';
        } else if (verses >= 30) {
          intensityClass = 'bg-emerald-600 dark:bg-emerald-400';
        }

        const dateStr = currentDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const tooltip = `${verses} verses read on ${dateStr}`;

        week.push({
          date: new Date(currentDate),
          dateStr,
          versesCount: verses,
          intensityClass,
          tooltip,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      columns.push(week);
    }

    this.heatmapGrid.set(columns);
  }
}
