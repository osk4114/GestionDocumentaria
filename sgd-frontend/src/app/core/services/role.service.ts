import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  es_sistema?: boolean;
  puede_asignar_permisos?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface CreateRoleRequest {
  nombre: string;
  descripcion?: string;
  puede_asignar_permisos?: boolean;
  permisos?: number[]; // IDs de permisos seleccionados
}

export interface UpdateRoleRequest {
  nombre?: string;
  descripcion?: string;
  puede_asignar_permisos?: boolean;
  permisos?: number[]; // IDs de permisos seleccionados
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
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los roles
   */
  getAll(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.apiUrl);
  }

  /**
   * Obtener rol por ID
   */
  getById(id: number): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo rol
   */
  create(roleData: CreateRoleRequest): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, roleData);
  }

  /**
   * Actualizar rol
   */
  update(id: number, roleData: UpdateRoleRequest): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, roleData);
  }

  /**
   * Eliminar rol
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
