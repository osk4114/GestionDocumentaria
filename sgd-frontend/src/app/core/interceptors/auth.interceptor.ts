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

  // Rutas públicas que NO necesitan autenticación
  const publicRoutes = [
    '/login',
    '/register',
    '/refresh',
    '/submit',           // Mesa de Partes Virtual
    '/tracking/',        // Seguimiento público
    '/document-types'    // Tipos de documento
  ];

  // Verificar si la URL es pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Si hay token y NO es una ruta pública, agregarlo
  if (token && !isPublicRoute) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
