import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let showSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    showSpy = vi.spyOn(toastService, 'show');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not show a toast on successful requests', () => {
    http.get('/api/data').subscribe();
    httpMock.expectOne('/api/data').flush({ data: 'ok' });

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should show a connection error toast for status 0', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').error(new ProgressEvent('error'), { status: 0 });

    expect(showSpy).toHaveBeenCalledWith(
      'error',
      'Connection Error',
      'Connection lost. Please check your internet connection.',
    );
  });

  it('should show a warning toast for 400 with ProblemDetails body', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').flush(
      { detail: 'Invalid surah number' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(showSpy).toHaveBeenCalledWith('warning', 'Invalid Request', 'Invalid surah number');
  });

  it('should show a toast for 401 on /api/auth/login', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });

    httpMock.expectOne('/api/auth/login').flush(
      { detail: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(showSpy).toHaveBeenCalledWith('warning', 'Unauthorized', 'Invalid credentials');
  });

  it('should NOT show a toast for 401 on regular endpoints (auth interceptor handles it)', () => {
    http.get('/api/users/me/bookmarks').subscribe({ error: () => {} });

    httpMock.expectOne('/api/users/me/bookmarks').flush(
      null,
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should show an error toast for 403', () => {
    http.get('/api/admin').subscribe({ error: () => {} });

    httpMock.expectOne('/api/admin').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(showSpy).toHaveBeenCalledWith(
      'error',
      'Access Denied',
      'You do not have permission to perform this action.',
    );
  });

  it('should show a warning toast for unexpected 404', () => {
    http.get('/api/surahs/999').subscribe({ error: () => {} });

    httpMock.expectOne('/api/surahs/999').flush(null, { status: 404, statusText: 'Not Found' });

    expect(showSpy).toHaveBeenCalledWith(
      'warning',
      'Not Found',
      'The requested resource was not found.',
    );
  });

  it('should NOT show a toast for expected 404 on khatm-plan GET', () => {
    http.get('/api/users/me/khatm-plan').subscribe({ error: () => {} });

    httpMock.expectOne('/api/users/me/khatm-plan').flush(
      null,
      { status: 404, statusText: 'Not Found' },
    );

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should NOT show a toast for expected 404 on last-read GET', () => {
    http.get('/api/users/me/last-read').subscribe({ error: () => {} });

    httpMock.expectOne('/api/users/me/last-read').flush(
      null,
      { status: 404, statusText: 'Not Found' },
    );

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should show a warning toast for 409', () => {
    http.post('/api/users/me/bookmarks', {}).subscribe({ error: () => {} });

    httpMock.expectOne('/api/users/me/bookmarks').flush(
      { detail: 'Bookmark already exists' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(showSpy).toHaveBeenCalledWith('warning', 'Conflict', 'Bookmark already exists');
  });

  it('should show an error toast for 500', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(showSpy).toHaveBeenCalledWith(
      'error',
      'Server Error',
      'Something went wrong on our server. Please try again later.',
    );
  });

  it('should extract message from a string error body', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').flush('Raw error string', {
      status: 400,
      statusText: 'Bad Request',
    });

    expect(showSpy).toHaveBeenCalledWith('warning', 'Invalid Request', 'Raw error string');
  });

  it('should extract message from PascalCase ProblemDetails', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').flush(
      { Detail: 'PascalCase detail', Title: 'PascalCase Title' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(showSpy).toHaveBeenCalledWith('warning', 'Invalid Request', 'PascalCase detail');
  });
});
