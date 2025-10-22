import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas según roles de usuario
 * Uso: canActivate: [roleGuard], data: { roles: ['Administrador', 'Mesa de Partes'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado primero
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Obtener roles permitidos de la ruta
  const allowedRoles = route.data['roles'] as string[];
  
  if (!allowedRoles || allowedRoles.length === 0) {
    // Si no hay roles especificados, permitir acceso
    return true;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  if (authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  // Si no tiene permisos, redirigir al dashboard
  console.warn(`Acceso denegado - Roles requeridos: ${allowedRoles.join(', ')}`);
  router.navigate(['/dashboard']);
  return false;
};
