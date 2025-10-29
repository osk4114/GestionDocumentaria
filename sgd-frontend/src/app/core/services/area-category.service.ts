import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AreaCategory {
  id: number;
  areaId: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  color: string;
  icono: string;
  orden: number;
  requiereAdjunto: boolean;
  isActive: boolean;
  createdBy: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AreaCategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/areas`;

  /**
   * Obtener categorías de un área específica
   */
  getCategoriesByArea(areaId: number): Observable<ApiResponse<AreaCategory[]>> {
    return this.http.get<ApiResponse<AreaCategory[]>>(`${this.apiUrl}/${areaId}/categories`);
  }

  /**
   * Obtener una categoría por ID
   */
  getCategoryById(categoryId: number): Observable<ApiResponse<AreaCategory>> {
    return this.http.get<ApiResponse<AreaCategory>>(`${this.apiUrl}/categories/${categoryId}`);
  }

  /**
   * Crear nueva categoría
   */
  createCategory(areaId: number, categoryData: Partial<AreaCategory>): Observable<ApiResponse<AreaCategory>> {
    return this.http.post<ApiResponse<AreaCategory>>(`${this.apiUrl}/${areaId}/categories`, categoryData);
  }

  /**
   * Actualizar categoría existente
   */
  updateCategory(categoryId: number, categoryData: Partial<AreaCategory>): Observable<ApiResponse<AreaCategory>> {
    return this.http.put<ApiResponse<AreaCategory>>(`${this.apiUrl}/categories/${categoryId}`, categoryData);
  }

  /**
   * Reordenar categorías
   */
  reorderCategories(areaId: number, categories: { id: number; orden: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${areaId}/categories/reorder`, { categories });
  }

  /**
   * Toggle activo/inactivo
   */
  toggleCategory(categoryId: number): Observable<ApiResponse<AreaCategory>> {
    return this.http.patch<ApiResponse<AreaCategory>>(`${this.apiUrl}/categories/${categoryId}/toggle`, {});
  }

  /**
   * Eliminar categoría
   */
  deleteCategory(categoryId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/categories/${categoryId}`);
  }
}
