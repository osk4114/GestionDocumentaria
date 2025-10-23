import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ReportsService, ReportStats } from '../../../core/services/reports.service';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  loading = signal(true);
  stats = signal<ReportStats | null>(null);

  // Configuración de gráficas (tipos literales para ng2-charts)
  public readonly pieChartType = 'pie' as const;
  public readonly barChartType = 'bar' as const;
  public readonly lineChartType = 'line' as const;

  // Datos de gráficas
  public statusChartData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  });

  public areaChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: [{
      label: 'Documentos por Área',
      data: [],
      backgroundColor: 'rgba(0, 56, 118, 0.8)',
      borderColor: 'rgba(0, 56, 118, 1)',
      borderWidth: 1
    }]
  });

  public monthChartData = signal<ChartData<'line'>>({
    labels: [],
    datasets: [{
      label: 'Documentos por Mes',
      data: [],
      borderColor: '#C1272D',
      backgroundColor: 'rgba(193, 39, 45, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  public priorityChartData = signal<ChartData<'pie'>>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(107, 114, 128, 0.8)',  // Baja
        'rgba(59, 130, 246, 0.8)',   // Normal
        'rgba(245, 158, 11, 0.8)',   // Alta
        'rgba(239, 68, 68, 0.8)'     // Urgente
      ]
    }]
  });

  // Opciones de gráficas
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      }
    }
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  constructor(
    private reportsService: ReportsService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    
    // Simular datos (en producción vendría del backend)
    this.documentService.getAllDocuments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.processDocuments(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.loading.set(false);
      }
    });
  }

  private processDocuments(documents: any[]): void {
    // Procesar por estado
    const statusMap = new Map<string, { count: number; color: string }>();
    documents.forEach(doc => {
      const status = doc.status.nombre;
      const color = doc.status.color;
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, color });
      }
      statusMap.get(status)!.count++;
    });

    const statusLabels: string[] = [];
    const statusData: number[] = [];
    const statusColors: string[] = [];
    
    statusMap.forEach((value, key) => {
      statusLabels.push(key);
      statusData.push(value.count);
      statusColors.push(value.color);
    });

    this.statusChartData.set({
      labels: statusLabels,
      datasets: [{
        data: statusData,
        backgroundColor: statusColors
      }]
    });

    // Procesar por área
    const areaMap = new Map<string, number>();
    documents.forEach(doc => {
      const area = doc.currentArea.nombre;
      areaMap.set(area, (areaMap.get(area) || 0) + 1);
    });

    this.areaChartData.set({
      labels: Array.from(areaMap.keys()),
      datasets: [{
        label: 'Documentos por Área',
        data: Array.from(areaMap.values()),
        backgroundColor: 'rgba(0, 56, 118, 0.8)',
        borderColor: 'rgba(0, 56, 118, 1)',
        borderWidth: 1
      }]
    });

    // Procesar por mes
    const monthMap = new Map<string, number>();
    documents.forEach(doc => {
      const date = new Date(doc.created_at);
      const monthKey = date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    this.monthChartData.set({
      labels: Array.from(monthMap.keys()),
      datasets: [{
        label: 'Documentos por Mes',
        data: Array.from(monthMap.values()),
        borderColor: '#C1272D',
        backgroundColor: 'rgba(193, 39, 45, 0.1)',
        tension: 0.4,
        fill: true
      }]
    });

    // Procesar por prioridad
    const priorityMap = new Map<string, number>();
    const priorityOrder = ['baja', 'normal', 'alta', 'urgente'];
    documents.forEach(doc => {
      const priority = doc.prioridad;
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });

    const priorityLabels: string[] = [];
    const priorityData: number[] = [];
    
    priorityOrder.forEach(p => {
      if (priorityMap.has(p)) {
        priorityLabels.push(p.charAt(0).toUpperCase() + p.slice(1));
        priorityData.push(priorityMap.get(p)!);
      }
    });

    this.priorityChartData.set({
      labels: priorityLabels,
      datasets: [{
        data: priorityData,
        backgroundColor: [
          'rgba(107, 114, 128, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }]
    });

    // Estadísticas generales
    this.stats.set({
      totalDocuments: documents.length,
      byStatus: Array.from(statusMap.entries()).map(([status, { count, color }]) => ({
        status,
        count,
        color
      })),
      byArea: Array.from(areaMap.entries()).map(([area, count]) => ({
        area,
        count
      })),
      byPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({
        priority,
        count
      })),
      byMonth: Array.from(monthMap.entries()).map(([month, count]) => ({
        month,
        count
      })),
      byType: []
    });
  }

  refresh(): void {
    this.loadReports();
  }

  exportToPDF(): void {
    // TODO: Implementar exportación a PDF
    alert('Exportar a PDF - Próximamente');
  }

  exportToExcel(): void {
    // TODO: Implementar exportación a Excel
    alert('Exportar a Excel - Próximamente');
  }
}
