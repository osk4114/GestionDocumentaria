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
}
