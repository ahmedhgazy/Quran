import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { SurahSummary, JuzDto, HizbDto, HizbQuarterDto, RukuDto, ManzilDto, PageDto, Ayah } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';
import { NavigationSidebarService } from '../../core/services/navigation-sidebar.service';
import { DAILY_AYAHS } from './daily-ayahs';

type BrowseTab = 'surah' | 'juz' | 'hizb' | 'quarter' | 'ruku' | 'manzil' | 'page' | 'sajdah';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class HomePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly navSidebar = inject(NavigationSidebarService);

  protected readonly activeTab = signal<BrowseTab>('surah');
  protected readonly loading = signal(false);

  protected readonly ayahOfDay = signal(this.pickDailyAyah());

  private pickDailyAyah() {
    const day = new Date().getDate();
    return DAILY_AYAHS[(day - 1) % DAILY_AYAHS.length];
  }

  protected readonly surahs = signal<SurahSummary[]>([]);
  protected readonly juzs = signal<JuzDto[]>([]);
  protected readonly hizbs = signal<HizbDto[]>([]);
  protected readonly quarters = signal<HizbQuarterDto[]>([]);
  protected readonly rukus = signal<RukuDto[]>([]);
  protected readonly manzils = signal<ManzilDto[]>([]);
  protected readonly pages = signal<PageDto[]>([]);
  protected readonly sajdahs = signal<Ayah[]>([]);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly pageSize = 24;

  protected readonly stats = [
    { value: '114', labelKey: 'HOME.TABS.SURAH' },
    { value: '6,236', labelKey: 'HOME.STATS_AYAT' },
    { value: '30', labelKey: 'HOME.TABS.JUZ' },
    { value: '60', labelKey: 'HOME.TABS.HIZB' },
    { value: '240', labelKey: 'HOME.TABS.RUB' },
    { value: '556', labelKey: 'HOME.TABS.RUKU' },
    { value: '7', labelKey: 'HOME.TABS.MANZIL' },
    { value: '604', labelKey: 'HOME.TABS.PAGE' },
  ];

  protected readonly tabs: { key: BrowseTab; labelKey: string }[] = [
    { key: 'surah', labelKey: 'HOME.TABS.SURAH' },
    { key: 'juz', labelKey: 'HOME.TABS.JUZ' },
    { key: 'hizb', labelKey: 'HOME.TABS.HIZB' },
    { key: 'quarter', labelKey: 'HOME.TABS.RUB' },
    { key: 'ruku', labelKey: 'HOME.TABS.RUKU' },
    { key: 'manzil', labelKey: 'HOME.TABS.MANZIL' },
    { key: 'page', labelKey: 'HOME.TABS.PAGE' },
    { key: 'sajdah', labelKey: 'HOME.TABS.SAJDAH' },
  ];

  ngOnInit(): void {
    this.switchTab('surah');
  }

  protected switchTab(tab: BrowseTab): void {
    if (tab !== this.activeTab()) {
      this.currentPage.set(1);
    }
    this.activeTab.set(tab);
    this.loading.set(true);
    const p = { page: this.currentPage(), pageSize: this.pageSize };

    const handlers: Record<BrowseTab, () => void> = {
      surah: () => this.api.getSurahs(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.surahs.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      juz: () => this.api.getJuzs(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.juzs.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      hizb: () => this.api.getHizbs(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.hizbs.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      quarter: () => this.api.getHizbQuarters(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.quarters.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      ruku: () => this.api.getRukus(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.rukus.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      manzil: () => this.api.getManzils(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.manzils.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      page: () => this.api.getPages(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.pages.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
      sajdah: () => this.api.getSajdahs(p).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => { this.sajdahs.set(r.items); this.totalPages.set(r.totalPages); this.loading.set(false); }),
    };

    handlers[tab]();
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
    this.switchTab(this.activeTab());
  }

  protected getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (start === 1) {
      end = maxVisible;
    } else if (end === total) {
      start = total - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  protected onSearchFocus(): void {
    this.router.navigate(['/search']);
  }
}
