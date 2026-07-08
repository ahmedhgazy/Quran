import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { AuthResponse } from '../models/api.models';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let apiService: ApiService;
  let router: Router;
  let httpMock: HttpTestingController;

  const mockAuthResponse: AuthResponse = {
    token: 'jwt-test-token',
    expiresAt: '2026-12-31T23:59:59Z',
    username: 'ahmed',
    email: 'ahmed@test.com',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should not be authenticated when no token is stored', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.token()).toBeNull();
      expect(service.username()).toBeNull();
      expect(service.email()).toBeNull();
    });

    it('should be authenticated when a token exists in localStorage', () => {
      localStorage.setItem('quran_token', 'stored-token');
      localStorage.setItem('quran_username', 'stored-user');
      localStorage.setItem('quran_email', 'stored@test.com');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: Router, useValue: { navigate: vi.fn() } },
        ],
      });
      const freshService = TestBed.inject(AuthService);

      expect(freshService.isAuthenticated()).toBe(true);
      expect(freshService.token()).toBe('stored-token');
      expect(freshService.username()).toBe('stored-user');
      expect(freshService.email()).toBe('stored@test.com');
    });
  });

  describe('login()', () => {
    it('should store credentials and navigate to /profile on success', () => {
      vi.spyOn(apiService, 'login').mockReturnValue(of(mockAuthResponse));

      service.login('ahmed@test.com', 'password');

      expect(service.token()).toBe('jwt-test-token');
      expect(service.username()).toBe('ahmed');
      expect(service.email()).toBe('ahmed@test.com');
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('quran_token')).toBe('jwt-test-token');
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('should not crash on login failure', () => {
      vi.spyOn(apiService, 'login').mockReturnValue(throwError(() => new Error('Network error')));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => service.login('bad@test.com', 'wrong')).not.toThrow();
      expect(service.isAuthenticated()).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('register()', () => {
    it('should store credentials and navigate to /profile on success', () => {
      vi.spyOn(apiService, 'register').mockReturnValue(of(mockAuthResponse));

      service.register('ahmed', 'ahmed@test.com', 'password');

      expect(service.isAuthenticated()).toBe(true);
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('loginWithGoogle()', () => {
    it('should handle Google login and store credentials', () => {
      vi.spyOn(apiService, 'loginWithGoogle').mockReturnValue(of(mockAuthResponse));

      service.loginWithGoogle('google-id-token');

      expect(service.isAuthenticated()).toBe(true);
      expect(service.username()).toBe('ahmed');
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('logout()', () => {
    it('should clear all stored data and navigate to /login', () => {
      vi.spyOn(apiService, 'login').mockReturnValue(of(mockAuthResponse));
      service.login('ahmed@test.com', 'password');
      expect(service.isAuthenticated()).toBe(true);

      vi.spyOn(apiService, 'revoke').mockReturnValue(of(undefined as any));
      service.logout();

      expect(service.token()).toBeNull();
      expect(service.username()).toBeNull();
      expect(service.email()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('quran_token')).toBeNull();
      expect(localStorage.getItem('quran_username')).toBeNull();
      expect(localStorage.getItem('quran_email')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('refresh()', () => {
    it('should update the token silently without redirecting', () => {
      const refreshResponse: AuthResponse = {
        ...mockAuthResponse,
        token: 'refreshed-token',
      };
      vi.spyOn(apiService, 'refresh').mockReturnValue(of(refreshResponse));

      service.refresh().subscribe((newToken) => {
        expect(newToken).toBe('refreshed-token');
      });

      expect(service.token()).toBe('refreshed-token');
      expect(router.navigate).not.toHaveBeenCalledWith(['/profile']);
    });

    it('should logout on refresh failure', () => {
      vi.spyOn(apiService, 'refresh').mockReturnValue(throwError(() => new Error('Token expired')));
      vi.spyOn(apiService, 'revoke').mockReturnValue(of(undefined as any));

      service.refresh().subscribe({
        error: () => {
          expect(service.isAuthenticated()).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
        },
      });
    });

    it('should share a single in-flight refresh observable', () => {
      vi.spyOn(apiService, 'refresh').mockReturnValue(of(mockAuthResponse));

      const obs1 = service.refresh();
      const obs2 = service.refresh();

      expect(obs1).toBe(obs2);
    });
  });

  describe('checkEmail()', () => {
    it('should delegate to ApiService.checkEmail', () => {
      const spy = vi.spyOn(apiService, 'checkEmail').mockReturnValue(of({ exists: true }));

      service.checkEmail('ahmed@test.com').subscribe((result) => {
        expect(result.exists).toBe(true);
      });

      expect(spy).toHaveBeenCalledWith('ahmed@test.com');
    });
  });
});
