import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { AudioPlayerService, AudioTrack } from '../../../core/services/audio-player.service';
import { SurahSummary } from '../../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-reciter-detail',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reciter-detail.html',
})
export class ReciterDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly audioPlayer = inject(AudioPlayerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  protected readonly surahs = signal<SurahSummary[]>([]);
  protected readonly loading = signal(true);

  protected reciterId = this.id;

  ngOnInit(): void {
    this.api
      .getSurahs({ page: 1, pageSize: 114 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        this.surahs.set(r.items);
        this.loading.set(false);
      });
  }

  protected playSurah(surah: SurahSummary): void {
    this.api
      .getSurahAudio(this.id(), surah.number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const track: AudioTrack = {
            title: surah.nameEnglish,
            reciter: this.id(),
            audioUrl: res.fullSurahUrl,
            surahNumber: surah.number,
          };
          this.audioPlayer.play(track);
        },
        error: (err) => {
          console.error('Failed to play surah audio', err);
        },
      });
  }

  protected downloadSurah(surah: SurahSummary): void {
    this.api
      .downloadSurahAudio(this.id(), surah.number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const contentDisposition = res.headers.get('content-disposition');
          let fileName = `${surah.number.toString().padStart(3, '0')}_${surah.nameEnglish}_${this.id()}.mp3`;
          if (contentDisposition) {
            const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?(.+?)["']?(?:;|$)/i);
            if (match) fileName = match[1];
          }
          const url = window.URL.createObjectURL(res.body!);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Failed to download surah audio', err);
        },
      });
  }
}
