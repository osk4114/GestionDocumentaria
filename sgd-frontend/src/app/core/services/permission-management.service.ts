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
  private readonly API_URL = `${environment.apiUrl}/permissions`;

  // Signals para estado reactivo
  availablePermissions = signal<Permission[]>([]);
  groupedPermissions = signal<GroupedPermissions>({});
  loading = signal(false);

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los permisos disponibles (filtrados por usuario)
   * Usa /api/permissions/grouped que filtra automáticamente según el rol del usuario:
   * - Jefe de Área: solo area_management
   * - Admin: todas las categorías
   */
  getAllPermissions(): Observable<PermissionsResponse> {
    this.loading.set(true);
    return this.http.get<PermissionsResponse>(`${this.API_URL}/grouped`);
  }

  /**
   * Cargar permisos en el servicio
   * Llama a /api/permissions/grouped que devuelve permisos filtrados según rol:
   * - Jefe de Área: solo categoría area_management (42 permisos)
   * - Admin: todas las categorías (127 permisos)
   */
  loadPermissions(): void {
    this.getAllPermissions().subscribe({
      next: (response) => {
        if (response.success) {
          this.availablePermissions.set(response.data);
          this.groupedPermissions.set(response.grouped);
          console.log('✅ [PERMISOS FRONTEND] Permisos cargados:', Object.keys(response.grouped).length, 'categorías');
          console.log('📊 [PERMISOS FRONTEND] Categorías:', Object.keys(response.grouped).join(', '));
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ [PERMISOS FRONTEND] Error cargando permisos:', error);
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
   * Obtener todas las categorías disponibles en orden lógico
   */
  getCategories(): string[] {
    // Orden lógico: Sistema → Usuarios → Estructura → Tipos → Documentos → Flujo → Análisis
    const categoryOrder = [
      'auth',           // 1. Autenticación (base del sistema)
      'users',          // 2. Usuarios
      'roles',          // 3. Roles
      'areas',          // 4. Áreas
      'area_management',// 5. Gestión de Área (Jefe de Área)
      'categories',     // 6. Categorías por área
      'document_types', // 7. Tipos de documento
      'documents',      // 8. Gestión documental
      'attachments',    // 9. Archivos adjuntos
      'versions',       // 10. Versiones
      'movements',      // 11. Movimientos/Derivaciones
      'reports',        // 12. Reportes
      'system'          // 13. Sistema (configuración avanzada)
    ];
    
    const availableCategories = Object.keys(this.groupedPermissions());
    
    // Ordenar según categoryOrder, manteniendo categorías no listadas al final
    return availableCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
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
      'area_management': 'Jefe de Área',
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
      'area_management': '💼',
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
      'area_management': '#0369a1', // Sky (destacado)
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