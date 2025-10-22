import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor para manejar errores HTTP y refresh automático de tokens
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Error 401 - Token expirado o sesión inválida
      if (error.status === 401) {
        
        // Si es login o refresh, no hacer nada especial
        if (req.url.includes('/login') || req.url.includes('/register')) {
          return throwError(() => error);
        }

        // Verificar si la sesión fue cerrada desde otro dispositivo
        const errorMessage = error.error?.message || '';
        
        if (errorMessage.includes('Sesión inválida') || 
            errorMessage.includes('Sesión cerrada') ||
            errorMessage.includes('sesión no encontrada')) {
          // 🔒 Sesión cerrada desde otro dispositivo - NO intentar refresh
          console.warn('🚨 Tu sesión fue cerrada desde otro dispositivo');
          authService.logout();
          router.navigate(['/login'], { 
            queryParams: { reason: 'session-closed' } 
          });
          return throwError(() => error);
        }

        // Si el token expiró normalmente, intentar refresh
        if (!req.url.includes('/refresh')) {
          return authService.refreshToken().pipe(
            switchMap(() => {
              // Retry la petición original con el nuevo token
              const token = authService.getToken();
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`
                }
              });
              return next(clonedReq);
            }),
            catchError(refreshError => {
              // Si el refresh falla, redirigir a login
              console.warn('🔄 Refresh token falló - Redirigiendo al login');
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        }
      }

      // Error 403 - Permisos insuficientes
      if (error.status === 403) {
        console.error('❌ Acceso denegado - Permisos insuficientes');
        router.navigate(['/dashboard']);
      }

      // Error 429 - Rate limiting
      if (error.status === 429) {
        console.error('⏱️ Demasiadas peticiones - Espere un momento');
      }

      // Error 500 - Error del servidor
      if (error.status === 500) {
        console.error('🔥 Error del servidor - Intente nuevamente');
      }

      return throwError(() => error);
    })
  );
};
