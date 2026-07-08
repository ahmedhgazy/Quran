import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/api/auth/login') &&
        !req.url.includes('/api/auth/register') &&
        !req.url.includes('/api/auth/refresh')
      ) {
        return authService.refresh().pipe(
          switchMap((newToken) => {
            const retriedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retriedReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
