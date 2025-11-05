import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Servicio de gestión de permisos
 * Maneja la verificación de permisos del usuario actual
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Signal que contiene los permisos del usuario
  private userPermissions = signal<string[]>([]);

  // Observable para directivas que necesitan suscribirse a cambios
  public readonly userPermissions$ = toObservable(this.userPermissions);

  // Computed signal para verificar si hay permisos cargados
  hasPermissionsLoaded = computed(() => this.userPermissions().length > 0);

  constructor() {}

  /**
   * Establecer los permisos del usuario
   * @param permissions Array de códigos de permisos
   */
  setPermissions(permissions: string[]): void {
    this.userPermissions.set(permissions);
    console.log('✅ Permisos cargados:', permissions.length);
  }

  /**
   * Obtener todos los permisos del usuario
   */
  getPermissions(): string[] {
    return this.userPermissions();
  }

  /**
   * Limpiar todos los permisos (logout)
   */
  clearPermissions(): void {
    this.userPermissions.set([]);
    console.log('🔒 Permisos limpiados');
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param permission Código del permiso (ej: 'documents.create')
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  /**
   * Verificar si el usuario tiene AL MENOS UNO de los permisos especificados
   * @param permissions Array de códigos de permisos
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true; // Si no se especifican permisos, se permite el acceso
    }
    return permissions.some(permission => this.userPermissions().includes(permission));
  }

  /**
   * Verificar si el usuario tiene TODOS los permisos especificados
   * @param permissions Array de códigos de permisos
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return permissions.every(permission => this.userPermissions().includes(permission));
  }

  /**
   * Verificar permisos de visualización de documentos
   * Retorna el nivel de acceso más alto del usuario
   */
  getDocumentViewLevel(): 'all' | 'area' | 'own' | 'none' {
    if (this.hasPermission('documents.view.all')) {
      return 'all';
    }
    if (this.hasPermission('documents.view.area')) {
      return 'area';
    }
    if (this.hasPermission('documents.view.own')) {
      return 'own';
    }
    return 'none';
  }

  /**
   * Verificar permisos de edición de documentos
   */
  getDocumentEditLevel(): 'all' | 'area' | 'none' {
    if (this.hasPermission('documents.edit.all')) {
      return 'all';
    }
    if (this.hasPermission('documents.edit.area')) {
      return 'area';
    }
    return 'none';
  }

  /**
   * Verificar permisos de visualización de usuarios
   */
  getUserViewLevel(): 'all' | 'area' | 'own' | 'none' {
    if (this.hasPermission('users.view.all')) {
      return 'all';
    }
    if (this.hasPermission('users.view.area')) {
      return 'area';
    }
    if (this.hasPermission('users.view.own')) {
      return 'own';
    }
    return 'none';
  }

  /**
   * Debug: Listar todos los permisos del usuario en consola
   */
  debugPermissions(): void {
    console.group('🔐 Permisos del Usuario');
    console.log('Total:', this.userPermissions().length);
    console.log('Permisos:', this.userPermissions());
    console.groupEnd();
  }
}
