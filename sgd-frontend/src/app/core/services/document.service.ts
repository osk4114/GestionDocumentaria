import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sender {
  nombreCompleto: string;
  tipoDocumento: 'DNI' | 'RUC' | 'PASAPORTE' | 'CARNET_EXTRANJERIA';
  numeroDocumento: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface DocumentSubmission {
  sender: Sender;
  document: {
    documentTypeId: number;
    asunto: string;
    descripcion?: string;
    prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  };
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
    prioridad: string;
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
}
