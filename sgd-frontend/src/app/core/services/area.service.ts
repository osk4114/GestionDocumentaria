import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Area {
  id: number;
  nombre: string;
  sigla: string;
  descripcion?: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AreaStats {
  totalDocumentos: number;
  documentosActivos: number;
  documentosArchivados: number;
  usuarios: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private apiUrl = `${environment.apiUrl}/areas`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las áreas
   */
  getAll(): Observable<ApiResponse<Area[]>> {
    return this.http.get<ApiResponse<Area[]>>(this.apiUrl);
  }

  /**
   * Obtener área por ID
   */
  getById(id: number): Observable<ApiResponse<Area>> {
    return this.http.get<ApiResponse<Area>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nueva área
   */
  create(area: Partial<Area>): Observable<ApiResponse<Area>> {
    return this.http.post<ApiResponse<Area>>(this.apiUrl, area);
  }

  /**
   * Actualizar área
   */
  update(id: number, area: Partial<Area>): Observable<ApiResponse<Area>> {
    return this.http.put<ApiResponse<Area>>(`${this.apiUrl}/${id}`, area);
  }

  /**
   * Eliminar área
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activar área
   */
  activate(id: number): Observable<ApiResponse<Area>> {
    return this.http.patch<ApiResponse<Area>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Desactivar área
   */
  deactivate(id: number): Observable<ApiResponse<Area>> {
    return this.http.patch<ApiResponse<Area>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Obtener estadísticas del área
   */
  getStats(id: number): Observable<ApiResponse<AreaStats>> {
    return this.http.get<ApiResponse<AreaStats>>(`${this.apiUrl}/${id}/stats`);
  }
}
