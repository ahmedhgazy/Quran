import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, input, computed, effect, untracked } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AudioPlayerService, AudioTrack } from '../../core/services/audio-player.service';
import { AuthService } from '../../core/services/auth.service';
import { ReciterStateService } from '../../core/services/reciter-state.service';
import { SurahDetail, Ayah, BookmarkDto, BookmarkTagDto } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reader',
  imports: [RouterLink, TranslatePipe, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader.html',
})
export class ReaderPage {
  private readonly api = inject(ApiService);
  private readonly audioPlayer = inject(AudioPlayerService);
  private readonly auth = inject(AuthService);
  private readonly reciterState = inject(ReciterStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly number = input.required<string>();

  protected readonly surah = signal<SurahDetail | null>(null);
  protected readonly ayahs = signal<Ayah[]>([]);
  protected readonly loading = signal(true);
  protected readonly showTafsir = signal<Record<number, boolean>>({});
  protected readonly bookmarksMap = signal<Map<string, BookmarkDto>>(new Map());

  protected readonly activeBookmarkAyah = signal<Ayah | null>(null);
  protected readonly bookmarkNote = signal('');
  protected readonly selectedTagIds = signal<number[]>([]);
  protected readonly userTags = signal<BookmarkTagDto[]>([]);

  protected readonly surahNumber = computed(() => parseInt(this.number(), 10));
  protected readonly prevSurah = computed(() => this.surahNumber() > 1 ? this.surahNumber() - 1 : null);
  protected readonly nextSurah = computed(() => this.surahNumber() < 114 ? this.surahNumber() + 1 : null);

  private readonly loadSubject = new Subject<number>();

  constructor() {
    this.loadSubject
      .pipe(
        switchMap((surahNumber) => {
          this.loading.set(true);
          return this.api.getSurah(surahNumber, { page: 1, pageSize: 300 }).pipe(
            tap((detail) => {
              this.surah.set(detail);
              this.ayahs.set(detail.ayahs.items);
              this.loading.set(false);
              if (this.auth.isAuthenticated()) {
                this.api.updateLastRead(surahNumber, 1).subscribe();
              }
              this.scrollToAyah();
            }),
            catchError((err) => {
              console.error(err);
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

  private scrollToAyah(): void {
    if (typeof window === 'undefined') return;
    
    const ayahParam = this.route.snapshot.queryParamMap.get('ayah');
    if (ayahParam) {
      setTimeout(() => {
        const el = document.getElementById(`ayah-${ayahParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-[var(--color-emeraldx-600)]/5', 'ring-1', 'ring-[var(--color-gold-500)]/30');
          setTimeout(() => {
            el.classList.remove('bg-[var(--color-emeraldx-600)]/5', 'ring-1', 'ring-[var(--color-gold-500)]/30');
          }, 3000);
        } else {
          window.scrollTo(0, 0);
        }
      }, 200);
    } else {
      window.scrollTo(0, 0);
    }
  }

  protected toggleTafsir(ayahNum: number): void {
    this.showTafsir.update((map) => ({ ...map, [ayahNum]: !map[ayahNum] }));
  }

  protected playAyah(ayah: Ayah): void {
    const track: AudioTrack = {
      title: `${this.surah()?.nameEnglish} · Ayah ${ayah.ayahNumberInSurah}`,
      reciter: this.reciterState.selectedName(),
      audioUrl: this.reciterState.getAyahAudioUrl(ayah.surahNumber, ayah.ayahNumberInSurah),
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumberInSurah,
    };
    this.audioPlayer.play(track);
  }

  protected playSurah(): void {
    const s = this.surah();
    if (!s || !this.ayahs().length) return;
    const tracks: AudioTrack[] = this.ayahs().map((ayah) => ({
      title: `${s.nameEnglish} · Ayah ${ayah.ayahNumberInSurah}`,
      reciter: this.reciterState.selectedName(),
      audioUrl: this.reciterState.getAyahAudioUrl(ayah.surahNumber, ayah.ayahNumberInSurah),
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumberInSurah,
    }));
    this.audioPlayer.playPlaylist(tracks);
  }

  private loadBookmarks(): void {
    if (!this.auth.isAuthenticated()) return;
    this.api.getBookmarks(null, { page: 1, pageSize: 500 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const map = new Map<string, BookmarkDto>();
        for (const b of result.items) {
          map.set(`${b.surahNumber}:${b.ayahNumber}`, b);
        }
        this.bookmarksMap.set(map);
      });
  }

  protected isBookmarked(ayah: Ayah): boolean {
    return this.bookmarksMap().has(`${ayah.surahNumber}:${ayah.ayahNumberInSurah}`);
  }

  protected openBookmarkDialog(ayah: Ayah): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.activeBookmarkAyah.set(ayah);
    const key = `${ayah.surahNumber}:${ayah.ayahNumberInSurah}`;
    const existing = this.bookmarksMap().get(key);

    if (existing) {
      this.bookmarkNote.set(existing.note ?? '');
      this.selectedTagIds.set(existing.tags?.map(t => t.id) ?? []);
    } else {
      this.bookmarkNote.set('');
      this.selectedTagIds.set([]);
    }

    this.api.getBookmarkTags()
      .subscribe({
        next: (tags) => this.userTags.set(tags),
        error: (err) => {
          console.error('Failed to load bookmark tags', err);
          this.userTags.set([]);
        }
      });
  }

  protected closeBookmarkDialog(): void {
    this.activeBookmarkAyah.set(null);
  }

  protected toggleTagSelection(tagId: number): void {
    this.selectedTagIds.update((ids) => {
      if (ids.includes(tagId)) {
        return ids.filter((id) => id !== tagId);
      } else {
        return [...ids, tagId];
      }
    });
  }

  protected saveBookmark(): void {
    const ayah = this.activeBookmarkAyah();
    if (!ayah) return;

    const key = `${ayah.surahNumber}:${ayah.ayahNumberInSurah}`;
    const existing = this.bookmarksMap().get(key);

    if (existing) {
      this.api.updateBookmark(existing.id, this.bookmarkNote(), this.selectedTagIds())
        .subscribe({
          next: (updated) => {
            this.bookmarksMap.update((map) => {
              const newMap = new Map(map);
              newMap.set(key, updated);
              return newMap;
            });
            this.closeBookmarkDialog();
          },
          error: (err) => console.error('Failed to update bookmark', err)
        });
    } else {
      this.api.createBookmark(ayah.surahNumber, ayah.ayahNumberInSurah, this.bookmarkNote(), this.selectedTagIds())
        .subscribe({
          next: (created) => {
            this.bookmarksMap.update((map) => {
              const newMap = new Map(map);
              newMap.set(key, created);
              return newMap;
            });
            this.closeBookmarkDialog();
          },
          error: (err) => console.error('Failed to create bookmark', err)
        });
    }
  }

  protected removeActiveBookmark(): void {
    const ayah = this.activeBookmarkAyah();
    if (!ayah) return;

    const key = `${ayah.surahNumber}:${ayah.ayahNumberInSurah}`;
    const existing = this.bookmarksMap().get(key);

    if (existing) {
      this.api.deleteBookmark(existing.id)
        .subscribe({
          next: () => {
            this.bookmarksMap.update((map) => {
              const newMap = new Map(map);
              newMap.delete(key);
              return newMap;
            });
            this.closeBookmarkDialog();
          },
          error: (err) => console.error('Failed to delete bookmark', err)
        });
    }
  }

  protected copyAyah(ayah: Ayah): void {
    const text = `${ayah.textArabic}\n\n${ayah.textTranslation}\n\n— ${this.surah()?.nameEnglish} ${ayah.surahNumber}:${ayah.ayahNumberInSurah}`;
    navigator.clipboard.writeText(text);
  }

  protected shareViaWhatsApp(ayah: Ayah): void {
    const appUrl = `${window.location.origin}/surah/${ayah.surahNumber}?ayah=${ayah.ayahNumberInSurah}`;
    const text = `📖 ${this.surah()?.nameEnglish} ${ayah.surahNumber}:${ayah.ayahNumberInSurah}\n\n${ayah.textArabic}\n\n${ayah.textTranslation}\n\nRead & Study on Al-Quran Al-Kareem: ${appUrl}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  }
}
