import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReportStats {
  totalDocuments: number;
  byStatus: {
    status: string;
    count: number;
    color: string;
  }[];
  byArea: {
    area: string;
    count: number;
  }[];
  byPriority: {
    priority: string;
    count: number;
  }[];
  byMonth: {
    month: string;
    count: number;
  }[];
  byType: {
    type: string;
    count: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener estadísticas generales
   */
  getStats(): Observable<{ success: boolean; data: ReportStats }> {
    return this.http.get<{ success: boolean; data: ReportStats }>(`${this.apiUrl}/stats`);
  }

  /**
   * Obtener documentos por estado
   */
  getDocumentsByStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-status`);
  }

  /**
   * Obtener documentos por área
   */
  getDocumentsByArea(): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-area`);
  }

  /**
   * Obtener documentos por mes
   */
  getDocumentsByMonth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-month`);
  }

  /**
   * Obtener documentos por prioridad
   */
  getDocumentsByPriority(): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-priority`);
  }

  /**
   * Exportar reporte a CSV
   * @param type - Tipo de reporte: 'general', 'by-status', 'by-area'
   * @param startDate - Fecha inicio (opcional)
   * @param endDate - Fecha fin (opcional)
   */
  exportToCsv(type: string = 'general', startDate?: string, endDate?: string): void {
    // Construir URL con parámetros
    let url = `${this.apiUrl}/export?type=${type}`;
    
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }

    // Descargar archivo usando HttpClient para incluir el token
    this.http.get(url, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Crear blob y descargar
        const blob = response.body;
        if (blob) {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          
          // Obtener nombre del archivo del header Content-Disposition o usar uno por defecto
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = `reporte_${type}_${Date.now()}.csv`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }
          
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        }
      },
      error: (error) => {
        console.error('Error al exportar CSV:', error);
        alert('Error al exportar el reporte');
      }
    });
  }
}
