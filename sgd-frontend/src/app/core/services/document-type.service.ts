import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentType {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
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
export class DocumentTypeService {
  private apiUrl = `${environment.apiUrl}/document-types`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los tipos de documento
   */
  getAll(): Observable<ApiResponse<DocumentType[]>> {
    return this.http.get<ApiResponse<DocumentType[]>>(this.apiUrl);
  }

  /**
   * Obtener tipo por ID
   */
  getById(id: number): Observable<ApiResponse<DocumentType>> {
    return this.http.get<ApiResponse<DocumentType>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo tipo
   */
  create(type: Partial<DocumentType>): Observable<ApiResponse<DocumentType>> {
    return this.http.post<ApiResponse<DocumentType>>(this.apiUrl, type);
  }

  /**
   * Actualizar tipo
   */
  update(id: number, type: Partial<DocumentType>): Observable<ApiResponse<DocumentType>> {
    return this.http.put<ApiResponse<DocumentType>>(`${this.apiUrl}/${id}`, type);
  }

  /**
   * Eliminar tipo
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activar tipo (solo si está inactivo)
   */
  activate(id: number): Observable<ApiResponse<DocumentType>> {
    return this.http.patch<ApiResponse<DocumentType>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Desactivar tipo (soft delete)
   */
  deactivate(id: number): Observable<ApiResponse<DocumentType>> {
    return this.http.patch<ApiResponse<DocumentType>>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  /**
   * Obtener solo tipos activos
   */
  getActive(): Observable<ApiResponse<DocumentType[]>> {
    return this.http.get<ApiResponse<DocumentType[]>>(`${this.apiUrl}/active`);
  }
}
