import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

/**
 * Interceptor para agregar el token JWT a todas las peticiones
 * Angular 17 usa functional interceptors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const token = storage.getToken();

  // Si hay token y no es una petición de login/register/refresh, agregarlo
  if (token && !req.url.includes('/login') && !req.url.includes('/register')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
