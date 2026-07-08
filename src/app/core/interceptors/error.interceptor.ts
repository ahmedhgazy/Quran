import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        const isAuthEndpoint =
          req.url.includes('/api/auth/login') ||
          req.url.includes('/api/auth/register') ||
          req.url.includes('/api/auth/refresh');

        if (error.status === 401 && !isAuthEndpoint) {
          return throwError(() => error);
        }

        const isExpected404 =
          req.method === 'GET' &&
          (req.url.includes('/api/users/me/khatm-plan') ||
            req.url.includes('/api/users/me/last-read'));

        if (error.status === 404 && isExpected404) {
          return throwError(() => error);
        }

        let message = 'An unexpected error occurred.';
        let title = 'Error';
        let type: 'error' | 'warning' | 'info' | 'success' = 'error';

        switch (error.status) {
          case 0:
            title = 'Connection Error';
            message = 'Connection lost. Please check your internet connection.';
            type = 'error';
            break;
          case 400:
            title = 'Invalid Request';
            message = extractMessage(error) || 'Please check your inputs and try again.';
            type = 'warning';
            break;
          case 401:
            title = 'Unauthorized';
            message = extractMessage(error) || 'Session expired. Please log in again.';
            type = 'warning';
            break;
          case 403:
            title = 'Access Denied';
            message = 'You do not have permission to perform this action.';
            type = 'error';
            break;
          case 404:
            title = 'Not Found';
            message = 'The requested resource was not found.';
            type = 'warning';
            break;
          case 409:
            title = 'Conflict';
            message = extractMessage(error) || 'A conflict occurred. Please try again.';
            type = 'warning';
            break;
          default:
            if (error.status >= 500) {
              title = 'Server Error';
              message = 'Something went wrong on our server. Please try again later.';
              type = 'error';
            } else {
              message = extractMessage(error) || message;
            }
            break;
        }

        toastService.show(type, title, message);
      }

      return throwError(() => error);
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string | null {
  const body = error.error;
  if (!body) return null;

  if (typeof body === 'string') return body;

  return body.detail || body.Detail || body.title || body.Title || null;
}
