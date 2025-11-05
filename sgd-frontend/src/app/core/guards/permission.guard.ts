import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren permisos específicos
 * 
 * Uso en routes:
 * {
 *   path: 'users',
 *   component: UserListComponent,
 *   canActivate: [permissionGuard],
 *   data: { 
 *     requiredPermission: 'users.view.all',
 *     redirectTo: '/dashboard' // Opcional: ruta de redirección
 *   }
 * }
 * 
 * Para múltiples permisos (requiere al menos uno):
 * data: { requiredPermissions: ['users.view.all', 'users.view.area'] }
 * 
 * Para requerir todos los permisos:
 * data: { 
 *   requiredPermissions: ['users.view.all', 'users.edit.all'],
 *   requireAll: true 
 * }
 */
export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar que el usuario esté autenticado
  if (!authService.isAuthenticated()) {
    console.warn('🚫 PermissionGuard: Usuario no autenticado');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Obtener configuración de permisos desde route data
  const requiredPermission = route.data['requiredPermission'] as string | undefined;
  const requiredPermissions = route.data['requiredPermissions'] as string[] | undefined;
  const requireAll = route.data['requireAll'] as boolean | undefined;
  const redirectTo = route.data['redirectTo'] as string || '/dashboard';

  // Caso 1: Permiso único
  if (requiredPermission) {
    const hasPermission = permissionService.hasPermission(requiredPermission);
    
    if (!hasPermission) {
      console.warn(`🚫 PermissionGuard: Permiso requerido no encontrado: ${requiredPermission}`);
      router.navigate([redirectTo], { 
        queryParams: { 
          error: 'no_permission',
          required: requiredPermission 
        } 
      });
      return false;
    }

    console.log(`✅ PermissionGuard: Permiso ${requiredPermission} verificado`);
    return true;
  }

  // Caso 2: Múltiples permisos
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requireAll
      ? permissionService.hasAllPermissions(requiredPermissions)
      : permissionService.hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      const mode = requireAll ? 'todos' : 'al menos uno de';
      console.warn(`🚫 PermissionGuard: Se requiere ${mode}: ${requiredPermissions.join(', ')}`);
      router.navigate([redirectTo], { 
        queryParams: { 
          error: 'no_permission',
          required: requiredPermissions.join(',')
        } 
      });
      return false;
    }

    console.log(`✅ PermissionGuard: Permisos verificados (${requireAll ? 'todos' : 'al menos uno'})`);
    return true;
  }

  // Caso 3: No hay permisos configurados - permitir acceso
  console.warn('⚠️ PermissionGuard: No hay permisos configurados en la ruta, permitiendo acceso');
  return true;
};
