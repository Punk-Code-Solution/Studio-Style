import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Lista de endpoints públicos que não precisam de token
  const publicEndpoints = ['/api/auth/login', '/api/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (!isPublicEndpoint) {
    // Só loga warning se não for um endpoint público
    console.warn('No token found for request to:', req.url);
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 || err.status === 403) {
        console.error('Authentication error:', err.status, err.url);
        console.error('Error details:', err.error);
        // Não fazer logout automático para não interromper o fluxo
        // authService.logout();
      }
      return throwError(() => err);
    })
  );
};


