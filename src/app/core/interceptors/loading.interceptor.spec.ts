import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';
import { provideRouter } from '@angular/router';
import { withInterceptors } from '@angular/common/http';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should set loading to true when a request starts', () => {
    http.get('/api/test').subscribe();
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/test').flush({});
  });

  it('should set loading to false when a request completes', () => {
    http.get('/api/test').subscribe();
    httpMock.expectOne('/api/test').flush({});

    expect(loadingService.isLoading()).toBe(false);
  });

  it('should set loading to false even when a request errors', () => {
    http.get('/api/test').subscribe({
      error: () => { /* expected */ },
    });

    httpMock.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(loadingService.isLoading()).toBe(false);
  });

  it('should track multiple concurrent requests', () => {
    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();

    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/a').flush({});
    expect(loadingService.isLoading()).toBe(true);

    httpMock.expectOne('/api/b').flush({});
    expect(loadingService.isLoading()).toBe(false);
  });
});
