import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  input,
  ViewChild,
  effect,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin, EMPTY } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AudioPlayerService, AudioTrack } from '../../core/services/audio-player.service';
import { ReciterStateService } from '../../core/services/reciter-state.service';
import { AuthService } from '../../core/services/auth.service';
import { AyahModalComponent } from '../../shared/components/ayah-modal/ayah-modal';
import { SurahDetail, Ayah } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';

interface WordToken {
  word: string;
  ayahIndex: number;
  wordIndex: number;
}

@Component({
  selector: 'app-mushaf',
  imports: [RouterLink, AyahModalComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mushaf.html',
  host: {
    '(window:scroll)': 'onScroll()',
    '(window:resize)': 'onResize()',
    '(document:click)': 'onDocumentClick()',
  },
})
export class MushafPage {
  private readonly api = inject(ApiService);
  private readonly audioPlayer = inject(AudioPlayerService);
  protected readonly reciterState = inject(ReciterStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('modal') modal!: AyahModalComponent;

  readonly number = input.required<string>();

  protected readonly surah = signal<SurahDetail | null>(null);
  protected readonly ayahs = signal<Ayah[]>([]);
  protected readonly loading = signal(true);
  protected readonly scrollProgress = signal(0);

  protected readonly activeAyahIdx = signal<number | null>(null);
  protected readonly showActions = signal<number | null>(null);
  protected readonly activeWordIdx = signal<number | null>(null);
  protected readonly popoverTop = signal<number>(0);
  protected readonly popoverLeft = signal<number>(0);
  protected readonly selectedAyah = computed(() => {
    const idx = this.showActions();
    return idx !== null ? this.ayahs()[idx] ?? null : null;
  });
  protected readonly bookmarksMap = signal<Map<string, number>>(new Map());

  protected readonly modalOpen = signal(false);
  protected readonly modalSurahNumber = signal(0);
  protected readonly modalAyahNumber = signal(0);
  protected readonly modalSurahName = signal('');
  protected readonly modalArabicText = signal('');

  protected readonly surahNumber = computed(() => parseInt(this.number(), 10));
  protected readonly prevSurah = computed(() =>
    this.surahNumber() > 1 ? this.surahNumber() - 1 : null,
  );
  protected readonly nextSurah = computed(() =>
    this.surahNumber() < 114 ? this.surahNumber() + 1 : null,
  );

  private readonly loadSubject = new Subject<number>();

  constructor() {
    this.loadSubject
      .pipe(
        switchMap((num) => {
          this.loading.set(true);
          return forkJoin({
            ayahs: this.api.getAyahsBySurah(num, { page: 1, pageSize: 300 }),
            surah: this.api.getSurah(num, { page: 1, pageSize: 1 })
          }).pipe(
            tap(({ ayahs, surah }) => {
              this.ayahs.set(ayahs.items);
              this.surah.set(surah);
              this.loading.set(false);
              if (this.auth.isAuthenticated()) {
                this.api.updateLastRead(num, 1).subscribe();
              }
              if (typeof window !== 'undefined') {
                window.scrollTo(0, 0);
              }
            }),
            catchError((err) => {
              console.error('Failed to load surah', err);
              this.loading.set(false);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    effect(() => {
      const num = this.surahNumber();
      untracked(() => {
        this.loadSubject.next(num);
      });
    });
    this.loadBookmarks();
  }

  protected toArabicNum(n: number): string {
    return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
  }

  protected getWords(ayah: Ayah, ayahIdx: number): WordToken[] {
    return ayah.textArabic
      .split(/\s+/)
      .map((word, i) => ({ word, ayahIndex: ayahIdx, wordIndex: i }));
  }

  protected onWordClick(
    event: MouseEvent,
    ayahIdx: number,
    wordIdx: number | null = null,
    element: HTMLElement,
    container: HTMLElement
  ): void {
    event.stopPropagation();

    if (this.showActions() === ayahIdx && this.activeWordIdx() === wordIdx) {
      this.showActions.set(null);
      this.activeWordIdx.set(null);
      this.activeAyahIdx.set(null);
      return;
    }

    this.showActions.set(ayahIdx);
    this.activeWordIdx.set(wordIdx);
    this.activeAyahIdx.set(ayahIdx);

    setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();

      const top = elemRect.bottom - containerRect.top + 8;
      const popoverWidth = 135;
      const padding = 12;

      const elemCenter = elemRect.left + elemRect.width / 2;
      let left = elemCenter - containerRect.left - popoverWidth / 2;

      const minLeft = padding;
      const maxLeft = containerRect.width - popoverWidth - padding;
      left = Math.max(minLeft, Math.min(left, maxLeft));

      this.popoverTop.set(top);
      this.popoverLeft.set(left);
    }, 0);
  }

  protected playFromAyah(ayah: Ayah): void {
    const track: AudioTrack = {
      title: `${this.surah()?.nameEnglish} · Ayah ${ayah.ayahNumberInSurah}`,
      reciter: this.reciterState.selectedName(),
      audioUrl: this.reciterState.getAyahAudioUrl(ayah.surahNumber, ayah.ayahNumberInSurah),
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumberInSurah,
    };
    this.audioPlayer.play(track);
    this.showActions.set(null);
    this.activeWordIdx.set(null);
    this.activeAyahIdx.set(null);
  }

  protected openTafsirModal(ayah: Ayah): void {
    this.modalSurahNumber.set(ayah.surahNumber);
    this.modalAyahNumber.set(ayah.ayahNumberInSurah);
    this.modalSurahName.set(this.surah()?.nameEnglish ?? '');
    this.modalArabicText.set(ayah.textArabic);
    this.modalOpen.set(true);
    this.showActions.set(null);
    this.activeWordIdx.set(null);
    this.activeAyahIdx.set(null);

    setTimeout(() => this.modal?.loadData(), 0);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  private loadBookmarks(): void {
    if (!this.auth.isAuthenticated()) return;
    this.api.getBookmarks(null, { page: 1, pageSize: 500 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const map = new Map<string, number>();
        for (const b of result.items) {
          map.set(`${b.surahNumber}:${b.ayahNumber}`, b.id);
        }
        this.bookmarksMap.set(map);
      });
  }

  protected isBookmarked(ayah: Ayah): boolean {
    return this.bookmarksMap().has(`${ayah.surahNumber}:${ayah.ayahNumberInSurah}`);
  }

  protected bookmarkAyah(ayah: Ayah): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const key = `${ayah.surahNumber}:${ayah.ayahNumberInSurah}`;
    const existingId = this.bookmarksMap().get(key);

    if (existingId !== undefined) {
      this.api.deleteBookmark(existingId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.bookmarksMap.update((map) => {
              const newMap = new Map(map);
              newMap.delete(key);
              return newMap;
            });
          },
          error: (err) => console.error('Failed to delete bookmark', err)
        });
    } else {
      this.api.createBookmark(ayah.surahNumber, ayah.ayahNumberInSurah)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (b) => {
            this.bookmarksMap.update((map) => {
              const newMap = new Map(map);
              newMap.set(key, b.id);
              return newMap;
            });
          },
          error: (err) => {
            if (err.status === 409) {
              this.loadBookmarks();
            } else {
              console.error('Failed to create bookmark', err);
            }
          }
        });
    }

    this.showActions.set(null);
    this.activeWordIdx.set(null);
    this.activeAyahIdx.set(null);
  }

  protected onScroll(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress.set(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    this.clearPopover();
  }

  protected onResize(): void {
    this.clearPopover();
  }

  protected onDocumentClick(): void {
    this.clearPopover();
  }

  protected shareViaWhatsApp(ayah: Ayah): void {
    const appUrl = `${window.location.origin}/surah/${ayah.surahNumber}?ayah=${ayah.ayahNumberInSurah}`;
    const text = `📖 ${this.surah()?.nameEnglish} ${ayah.surahNumber}:${ayah.ayahNumberInSurah}\n\n${ayah.textArabic}\n\n${ayah.textTranslation}\n\nRead & Study on Al-Quran Al-Kareem: ${appUrl}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    this.clearPopover();
  }

  private clearPopover(): void {
    if (this.showActions() !== null) {
      this.showActions.set(null);
      this.activeWordIdx.set(null);
      this.activeAyahIdx.set(null);
    }
  }
}
