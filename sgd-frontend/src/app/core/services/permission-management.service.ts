import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface Permission {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface GroupedPermissions {
  [categoria: string]: Permission[];
}

export interface PermissionsResponse {
  success: boolean;
  count: number;
  data: Permission[];
  grouped: GroupedPermissions;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionManagementService {
  private readonly API_URL = `${environment.apiUrl}/roles`;

  // Signals para estado reactivo
  availablePermissions = signal<Permission[]>([]);
  groupedPermissions = signal<GroupedPermissions>({});
  loading = signal(false);

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los permisos disponibles
   */
  getAllPermissions(): Observable<PermissionsResponse> {
    this.loading.set(true);
    return this.http.get<PermissionsResponse>(`${this.API_URL}/permissions`);
  }

  /**
   * Cargar permisos en el servicio
   */
  loadPermissions(): void {
    this.getAllPermissions().subscribe({
      next: (response) => {
        if (response.success) {
          this.availablePermissions.set(response.data);
          this.groupedPermissions.set(response.grouped);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando permisos:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Obtener permisos por categoría
   */
  getPermissionsByCategory(categoria: string): Permission[] {
    return this.groupedPermissions()[categoria] || [];
  }

  /**
   * Obtener todas las categorías disponibles
   */
  getCategories(): string[] {
    return Object.keys(this.groupedPermissions()).sort();
  }

  /**
   * Formatear nombre de categoría para mostrar
   */
  formatCategoryName(categoria: string): string {
    const categoryNames: { [key: string]: string } = {
      'auth': 'Autenticación',
      'users': 'Usuarios',
      'roles': 'Roles',
      'areas': 'Áreas',
      'categories': 'Categorías',
      'document_types': 'Tipos de Documento',
      'documents': 'Documentos',
      'attachments': 'Adjuntos',
      'versions': 'Versiones',
      'movements': 'Movimientos',
      'reports': 'Reportes',
      'system': 'Sistema'
    };

    return categoryNames[categoria] || categoria.toUpperCase();
  }

  /**
   * Obtener icono para categoría (sin emoji)
   */
  getCategoryIcon(categoria: string): string {
    const categoryIcons: { [key: string]: string } = {
      'auth': '🔐',
      'users': '👤',
      'roles': '👥',
      'areas': '🏢',
      'categories': '🏷️',
      'document_types': '📋',
      'documents': '📄',
      'attachments': '📎',
      'versions': '📚',
      'movements': '↔️',
      'reports': '📊',
      'system': '⚙️'
    };

    return categoryIcons[categoria] || '📦';
  }

  /**
   * Obtener color para categoría (tonos más sobrios)
   */
  getCategoryColor(categoria: string): string {
    const categoryColors: { [key: string]: string } = {
      'auth': '#475569',        // Slate
      'users': '#64748b',       // Slate light
      'roles': '#78716c',       // Stone
      'areas': '#52525b',       // Zinc
      'categories': '#71717a',  // Zinc light
      'document_types': '#737373', // Neutral
      'documents': '#6b7280',   // Gray
      'attachments': '#57534e', // Stone dark
      'versions': '#6b7280',    // Gray
      'movements': '#78716c',   // Stone
      'reports': '#64748b',     // Slate light
      'system': '#374151'       // Gray dark
    };

    return categoryColors[categoria] || '#6B7280';
  }
}