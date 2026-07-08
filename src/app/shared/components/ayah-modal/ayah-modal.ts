import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-ayah-modal',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ayah-modal.html',
})
export class AyahModalComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  readonly surahNumber = input(0);
  readonly ayahNumber = input(0);
  readonly surahName = input('');
  readonly arabicText = input('');

  readonly close = output<void>();

  protected readonly activeTab = signal<'translation' | 'tafsir'>('translation');
  protected readonly translationText = signal('');
  protected readonly tafsirText = signal('');
  protected readonly translationLoading = signal(false);
  protected readonly tafsirLoading = signal(false);

  private loadedTranslation = '';
  private loadedTafsir = '';

  loadData(): void {
    const sNum = this.surahNumber();
    const aNum = this.ayahNumber();
    if (!sNum || !aNum) return;

    if (!this.loadedTranslation || this.loadedTranslation !== `${sNum}:${aNum}`) {
      this.translationLoading.set(true);
      this.api
        .getTranslation(sNum, aNum)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (t) => {
            this.translationText.set(t.textTranslation);
            this.translationLoading.set(false);
            this.loadedTranslation = `${sNum}:${aNum}`;
          },
          error: () => {
            this.translationText.set('Translation unavailable.');
            this.translationLoading.set(false);
          },
        });
    }

    if (!this.loadedTafsir || this.loadedTafsir !== `${sNum}:${aNum}`) {
      this.tafsirLoading.set(true);
      this.api
        .getTafsir(sNum, aNum)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (t) => {
            this.tafsirText.set(t.textTafseer);
            this.tafsirLoading.set(false);
            this.loadedTafsir = `${sNum}:${aNum}`;
          },
          error: () => {
            this.tafsirText.set('Tafsir unavailable.');
            this.tafsirLoading.set(false);
          },
        });
    }
  }
}
