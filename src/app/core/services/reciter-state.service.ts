import { Injectable, signal, computed } from '@angular/core';

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  folder: string;
}

export const RECITERS: Reciter[] = [
  { id: 'alafasy',       name: 'Mishary Rashid Alafasy',       arabicName: 'مشاري العفاسي',       style: 'Murattal', folder: 'Alafasy_128kbps' },
  { id: 'abdulbasit',    name: 'Abdul Basit Abdul Samad',      arabicName: 'عبد الباسط',          style: 'Murattal', folder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'sudais',        name: 'Abdurrahmaan As-Sudais',       arabicName: 'عبدالرحمن السديس',    style: 'Murattal', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'husary',        name: 'Mahmoud Khalil Al-Husary',     arabicName: 'محمود خليل الحصري',   style: 'Murattal', folder: 'Husary_128kbps' },
  { id: 'minshawi',      name: 'Mohamed Siddiq Al-Minshawi',   arabicName: 'محمد صديق المنشاوي',  style: 'Murattal', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'maher',         name: 'Maher Al Muaiqly',             arabicName: 'ماهر المعيقلي',       style: 'Murattal', folder: 'MaherAlMuaiqly128kbps' },
  { id: 'ghamdi',        name: 'Saad Al-Ghamdi',               arabicName: 'سعد الغامدي',         style: 'Murattal', folder: 'Ghamadi_40kbps' },
  { id: 'shuraim',       name: 'Saud Ash-Shuraim',             arabicName: 'سعود الشريم',         style: 'Murattal', folder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'ajamy',         name: 'Ahmed Al-Ajamy',               arabicName: 'أحمد العجمي',         style: 'Murattal', folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net' },
  { id: 'hani',          name: 'Hani Ar-Rifai',                arabicName: 'هاني الرفاعي',        style: 'Murattal', folder: 'Hani_Rifai_192kbps' },
  { id: 'hudhaify',      name: 'Ali Al-Hudhaify',              arabicName: 'علي الحذيفي',         style: 'Murattal', folder: 'Hudhaify_128kbps' },
  { id: 'tablaway',      name: 'Muhammad Al-Tablaway',         arabicName: 'محمد الطبلاوي',       style: 'Murattal', folder: 'Mohammad_al_Tablaway_128kbps' },
  { id: 'banna',         name: 'Mahmoud Ali Al-Banna',         arabicName: 'محمود علي البنا',     style: 'Murattal', folder: 'mahmoud_ali_al_banna_32kbps' },
  { id: 'basfar',        name: 'Abdullah Basfar',              arabicName: 'عبدالله بصفر',        style: 'Murattal', folder: 'Abdullah_Basfar_192kbps' },
  { id: 'muaiqly',       name: 'Abdullah Al-Juhany',           arabicName: 'عبدالله الجهني',      style: 'Murattal', folder: 'Abdullah_Juhany_128kbps' },
  { id: 'shatri',        name: 'Abu Bakr Ash-Shatri',          arabicName: 'أبو بكر الشاطري',     style: 'Murattal', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
];

@Injectable({ providedIn: 'root' })
export class ReciterStateService {
  private readonly _selectedReciter = signal<Reciter>(this.getStored());
  private readonly _sidebarOpen = signal(false);

  readonly reciters = RECITERS;
  readonly selectedReciter = this._selectedReciter.asReadonly();
  readonly sidebarOpen = this._sidebarOpen.asReadonly();
  readonly selectedName = computed(() => this._selectedReciter().name);
  readonly selectedFolder = computed(() => this._selectedReciter().folder);

  toggleSidebar(): void {
    this._sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this._sidebarOpen.set(false);
  }

  selectReciter(reciter: Reciter): void {
    this._selectedReciter.set(reciter);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('quran_reciter', JSON.stringify(reciter));
    }
    this._sidebarOpen.set(false);
  }

  getAyahAudioUrl(surahNumber: number, ayahNumber: number): string {
    const s = surahNumber.toString().padStart(3, '0');
    const a = ayahNumber.toString().padStart(3, '0');
    return `https://everyayah.com/data/${this._selectedReciter().folder}/${s}${a}.mp3`;
  }

  private getStored(): Reciter {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('quran_reciter');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const found = RECITERS.find(r => r.id === parsed.id || r.id === parsed.identifier?.replace(/^ar\./, ''));
          if (found) return found;
        } catch { /* fall through */ }
      }
    }
    return RECITERS[0];
  }
}
