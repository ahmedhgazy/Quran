import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, input, computed, effect, untracked } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AudioPlayerService, AudioTrack } from '../../core/services/audio-player.service';
import { AuthService } from '../../core/services/auth.service';
import { ReciterStateService } from '../../core/services/reciter-state.service';
import { TajweedService, TajweedRuleInfo } from '../../core/services/tajweed.service';
import { HifzService } from '../../core/services/hifz.service';
import { SurahDetail, Ayah, BookmarkDto, BookmarkTagDto, TajweedAnnotation } from '../../core/models/api.models';
import { normalizeArabic } from '../../core/utils/arabic-normalizer';
import { WavRecorder } from '../../core/utils/wav-recorder';
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
  private readonly tajweedSvc = inject(TajweedService);
  protected readonly hifzSvc = inject(HifzService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly wavRecorder = new WavRecorder();
  private activeAyahObject: Ayah | null = null;

  readonly number = input.required<string>();

  protected readonly surah = signal<SurahDetail | null>(null);
  protected readonly ayahs = signal<Ayah[]>([]);
  protected readonly loading = signal(true);
  protected readonly showTafsir = signal<Record<number, boolean>>({});
  protected readonly showTajweed = signal<Record<number, boolean>>({});
  protected readonly tajweedDataMap = signal<Map<number, TajweedAnnotation[]>>(new Map());
  private readonly tajweedHtmlCache = new Map<number, SafeHtml>();
  protected readonly tajweedLoading = signal<Record<number, boolean>>({});
  private tajweedFetched = false;
  protected readonly bookmarksMap = signal<Map<string, BookmarkDto>>(new Map());

  // Hifz & Recitation State
  protected readonly hifzMode = signal(false);
  protected readonly hifzDifficulty = signal<'none' | 'random' | 'endings' | 'whole'>('none');
  protected readonly revealedWordsMap = signal<Record<string, boolean>>({});
  protected readonly isRecording = signal<Record<number, boolean>>({});
  protected readonly recordedTextMap = signal<Record<number, string>>({});
  protected readonly comparisonResultMap = signal<Record<number, Array<{ word: string, matched: boolean }>>>({});
  protected readonly activeRecordingAyah = signal<number | null>(null);

  // Bookmark Dialog State
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

  protected toggleTajweed(ayahNum: number): void {
    this.showTajweed.update((map) => ({ ...map, [ayahNum]: !map[ayahNum] }));

    // Lazy-load Tajweed data for the entire surah on first toggle
    if (!this.tajweedFetched) {
      this.tajweedFetched = true;
      this.tajweedLoading.update((m) => ({ ...m, [ayahNum]: true }));
      this.api.getTajweed(this.surahNumber())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            const map = new Map<number, TajweedAnnotation[]>();
            for (const ayah of data.ayahs) {
              map.set(ayah.ayahNumber, ayah.annotations);
            }
            this.tajweedDataMap.set(map);
            this.tajweedLoading.set({});
          },
          error: (err) => {
            console.error('Failed to load Tajweed data', err);
            this.tajweedLoading.set({});
          }
        });
    }
  }

  protected getTajweedHtml(ayah: Ayah): SafeHtml {
    const cached = this.tajweedHtmlCache.get(ayah.ayahNumberInSurah);
    if (cached) return cached;

    const annotations = this.tajweedDataMap().get(ayah.ayahNumberInSurah);
    if (!annotations) return this.sanitizer.bypassSecurityTrustHtml(ayah.textArabic);

    const html = this.tajweedSvc.renderTajweedHtml(ayah.textArabic, annotations);
    const safe = this.sanitizer.bypassSecurityTrustHtml(html);
    this.tajweedHtmlCache.set(ayah.ayahNumberInSurah, safe);
    return safe;
  }

  protected getTajweedRulesForAyah(ayah: Ayah): TajweedRuleInfo[] {
    const annotations = this.tajweedDataMap().get(ayah.ayahNumberInSurah);
    if (!annotations) return [];
    return this.tajweedSvc.getActiveRules(annotations);
  }

  protected highlightTajweedRule(ayah: Ayah, cssClass: string): void {
    if (typeof document === 'undefined') return;

    const cardEl = document.getElementById(`ayah-${ayah.ayahNumberInSurah}`);
    if (!cardEl) return;

    const spans = cardEl.querySelectorAll(`.${cssClass}`);
    spans.forEach((span) => {
      span.classList.remove('tj-highlight-pulse');
      void (span as HTMLElement).offsetWidth;
      span.classList.add('tj-highlight-pulse');

      setTimeout(() => {
        span.classList.remove('tj-highlight-pulse');
      }, 1250);
    });
  }

  // ── Hifz Spaced Repetition ──
  protected toggleHifzMode(): void {
    this.hifzMode.update(val => !val);
    if (this.hifzMode()) {
      this.hifzDifficulty.set('random');
    } else {
      this.hifzDifficulty.set('none');
      this.revealedWordsMap.set({});
    }
  }

  protected setHifzDifficulty(diff: 'none' | 'random' | 'endings' | 'whole'): void {
    this.hifzDifficulty.set(diff);
    this.revealedWordsMap.set({});
  }

  protected isWordMasked(ayah: Ayah, word: string, wordIdx: number): boolean {
    if (!this.hifzMode()) return false;
    const diff = this.hifzDifficulty();
    if (diff === 'none') return false;

    const key = `${ayah.ayahNumberInSurah}:${wordIdx}`;
    if (this.revealedWordsMap()[key]) return false;

    if (diff === 'whole') return true;

    if (diff === 'endings') {
      const words = ayah.textArabic.split(/\s+/).filter(w => w.length > 0);
      return wordIdx >= words.length - 3;
    }

    if (diff === 'random') {
      const hash = this.hashCode(word + wordIdx + ayah.ayahNumberInSurah);
      return hash % 10 < 4; // Mask ~40%
    }

    return false;
  }

  protected revealWord(ayah: Ayah, wordIdx: number): void {
    const key = `${ayah.ayahNumberInSurah}:${wordIdx}`;
    this.revealedWordsMap.update(map => ({ ...map, [key]: true }));
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  protected submitHifzReview(ayah: Ayah, grade: number): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.hifzSvc.submitReview(ayah.surahNumber, ayah.ayahNumberInSurah, grade).subscribe({
      next: () => {
        console.log(`Submitted review for ${ayah.surahNumber}:${ayah.ayahNumberInSurah} with grade ${grade}`);
      },
      error: (err) => console.error('Failed to submit Hifz review', err)
    });
  }

  protected getAyahWords(ayah: Ayah): string[] {
    return ayah.textArabic.split(/\s+/).filter(w => w.length > 0);
  }

  // ── Speech Recognition Recitation Tester ──
  protected startSpeechTesting(ayah: Ayah): void {
    const ayahNum = ayah.ayahNumberInSurah;
    this.stopSpeechTesting();

    this.activeRecordingAyah.set(ayahNum);
    this.activeAyahObject = ayah;
    this.isRecording.update(map => ({ ...map, [ayahNum]: true }));
    this.recordedTextMap.update(map => ({ ...map, [ayahNum]: '' }));
    this.comparisonResultMap.update(map => {
      const newMap = { ...map };
      delete newMap[ayahNum];
      return newMap;
    });

    this.wavRecorder.start().catch((err) => {
      console.error('Failed to start recording', err);
      this.stopSpeechTesting();
    });
  }

  protected stopSpeechTesting(): void {
    const active = this.activeRecordingAyah();
    const activeAyah = this.activeAyahObject;

    if (active !== null) {
      this.isRecording.update(map => ({ ...map, [active]: false }));
      this.activeRecordingAyah.set(null);
      this.activeAyahObject = null;
    }

    if (this.wavRecorder.isRecording()) {
      this.wavRecorder.stop().then((blob) => {
        if (activeAyah && active === activeAyah.ayahNumberInSurah) {
          this.api.transcribeRecitation(blob).subscribe({
            next: (res) => {
              const transcript = res.transcription;
              this.recordedTextMap.update(map => ({ ...map, [active]: transcript }));
              this.compareRecitation(activeAyah, transcript);
            },
            error: (err) => {
              console.error('Failed to transcribe audio', err);
            }
          });
        }
      }).catch((err) => {
        console.error('WavRecorder stop failed', err);
      });
    }
  }

  private compareRecitation(ayah: Ayah, transcript: string): void {
    const ayahNum = ayah.ayahNumberInSurah;
    // Clean out bracketed subtitle notes (like [السر], [صمت], etc.)
    const cleanTranscript = transcript.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
    const cleanAyah = normalizeArabic(ayah.textArabic);
    const cleanSpoken = normalizeArabic(cleanTranscript);

    const ayahWords = cleanAyah.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = cleanSpoken.split(/\s+/).filter(w => w.length > 0);

    const result: Array<{ word: string, matched: boolean }> = [];
    const originalWords = ayah.textArabic.split(/\s+/).filter(w => w.length > 0);

    let spokenIdx = 0;
    for (let i = 0; i < ayahWords.length; i++) {
      const w = ayahWords[i];
      let matched = false;

      for (let j = spokenIdx; j < Math.min(spokenWords.length, spokenIdx + 5); j++) {
        if (spokenWords[j] === w) {
          matched = true;
          spokenIdx = j + 1;
          break;
        }
      }

      result.push({
        word: originalWords[i] || w,
        matched: matched
      });
    }

    this.comparisonResultMap.update(map => ({ ...map, [ayahNum]: result }));
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

    // Load custom tags
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
