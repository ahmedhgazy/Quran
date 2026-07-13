// ── Pagination ──
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

// ── Surah ──
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

// ── Ayah ──
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

// ── Tafsir / Translation ──
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

// ── Quran Structure ──
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

// ── Audio ──
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

// ── Search ──
export interface SearchResult {
  matchedSurahs: SurahSummary[];
  matchedAyahs: PagedResult<Ayah>;
}

// ── Auth ──
export interface AuthResponse {
  token: string;
  expiresAt: string;
  username: string;
  email: string;
}

// ── Bookmark Tag ──
export interface BookmarkTagDto {
  id: number;
  name: string;
  color: string;
}

// ── Bookmark ──
export interface BookmarkDto {
  id: number;
  surahNumber: number;
  surahNameEnglish: string;
  ayahNumber: number;
  note: string | null;
  createdAtUtc: string;
  tags: BookmarkTagDto[];
}

// ── Last Read ──
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

// ── Khatm Planner ──
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

// ── Habit Tracker ──
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

// ── Tajweed ──
export interface TajweedAnnotation {
  rule: string;
  start: number;
  end: number;
}

export interface AyahTajweed {
  ayahNumber: number;
  annotations: TajweedAnnotation[];
}

export interface SurahTajweed {
  surahNumber: number;
  ayahs: AyahTajweed[];
}

// ── Hifz ──
export interface HifzProgressDto {
  id: number;
  surahNumber: number;
  surahNameEnglish: string;
  ayahNumber: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDateUtc: string;
  textArabic: string;
  textTranslation: string;
}

export interface HifzStatsDto {
  totalMemorized: number;
  dueToday: number;
  dueTomorrow: number;
  overdueCount: number;
}
