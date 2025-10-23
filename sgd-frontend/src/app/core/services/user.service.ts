import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserAdmin {
  id: number;
  nombre: string;
  email: string;
  rolId: number;
  areaId?: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
  role?: {
    id: number;
    nombre: string;
  };
  area?: {
    id: number;
    nombre: string;
    sigla: string;
  };
}

export interface CreateUserData {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
  areaId?: number;
}

export interface UpdateUserData {
  nombre?: string;
  email?: string;
  password?: string;
  rolId?: number;
  areaId?: number;
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
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   */
  getAll(): Observable<ApiResponse<UserAdmin[]>> {
    return this.http.get<ApiResponse<UserAdmin[]>>(this.apiUrl);
  }

  /**
   * Obtener usuarios por área
   */
  getByArea(areaId: number): Observable<ApiResponse<UserAdmin[]>> {
    return this.http.get<ApiResponse<UserAdmin[]>>(`${this.apiUrl}?area=${areaId}`);
  }

  /**
   * Obtener usuario por ID
   */
  getById(id: number): Observable<ApiResponse<UserAdmin>> {
    return this.http.get<ApiResponse<UserAdmin>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo usuario
   */
  create(user: CreateUserData): Observable<ApiResponse<UserAdmin>> {
    return this.http.post<ApiResponse<UserAdmin>>(this.apiUrl, user);
  }

  /**
   * Actualizar usuario
   */
  update(id: number, user: UpdateUserData): Observable<ApiResponse<UserAdmin>> {
    return this.http.put<ApiResponse<UserAdmin>>(`${this.apiUrl}/${id}`, user);
  }

  /**
   * Eliminar usuario
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activar usuario
   */
  activate(id: number): Observable<ApiResponse<UserAdmin>> {
    return this.http.patch<ApiResponse<UserAdmin>>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Desactivar usuario
   */
  deactivate(id: number): Observable<ApiResponse<UserAdmin>> {
    return this.http.patch<ApiResponse<UserAdmin>>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
