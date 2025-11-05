/**
 * Barrel export para directivas de permisos
 */
export { HasPermissionDirective } from './has-permission.directive';
export { HasAnyPermissionDirective } from './has-any-permission.directive';
export { HasAllPermissionsDirective } from './has-all-permissions.directive';

import { HasPermissionDirective } from './has-permission.directive';
import { HasAnyPermissionDirective } from './has-any-permission.directive';
import { HasAllPermissionsDirective } from './has-all-permissions.directive';

/**
 * Array con todas las directivas para importar en módulos/componentes
 */
export const PERMISSION_DIRECTIVES = [
  HasPermissionDirective,
  HasAnyPermissionDirective,
  HasAllPermissionsDirective
] as const;
