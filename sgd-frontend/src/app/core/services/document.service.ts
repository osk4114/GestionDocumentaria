import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sender {
  tipoPersona?: 'natural' | 'juridica';
  nombreCompleto?: string;
  tipoDocumento?: 'DNI' | 'RUC' | 'PASAPORTE' | 'CARNET_EXTRANJERIA' | 'CE';
  numeroDocumento?: string;
  email: string;
  telefono: string;
  direccion?: string;
  
  // Campos persona natural
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  
  // Campos persona jurídica
  ruc?: string;
  nombreEmpresa?: string;
  
  // Representante legal (persona jurídica)
  representanteTipoDoc?: 'DNI' | 'CE' | 'PASAPORTE';
  representanteNumDoc?: string;
  representanteNombres?: string;
  representanteApellidoPaterno?: string;
  representanteApellidoMaterno?: string;
  
  // Dirección detallada
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccionCompleta?: string;
}

export interface DocumentSubmission {
  tipoPersona: 'natural' | 'juridica';
  email: string;
  telefono: string;
  asunto: string;
  descripcion?: string;
  linkDescarga?: string;
}

export interface DocumentResponse {
  success: boolean;
  message: string;
  data: {
    document: any;
    sender: any;
    trackingCode: string;
  };
}

export interface TrackingResponse {
  success: boolean;
  data: {
    id: number;
    trackingCode: string;
    asunto: string;
    created_at: string;
    sender: {
      nombreCompleto: string;
    };
    documentType: {
      nombre: string;
    };
    status: {
      nombre: string;
      color: string;
    };
    movements: Array<{
      id: number;
      accion: string;
      observacion: string;
      timestamp: string;
      fromArea: {
        nombre: string;
        sigla: string;
      } | null;
      toArea: {
        nombre: string;
        sigla: string;
      };
    }>;
  };
}

export interface DocumentFilters {
  area?: number;
  status?: number;
  documentType?: number;
  archived?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
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
export class DocumentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Crea o busca un remitente
   */
  createOrFindSender(sender: Sender): Observable<any> {
    return this.http.post(`${this.apiUrl}/senders`, sender);
  }

  /**
   * Envía un documento completo (remitente + documento)
   */
  submitDocument(data: DocumentSubmission): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(`${this.apiUrl}/documents/submit`, data);
  }

  /**
   * Envía un documento con archivos adjuntos usando FormData
   */
  submitDocumentWithFiles(formData: FormData): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(`${this.apiUrl}/documents/submit`, formData);
  }

  /**
   * Busca un documento por código de seguimiento
   */
  trackDocument(trackingCode: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${this.apiUrl}/documents/tracking/${trackingCode}`);
  }

  /**
   * Obtiene todos los tipos de documento
   */
  getDocumentTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/document-types`);
  }

  /**
   * Obtiene todos los documentos (para dashboard)
   */
  getAllDocuments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents`);
  }

  /**
   * Deriva un documento a otra área
   */
  deriveDocument(documentId: number, data: { toAreaId: number; toUserId: number | null; observacion: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/documents/${documentId}/derive`, data);
  }

  /**
   * Obtiene el historial de un documento
   */
  getDocumentHistory(documentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/documents/${documentId}/history`);
  }

  /**
   * Finaliza/atiende un documento
   */
  finalizeDocument(documentId: number, observacion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/documents/${documentId}/finalize`, { observacion });
  }

  /**
   * Obtiene documentos con filtros avanzados (para bandeja por área)
   */
  getDocumentsWithFilters(filters: DocumentFilters): Observable<ApiResponse<any[]>> {
    let params: string[] = [];
    
    if (filters.area !== undefined) params.push(`area=${filters.area}`);
    if (filters.status !== undefined) params.push(`status=${filters.status}`);
    if (filters.documentType !== undefined) params.push(`documentType=${filters.documentType}`);
    if (filters.archived !== undefined) params.push(`archived=${filters.archived}`);
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.dateFrom) params.push(`dateFrom=${filters.dateFrom}`);
    if (filters.dateTo) params.push(`dateTo=${filters.dateTo}`);
    if (filters.limit) params.push(`limit=${filters.limit}`);
    if (filters.offset) params.push(`offset=${filters.offset}`);
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documents${queryString}`);
  }

  /**
   * Obtiene documentos por área con filtros avanzados
   */
  getDocumentsByArea(areaId: number, filters?: DocumentFilters): Observable<ApiResponse<any[]>> {
    let params: string[] = [];
    
    if (filters) {
      if (filters.status !== undefined) params.push(`status=${filters.status}`);
      if (filters.documentType !== undefined) params.push(`documentType=${filters.documentType}`);
      if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
      if (filters.dateFrom) params.push(`dateFrom=${filters.dateFrom}`);
      if (filters.dateTo) params.push(`dateTo=${filters.dateTo}`);
    }
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documents/area/${areaId}${queryString}`);
  }

  /**
   * Obtiene un documento por ID
   */
  getDocumentById(documentId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/documents/${documentId}`);
  }

  /**
   * Archiva un documento
   */
  archiveDocument(documentId: number, observacion?: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/documents/${documentId}`, {
      body: { observacion }
    });
  }

  /**
   * Desarchiva un documento (reactivar)
   */
  unarchiveDocument(documentId: number, observacion?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/documents/${documentId}/unarchive`, {
      observacion
    });
  }

  /**
   * Obtiene documentos archivados por área con filtros
   */
  getArchivedByArea(areaId: number, filters?: DocumentFilters): Observable<ApiResponse<any[]>> {
    let params: string[] = [];
    
    if (filters) {
      if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
      if (filters.documentType !== undefined) params.push(`documentType=${filters.documentType}`);
      if (filters.dateFrom) params.push(`dateFrom=${filters.dateFrom}`);
      if (filters.dateTo) params.push(`dateTo=${filters.dateTo}`);
    }
    
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documents/area/${areaId}/archived${queryString}`);
  }

  /**
   * Cambia el estado de un documento manualmente
   */
  changeDocumentStatus(documentId: number, statusId: number, observacion?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/documents/${documentId}/status`, {
      statusId,
      observacion
    });
  }

  /**
   * Obtiene todos los estados de documentos disponibles
   */
  getDocumentStatuses(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documents/statuses`);
  }
}
