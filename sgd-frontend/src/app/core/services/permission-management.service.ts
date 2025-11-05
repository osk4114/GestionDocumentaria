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
      'auth': '🔐 Autenticación',
      'users': '👥 Usuarios',
      'roles': '🏷️ Roles',
      'areas': '🏢 Áreas',
      'categories': '📁 Categorías',
      'document_types': '📋 Tipos de Documento',
      'documents': '📄 Documentos',
      'attachments': '📎 Adjuntos',
      'versions': '📚 Versiones',
      'movements': '🔄 Movimientos',
      'reports': '📊 Reportes',
      'system': '⚙️ Sistema'
    };

    return categoryNames[categoria] || categoria.toUpperCase();
  }

  /**
   * Obtener color para categoría
   */
  getCategoryColor(categoria: string): string {
    const categoryColors: { [key: string]: string } = {
      'auth': '#4F46E5',        // Indigo
      'users': '#059669',       // Emerald
      'roles': '#DC2626',       // Red
      'areas': '#2563EB',       // Blue
      'categories': '#7C3AED',  // Violet
      'document_types': '#EA580C', // Orange
      'documents': '#0891B2',   // Cyan
      'attachments': '#65A30D', // Lime
      'versions': '#CA8A04',    // Yellow
      'movements': '#BE185D',   // Pink
      'reports': '#9333EA',     // Purple
      'system': '#374151'       // Gray
    };

    return categoryColors[categoria] || '#6B7280';
  }
}