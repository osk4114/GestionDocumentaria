import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * Angular 17 usa functional guards
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado (solo verifica token local)
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si no está autenticado, redirigir a login
  router.navigate(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

/**
 * Guard para rutas públicas (como login)
 * Redirige al dashboard si ya está autenticado
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir a dashboard
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

// Re-export permissionGuard para acceso unificado
export { permissionGuard } from './permission.guard';
