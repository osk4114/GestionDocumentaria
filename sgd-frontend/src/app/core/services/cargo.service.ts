import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentCargo {
  id: number;
  areaId: number;
  versionId: number;
  customName?: string;
  createdBy: number;
  created_at: string;
  updated_at: string;
  
  // Relaciones populated
  area?: {
    id: number;
    nombre: string;
    sigla: string;
  };
  version?: {
    id: number;
    documentId: number;
    versionNumber: number;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    descripcion?: string;
    tieneSello: boolean;
    tieneFirma: boolean;
    document?: {
      id: number;
      nro_documento: string;
      asunto: string;
      trackingCode: string;
    };
  };
  creator?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export interface CargoResponse {
  success: boolean;
  data?: DocumentCargo | DocumentCargo[];
  count?: number;
  message?: string;
}

export interface CreateCargoData {
  versionId: number;
  customName?: string;
}

export interface UpdateCargoData {
  customName: string;
}

@Injectable({
  providedIn: 'root'
})
export class CargoService {
  private apiUrl = `${environment.apiUrl}/cargos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los cargos del área del usuario actual
   */
  getCargosByArea(): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener un cargo específico por ID
   */
  getCargoById(cargoId: number): Observable<CargoResponse> {
    return this.http.get<CargoResponse>(`${this.apiUrl}/${cargoId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo cargo (conservar versión)
   */
  createCargo(data: CreateCargoData): Observable<CargoResponse> {
    return this.http.post<CargoResponse>(this.apiUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar nombre personalizado de un cargo
   */
  updateCargoName(cargoId: number, data: UpdateCargoData): Observable<CargoResponse> {
    return this.http.patch<CargoResponse>(`${this.apiUrl}/${cargoId}`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un cargo
   */
  deleteCargo(cargoId: number): Observable<CargoResponse> {
    return this.http.delete<CargoResponse>(`${this.apiUrl}/${cargoId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener nombre de display del cargo
   * Si tiene customName, usar ese; sino usar nombre del documento
   */
  getDisplayName(cargo: DocumentCargo): string {
    if (cargo.customName) {
      return cargo.customName;
    }
    
    if (cargo.version?.document?.nro_documento) {
      return `${cargo.version.document.nro_documento} - v${cargo.version.versionNumber}`;
    }
    
    return `Cargo #${cargo.id}`;
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      } else if (error.status === 404) {
        errorMessage = 'Cargo no encontrado';
      } else if (error.status === 409) {
        errorMessage = 'Este cargo ya existe en tu área';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Por favor, intenta más tarde';
      }
    }
    
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}
