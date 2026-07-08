import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';

interface AyahItem {
  arabic: string;
  english: string;
}

const AYAH_POOL: AyahItem[] = [
  {
    arabic: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ',
    english: '“Indeed, this Qur’an guides to that which is most suitable.”',
  },
  {
    arabic: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
    english: '“And We send down of the Qur’an that which is healing and mercy for the believers.”',
  },
  {
    arabic: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ',
    english: '“Indeed, it is We who sent down the Qur’an and indeed, We will be its guardian.”',
  },
  {
    arabic: 'وَاذْكُر رَّبَّكَ فِي نَفْسِكَ تَضَرُّعًا وَخِيفَةً',
    english: '“And remember your Lord within yourself in humility and in fear.”',
  },
  {
    arabic: 'وَتَمَّتْ كَلِمَتُ رَبِّكَ صِدْقًا وَعَدْلًا',
    english: '“And the word of your Lord has been fulfilled in truth and in justice.”',
  },
  {
    arabic: 'صَدَقَ اللهُ الْعَظِيمُ',
    english: '“Allah Almighty has spoken the truth.”',
  },
];

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
})
export class FooterComponent {
  protected readonly langService = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly currentAyah = signal<AyahItem>(AYAH_POOL[0]);
  protected readonly currentYear = new Date().getFullYear();

  constructor() {
    this.pickRandomAyah();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.pickRandomAyah();
      });
  }

  private pickRandomAyah(): void {
    const current = this.currentAyah();
    const available = AYAH_POOL.filter((a) => a.arabic !== current.arabic);
    const pool = available.length > 0 ? available : AYAH_POOL;
    const randomIdx = Math.floor(Math.random() * pool.length);
    this.currentAyah.set(pool[randomIdx]);
  }
}
