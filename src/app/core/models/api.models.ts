export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SurahSummary {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
  ayahCount: number;
  revelationType: string;
  revelationOrder: number;
  rukuCount: number;
}

export interface SurahDetail extends SurahSummary {
  ayahs: PagedResult<Ayah>;
}

export interface Ayah {
  surahNumber: number;
  surahNameEnglish: string;
  ayahNumberInSurah: number;
  ayahNumberGlobal: number;
  textArabic: string;
  textTranslation: string;
  textTafseer: string;
  pageNumber: number;
  juzNumber: number;
  hizbQuarter: number;
  rukuNumber: number;
  manzilNumber: number;
  isSajdah: boolean;
  sajdahType: string | null;
}

export interface TafsirDto {
  surahNumber: number;
  surahNameArabic: string;
  ayahNumberInSurah: number;
  ayahNumberGlobal: number;
  textArabic: string;
  textTafseer: string;
}

export interface TranslationDto {
  surahNumber: number;
  surahNameEnglish: string;
  ayahNumberInSurah: number;
  ayahNumberGlobal: number;
  textArabic: string;
  textTranslation: string;
}

export interface JuzDto {
  number: number;
  startSurahNumber: number;
  startAyahNumber: number;
  startSurahName: string;
}

export interface HizbDto {
  hizbNumber: number;
  juzNumber: number;
  quarters: HizbQuarterDto[];
}

export interface HizbQuarterDto {
  quarterIndex: number;
  hizbNumber: number;
  rubInHizb: number;
  juzNumber: number;
  startSurahNumber: number;
  startAyahNumber: number;
  startSurahName: string;
}

export interface RukuDto {
  number: number;
  startSurahNumber: number;
  startAyahNumber: number;
  startSurahName: string;
}

export interface ManzilDto {
  number: number;
  startSurahNumber: number;
  startAyahNumber: number;
  startSurahName: string;
}

export interface PageDto {
  pageNumber: number;
  startSurahNumber: number;
  startAyahNumber: number;
}

export interface ReciterDto {
  identifier: string;
  name: string;
  englishName: string;
  language: string;
}

export interface SurahAudioDto {
  surahNumber: number;
  surahName: string;
  reciterName: string;
  fullSurahUrl: string;
  ayahs: AyahAudioItem[];
}

export interface AyahAudioItem {
  ayahNumber: number;
  ayahNumberGlobal: number;
  audioUrl: string;
}

export interface SearchResult {
  matchedSurahs: SurahSummary[];
  matchedAyahs: PagedResult<Ayah>;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  username: string;
  email: string;
}

export interface BookmarkTagDto {
  id: number;
  name: string;
  color: string;
}

export interface BookmarkDto {
  id: number;
  surahNumber: number;
  surahNameEnglish: string;
  ayahNumber: number;
  note: string | null;
  createdAtUtc: string;
  tags: BookmarkTagDto[];
}

export interface LastReadDto {
  surahNumber: number;
  surahNameArabic: string;
  surahNameEnglish: string;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  scrollPosition: number;
  updatedAtUtc: string;
}

export interface KhatmPlanDto {
  id: number;
  goalName: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  pagesPerDay: number;
  readPages: string;
  completedPagesCount: number;
  remainingPagesCount: number;
  progressPercentage: number;
  isCompleted: boolean;
  createdAtUtc: string;
}

export interface ReadingLogItemDto {
  date: string;
  versesCount: number;
}

export interface HabitStatsDto {
  dailyGoalVerses: number;
  currentStreak: number;
  longestStreak: number;
  todayVersesCount: number;
  todayProgressPercentage: number;
  activityHeatmap: ReadingLogItemDto[];
}
