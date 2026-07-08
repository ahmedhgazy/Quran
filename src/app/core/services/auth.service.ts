import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthResponse } from '../models/api.models';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, share } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.getStoredToken());
  private readonly _username = signal<string | null>(this.getStored('quran_username'));
  private readonly _email = signal<string | null>(this.getStored('quran_email'));

  readonly token = this._token.asReadonly();
  readonly username = this._username.asReadonly();
  readonly email = this._email.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  private refreshInProgress$: Observable<string> | null = null;

  login(email: string, password: string): void {
    this.api.login(email, password).subscribe({
      next: (res) => this.handleAuth(res, true),
      error: (err) => console.error('Login failed', err),
    });
  }

  loginWithGoogle(idToken: string): void {
    this.api.loginWithGoogle(idToken).subscribe({
      next: (res) => this.handleAuth(res, true),
      error: (err) => console.error('Google Login failed', err),
    });
  }

  register(username: string, email: string, password: string): void {
    this.api.register(username, email, password).subscribe({
      next: (res) => this.handleAuth(res, true),
      error: (err) => console.error('Registration failed', err),
    });
  }

  checkEmail(email: string): Observable<{ exists: boolean }> {
    return this.api.checkEmail(email);
  }

  refresh(): Observable<string> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    this.refreshInProgress$ = this.api.refresh().pipe(
      map((res) => {
        this.handleAuth(res, false);
        return res.token;
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      share(),
    );

    return this.refreshInProgress$;
  }

  logout(): void {
    this.api.revoke().subscribe({
      error: (err) => console.error('Token revocation failed', err),
    });

    localStorage.removeItem('quran_token');
    localStorage.removeItem('quran_username');
    localStorage.removeItem('quran_email');
    this._token.set(null);
    this._username.set(null);
    this._email.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuth(res: AuthResponse, redirect = true): void {
    localStorage.setItem('quran_token', res.token);
    localStorage.setItem('quran_username', res.username);
    localStorage.setItem('quran_email', res.email);
    this._token.set(res.token);
    this._username.set(res.username);
    this._email.set(res.email);
    if (redirect) {
      this.router.navigate(['/profile']);
    }
  }

  private getStoredToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('quran_token') : null;
  }

  private getStored(key: string): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
}
