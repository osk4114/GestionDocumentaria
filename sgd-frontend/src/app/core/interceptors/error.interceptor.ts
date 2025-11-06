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
      console.log('🔍 [ERROR INTERCEPTOR] Capturado error HTTP:');
      console.log('   URL:', req.url);
      console.log('   Status:', error.status);
      console.log('   Message:', error.error?.message || error.message);
      console.log('   Error completo:', error);
      
      // Error 401 - Token expirado o sesión inválida
      if (error.status === 401) {
        console.log('⚠️ [ERROR INTERCEPTOR] Error 401 detectado');
        
        // Rutas públicas - no redirigir al login
        const publicRoutes = ['/login', '/register', '/submit', '/tracking/', '/document-types/active'];
        const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
        
        if (isPublicRoute) {
          console.log('ℹ️ [ERROR INTERCEPTOR] Ruta pública, no se redirige');
          return throwError(() => error);
        }

        // Verificar si la sesión fue cerrada desde otro dispositivo
        const errorMessage = error.error?.message || '';
        console.log('📋 [ERROR INTERCEPTOR] Mensaje de error:', errorMessage);
        
        if (errorMessage.includes('Sesión inválida') || 
            errorMessage.includes('Sesión cerrada') ||
            errorMessage.includes('sesión no encontrada')) {
          // 🔒 Sesión cerrada desde otro dispositivo - NO intentar refresh
          console.warn('🚨 [ERROR INTERCEPTOR] Sesión inválida detectada - cerrando sesión');
          console.warn('   Razón:', errorMessage);
          authService.logout(true); // Redirigir al login
          return throwError(() => error);
        }

        // Si el token expiró normalmente, intentar refresh
        if (!req.url.includes('/refresh')) {
          console.log('🔄 [ERROR INTERCEPTOR] Intentando refresh del token...');
          return authService.refreshToken().pipe(
            switchMap(() => {
              console.log('✅ [ERROR INTERCEPTOR] Refresh exitoso, reintentando petición original');
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
              console.error('❌ [ERROR INTERCEPTOR] Refresh falló:');
              console.error('   Status:', refreshError.status);
              console.error('   Message:', refreshError.error?.message || refreshError.message);
              console.warn('🔄 [ERROR INTERCEPTOR] Redirigiendo al login');
              authService.logout(true); // Redirigir al login
              return throwError(() => refreshError);
            })
          );
        } else {
          console.log('⚠️ [ERROR INTERCEPTOR] Error en endpoint de refresh, no se reintenta');
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
