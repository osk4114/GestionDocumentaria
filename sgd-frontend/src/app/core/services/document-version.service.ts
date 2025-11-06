import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  descripcion?: string;
  tieneSello: boolean;
  tieneFirma: boolean;
  uploadedBy: number;
  areaId: number;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    nombre: string;
    email: string;
  };
  area?: {
    id: number;
    nombre: string;
    sigla: string;
  };
}

export interface VersionUploadData {
  file: File;
  descripcion?: string;
  tieneSello: boolean;
  tieneFirma: boolean;
}

export interface VersionsResponse {
  success: boolean;
  count?: number;
  data: DocumentVersion | DocumentVersion[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentVersionService {
  private apiUrl = `${environment.apiUrl}/documents`;

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las versiones de un documento
   * GET /api/documents/:documentId/versions
   */
  getVersions(documentId: number): Observable<VersionsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<VersionsResponse>(`${this.apiUrl}/${documentId}/versions`).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtener última versión de un documento
   * GET /api/documents/:documentId/versions/latest
   */
  getLatestVersion(documentId: number): Observable<VersionsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<VersionsResponse>(`${this.apiUrl}/${documentId}/versions/latest`).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Subir nueva versión de documento
   * POST /api/documents/:documentId/versions
   */
  uploadVersion(documentId: number, data: VersionUploadData): Observable<VersionsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', data.file);
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }
    formData.append('tieneSello', String(data.tieneSello));
    formData.append('tieneFirma', String(data.tieneFirma));

    return this.http.post<VersionsResponse>(`${this.apiUrl}/${documentId}/versions`, formData).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtener versión específica por ID
   * GET /api/documents/versions/:id
   */
  getVersionById(versionId: number): Observable<VersionsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<VersionsResponse>(`${this.apiUrl}/versions/${versionId}`).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Descargar versión específica
   * GET /api/documents/versions/:id/download
   */
  downloadVersion(versionId: number, originalName: string): void {
    const url = `${this.apiUrl}/versions/${versionId}/download`;
    
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Crear URL temporal y descargar
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Error al descargar versión:', error);
        this.error.set('Error al descargar el archivo');
      }
    });
  }

  /**
   * Eliminar versión
   * DELETE /api/documents/versions/:id
   */
  deleteVersion(versionId: number): Observable<VersionsResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<VersionsResponse>(`${this.apiUrl}/versions/${versionId}`).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
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
   * Manejo de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loading.set(false);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Solicitud inválida';
            break;
          case 403:
            errorMessage = 'No tiene permisos para realizar esta acción';
            break;
          case 404:
            errorMessage = 'Versión no encontrada';
            break;
          case 500:
            errorMessage = 'Error en el servidor';
            break;
        }
      }
    }

    this.error.set(errorMessage);
    console.error('Error en DocumentVersionService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
