import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { SurahSummary, PagedResult, Ayah, AuthResponse } from '../models/api.models';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Surahs', () => {
    it('getSurahs() should GET /surahs without pagination params by default', () => {
      const mockResponse: PagedResult<SurahSummary> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      service.getSurahs().subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${base}/surahs`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('getSurahs() should include pagination params when provided', () => {
      service.getSurahs({ page: 2, pageSize: 20 }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${base}/surahs` &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, page: 2, pageSize: 20, totalPages: 0 });
    });

    it('getSurah() should GET a specific surah by number', () => {
      service.getSurah(1).subscribe();

      const req = httpMock.expectOne(`${base}/surahs/1`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('Ayahs', () => {
    it('getAyahsBySurah() should GET ayahs for a surah', () => {
      service.getAyahsBySurah(2).subscribe();

      const req = httpMock.expectOne(`${base}/surahs/2/ayahs`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('getAyah() should GET a specific ayah', () => {
      service.getAyah(2, 255).subscribe();

      const req = httpMock.expectOne(`${base}/surahs/2/ayahs/255`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('Structure endpoints', () => {
    it('getJuzs() should GET /juzs', () => {
      service.getJuzs().subscribe();
      const req = httpMock.expectOne(`${base}/juzs`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('getJuzAyahs() should GET /juzs/:number/ayahs', () => {
      service.getJuzAyahs(1).subscribe();
      const req = httpMock.expectOne(`${base}/juzs/1/ayahs`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('getHizbs() should GET /hizbs', () => {
      service.getHizbs().subscribe();
      const req = httpMock.expectOne(`${base}/hizbs`);
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('getSajdahs() should GET /sajdahs', () => {
      service.getSajdahs().subscribe();
      const req = httpMock.expectOne(`${base}/sajdahs`);
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });
  });

  describe('Tafsir & Translation', () => {
    it('getTafsir() should GET /tafsirs/:surah/:ayah', () => {
      service.getTafsir(1, 1).subscribe();
      const req = httpMock.expectOne(`${base}/tafsirs/1/1`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('getTranslation() should GET /translations/:surah/:ayah', () => {
      service.getTranslation(1, 1).subscribe();
      const req = httpMock.expectOne(`${base}/translations/1/1`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('Search', () => {
    it('search() should pass query as a param', () => {
      service.search('الرحمن').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${base}/search` && r.params.get('query') === 'الرحمن'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ matchedSurahs: [], matchedAyahs: { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } });
    });

    it('search() should include lang param when provided', () => {
      service.search('mercy', 'en').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${base}/search` &&
        r.params.get('query') === 'mercy' &&
        r.params.get('lang') === 'en'
      );
      req.flush({ matchedSurahs: [], matchedAyahs: { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 } });
    });
  });

  describe('Audio', () => {
    it('getReciters() should GET /reciters', () => {
      service.getReciters().subscribe();
      const req = httpMock.expectOne(`${base}/reciters`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getSurahAudio() should GET /reciters/:id/surahs/:number', () => {
      service.getSurahAudio('ar.alafasy', 1).subscribe();
      const req = httpMock.expectOne(`${base}/reciters/ar.alafasy/surahs/1`);
      req.flush({});
    });
  });

  describe('Bookmarks', () => {
    it('getBookmarks() should GET /users/me/bookmarks', () => {
      service.getBookmarks().subscribe();
      const req = httpMock.expectOne(`${base}/users/me/bookmarks`);
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('getBookmarks() should include tagId when provided', () => {
      service.getBookmarks(5).subscribe();
      const req = httpMock.expectOne(r =>
        r.url === `${base}/users/me/bookmarks` && r.params.get('tagId') === '5'
      );
      req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 });
    });

    it('createBookmark() should POST to /users/me/bookmarks', () => {
      service.createBookmark(2, 255, 'Ayatul Kursi').subscribe();
      const req = httpMock.expectOne(`${base}/users/me/bookmarks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        surahNumber: 2,
        ayahNumber: 255,
        note: 'Ayatul Kursi',
        tagIds: undefined,
      });
      req.flush({});
    });

    it('deleteBookmark() should DELETE /users/me/bookmarks/:id', () => {
      service.deleteBookmark(42).subscribe();
      const req = httpMock.expectOne(`${base}/users/me/bookmarks/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Auth', () => {
    const mockAuth: AuthResponse = {
      token: 'jwt-token',
      expiresAt: '2026-12-31',
      username: 'ahmed',
      email: 'ahmed@test.com',
    };

    it('login() should POST with credentials and withCredentials flag', () => {
      service.login('ahmed@test.com', 'password').subscribe();

      const req = httpMock.expectOne(`${base}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'ahmed@test.com', password: 'password' });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAuth);
    });

    it('register() should POST username, email, and password', () => {
      service.register('ahmed', 'ahmed@test.com', 'password').subscribe();

      const req = httpMock.expectOne(`${base}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'ahmed',
        email: 'ahmed@test.com',
        password: 'password',
      });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAuth);
    });

    it('refresh() should POST to /auth/refresh with withCredentials', () => {
      service.refresh().subscribe();

      const req = httpMock.expectOne(`${base}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAuth);
    });

    it('revoke() should POST to /auth/revoke with withCredentials', () => {
      service.revoke().subscribe();

      const req = httpMock.expectOne(`${base}/auth/revoke`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);
    });

    it('checkEmail() should GET /auth/check-email with email param', () => {
      service.checkEmail('ahmed@test.com').subscribe();

      const req = httpMock.expectOne(r =>
        r.url === `${base}/auth/check-email` && r.params.get('email') === 'ahmed@test.com'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ exists: false });
    });

    it('loginWithGoogle() should POST idToken to /auth/google', () => {
      service.loginWithGoogle('google-id-token').subscribe();

      const req = httpMock.expectOne(`${base}/auth/google`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ idToken: 'google-id-token' });
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAuth);
    });
  });

  describe('Khatm Planner', () => {
    it('createKhatmPlan() should POST plan details', () => {
      service.createKhatmPlan('Ramadan Khatm', '2026-03-01', '2026-03-30').subscribe();

      const req = httpMock.expectOne(`${base}/users/me/khatm-plan`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        goalName: 'Ramadan Khatm',
        startDate: '2026-03-01',
        endDate: '2026-03-30',
      });
      req.flush({});
    });

    it('deleteKhatmPlan() should DELETE /users/me/khatm-plan/:id', () => {
      service.deleteKhatmPlan(7).subscribe();
      const req = httpMock.expectOne(`${base}/users/me/khatm-plan/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Habit Tracker', () => {
    it('getHabitStats() should GET /users/me/habit-stats', () => {
      service.getHabitStats().subscribe();
      const req = httpMock.expectOne(`${base}/users/me/habit-stats`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('incrementHabitVerses() should POST count as a query param', () => {
      service.incrementHabitVerses(10).subscribe();
      const req = httpMock.expectOne(`${base}/users/me/habit-stats/increment?count=10`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('Last Read', () => {
    it('updateLastRead() should PUT surah, ayah, and scroll position', () => {
      service.updateLastRead(2, 255, 1200).subscribe();

      const req = httpMock.expectOne(`${base}/users/me/last-read`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        surahNumber: 2,
        ayahNumber: 255,
        scrollPosition: 1200,
      });
      req.flush({});
    });

    it('updateLastRead() should default scrollPosition to 0', () => {
      service.updateLastRead(1, 1).subscribe();

      const req = httpMock.expectOne(`${base}/users/me/last-read`);
      expect(req.request.body.scrollPosition).toBe(0);
      req.flush({});
    });
  });
});
