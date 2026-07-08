import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PagedResult,
  PaginationParams,
  SurahSummary,
  SurahDetail,
  Ayah,
  JuzDto,
  HizbDto,
  HizbQuarterDto,
  RukuDto,
  ManzilDto,
  PageDto,
  ReciterDto,
  SurahAudioDto,
  AyahAudioItem,
  SearchResult,
  BookmarkDto,
  LastReadDto,
  TafsirDto,
  TranslationDto,
  BookmarkTagDto,
  KhatmPlanDto,
  HabitStatsDto,
  AuthResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private paginate(p?: PaginationParams): HttpParams {
    let params = new HttpParams();
    if (p) {
      params = params.set('page', p.page).set('pageSize', p.pageSize);
    }
    return params;
  }

  getSurahs(p?: PaginationParams): Observable<PagedResult<SurahSummary>> {
    return this.http.get<PagedResult<SurahSummary>>(`${this.base}/surahs`, {
      params: this.paginate(p),
    });
  }

  getSurah(number: number, p?: PaginationParams): Observable<SurahDetail> {
    return this.http.get<SurahDetail>(`${this.base}/surahs/${number}`, {
      params: this.paginate(p),
    });
  }

  getAyahsBySurah(surahNumber: number, p?: PaginationParams): Observable<PagedResult<Ayah>> {
    return this.http.get<PagedResult<Ayah>>(`${this.base}/surahs/${surahNumber}/ayahs`, {
      params: this.paginate(p),
    });
  }

  getAyah(surahNumber: number, ayahNumber: number): Observable<Ayah> {
    return this.http.get<Ayah>(`${this.base}/surahs/${surahNumber}/ayahs/${ayahNumber}`);
  }

  getJuzs(p?: PaginationParams): Observable<PagedResult<JuzDto>> {
    return this.http.get<PagedResult<JuzDto>>(`${this.base}/juzs`, { params: this.paginate(p) });
  }

  getJuzAyahs(number: number, p?: PaginationParams): Observable<PagedResult<Ayah>> {
    return this.http.get<PagedResult<Ayah>>(`${this.base}/juzs/${number}/ayahs`, {
      params: this.paginate(p),
    });
  }

  getHizbs(p?: PaginationParams): Observable<PagedResult<HizbDto>> {
    return this.http.get<PagedResult<HizbDto>>(`${this.base}/hizbs`, { params: this.paginate(p) });
  }

  getHizbQuarters(p?: PaginationParams): Observable<PagedResult<HizbQuarterDto>> {
    return this.http.get<PagedResult<HizbQuarterDto>>(`${this.base}/hizb-quarters`, {
      params: this.paginate(p),
    });
  }

  getRukus(p?: PaginationParams): Observable<PagedResult<RukuDto>> {
    return this.http.get<PagedResult<RukuDto>>(`${this.base}/rukus`, { params: this.paginate(p) });
  }

  getManzils(p?: PaginationParams): Observable<PagedResult<ManzilDto>> {
    return this.http.get<PagedResult<ManzilDto>>(`${this.base}/manzils`, {
      params: this.paginate(p),
    });
  }

  getPages(p?: PaginationParams): Observable<PagedResult<PageDto>> {
    return this.http.get<PagedResult<PageDto>>(`${this.base}/pages`, { params: this.paginate(p) });
  }

  getSajdahs(p?: PaginationParams): Observable<PagedResult<Ayah>> {
    return this.http.get<PagedResult<Ayah>>(`${this.base}/sajdahs`, { params: this.paginate(p) });
  }

  getTafsir(surahNumber: number, ayahNumber: number): Observable<TafsirDto> {
    return this.http.get<TafsirDto>(`${this.base}/tafsirs/${surahNumber}/${ayahNumber}`);
  }

  getTranslation(surahNumber: number, ayahNumber: number): Observable<TranslationDto> {
    return this.http.get<TranslationDto>(`${this.base}/translations/${surahNumber}/${ayahNumber}`);
  }

  search(query: string, lang?: string, p?: PaginationParams): Observable<SearchResult> {
    let params = this.paginate(p).set('query', query);
    if (lang) params = params.set('lang', lang);
    return this.http.get<SearchResult>(`${this.base}/search`, { params });
  }

  getReciters(): Observable<ReciterDto[]> {
    return this.http.get<ReciterDto[]>(`${this.base}/reciters`);
  }

  getSurahAudio(reciterId: string, surahNumber: number): Observable<SurahAudioDto> {
    return this.http.get<SurahAudioDto>(`${this.base}/reciters/${reciterId}/surahs/${surahNumber}`);
  }

  getAyahAudio(
    reciterId: string,
    surahNumber: number,
    ayahNumber: number,
  ): Observable<AyahAudioItem> {
    return this.http.get<AyahAudioItem>(
      `${this.base}/reciters/${reciterId}/surahs/${surahNumber}/ayahs/${ayahNumber}`,
    );
  }

  downloadSurahAudio(
    reciterId: string,
    surahNumber: number,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/reciters/${reciterId}/surahs/${surahNumber}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  getBookmarks(tagId?: number | null, p?: PaginationParams): Observable<PagedResult<BookmarkDto>> {
    let params = this.paginate(p);
    if (tagId !== undefined && tagId !== null) {
      params = params.set('tagId', tagId.toString());
    }
    return this.http.get<PagedResult<BookmarkDto>>(`${this.base}/users/me/bookmarks`, { params });
  }

  createBookmark(
    surahNumber: number,
    ayahNumber: number,
    note?: string,
    tagIds?: number[],
  ): Observable<BookmarkDto> {
    return this.http.post<BookmarkDto>(`${this.base}/users/me/bookmarks`, {
      surahNumber,
      ayahNumber,
      note,
      tagIds,
    });
  }

  updateBookmark(id: number, note: string | null, tagIds?: number[]): Observable<BookmarkDto> {
    return this.http.put<BookmarkDto>(`${this.base}/users/me/bookmarks/${id}`, { note, tagIds });
  }

  deleteBookmark(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/bookmarks/${id}`);
  }

  getBookmarkTags(): Observable<BookmarkTagDto[]> {
    return this.http.get<BookmarkTagDto[]>(`${this.base}/users/me/bookmark-tags`);
  }

  createBookmarkTag(name: string, color: string): Observable<BookmarkTagDto> {
    return this.http.post<BookmarkTagDto>(`${this.base}/users/me/bookmark-tags`, { name, color });
  }

  updateBookmarkTag(id: number, name: string, color: string): Observable<BookmarkTagDto> {
    return this.http.put<BookmarkTagDto>(`${this.base}/users/me/bookmark-tags/${id}`, {
      name,
      color,
    });
  }

  deleteBookmarkTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/bookmark-tags/${id}`);
  }

  getKhatmPlan(): Observable<KhatmPlanDto> {
    return this.http.get<KhatmPlanDto>(`${this.base}/users/me/khatm-plan`);
  }

  createKhatmPlan(goalName: string, startDate: string, endDate: string): Observable<KhatmPlanDto> {
    return this.http.post<KhatmPlanDto>(`${this.base}/users/me/khatm-plan`, {
      goalName,
      startDate,
      endDate,
    });
  }

  updateKhatmPage(planId: number, pageNumber: number, isRead: boolean): Observable<KhatmPlanDto> {
    return this.http.put<KhatmPlanDto>(`${this.base}/users/me/khatm-plan/${planId}/page`, {
      pageNumber,
      isRead,
    });
  }

  markKhatmPageRange(
    planId: number,
    startPage: number,
    endPage: number,
    isRead: boolean,
  ): Observable<KhatmPlanDto> {
    return this.http.put<KhatmPlanDto>(`${this.base}/users/me/khatm-plan/${planId}/range`, {
      startPage,
      endPage,
      isRead,
    });
  }

  deleteKhatmPlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me/khatm-plan/${planId}`);
  }

  getHabitStats(): Observable<HabitStatsDto> {
    return this.http.get<HabitStatsDto>(`${this.base}/users/me/habit-stats`);
  }

  updateHabitGoal(dailyGoalVerses: number): Observable<HabitStatsDto> {
    return this.http.put<HabitStatsDto>(`${this.base}/users/me/habit-stats/goal`, {
      dailyGoalVerses,
    });
  }

  incrementHabitVerses(count: number): Observable<HabitStatsDto> {
    return this.http.post<HabitStatsDto>(
      `${this.base}/users/me/habit-stats/increment?count=${count}`,
      {},
    );
  }

  getLastRead(): Observable<LastReadDto> {
    return this.http.get<LastReadDto>(`${this.base}/users/me/last-read`);
  }

  updateLastRead(
    surahNumber: number,
    ayahNumber: number,
    scrollPosition = 0,
  ): Observable<LastReadDto> {
    return this.http.put<LastReadDto>(`${this.base}/users/me/last-read`, {
      surahNumber,
      ayahNumber,
      scrollPosition,
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.base}/auth/login`,
      { email, password },
      { withCredentials: true },
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.base}/auth/google`,
      { idToken },
      { withCredentials: true },
    );
  }

  register(
    username: string,
    email: string,
    password: string,
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.base}/auth/register`,
      { username, email, password },
      { withCredentials: true },
    );
  }

  checkEmail(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.base}/auth/check-email`, {
      params: { email },
    });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.base}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  revoke(): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/revoke`, {}, { withCredentials: true });
  }
}
