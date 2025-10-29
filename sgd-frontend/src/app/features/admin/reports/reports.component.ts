import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { 
  Chart,
  ChartConfiguration, 
  ChartData, 
  ChartType,
  PieController,
  BarController,
  LineController,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { ReportsService, ReportStats } from '../../../core/services/reports.service';
import { DocumentService } from '../../../core/services/document.service';

// Registrar los controladores y elementos de Chart.js
Chart.register(
  PieController,   // Controlador para pie charts
  BarController,   // Controlador para bar charts
  LineController,  // Controlador para line charts
  ArcElement,      // Para pie charts
  BarElement,      // Para bar charts
  LineElement,     // Para line charts
  PointElement,    // Para puntos en line charts
  CategoryScale,   // Escala de categorías
  LinearScale,     // Escala lineal
  Title,
  Tooltip,
  Legend,
  Filler          // Para áreas rellenas
);

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
    
    // Obtener estadísticas del backend
    this.reportsService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.processStats(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar reportes:', error);
        this.loading.set(false);
      }
    });
  }

  private processStats(data: any): void {
    console.log('📊 Datos recibidos del backend:', data);
    
    // Procesar datos por estado
    const statusLabels: string[] = [];
    const statusData: number[] = [];
    const statusColors: string[] = [];
    
    data.byStatus.forEach((item: any) => {
      statusLabels.push(item.status);
      statusData.push(item.count);
      statusColors.push(item.color || '#6b7280');
    });

    this.statusChartData.set({
      labels: statusLabels,
      datasets: [{
        data: statusData,
        backgroundColor: statusColors
      }]
    });

    // Procesar datos por área
    const areaLabels: string[] = [];
    const areaData: number[] = [];
    
    data.byArea.forEach((item: any) => {
      areaLabels.push(item.area);
      areaData.push(item.count);
    });

    this.areaChartData.set({
      labels: areaLabels,
      datasets: [{
        label: 'Documentos por Área',
        data: areaData,
        backgroundColor: 'rgba(0, 56, 118, 0.8)',
        borderColor: 'rgba(0, 56, 118, 1)',
        borderWidth: 1
      }]
    });

    // Procesar datos por mes
    const monthLabels: string[] = [];
    const monthData: number[] = [];
    
    data.byMonth.forEach((item: any) => {
      monthLabels.push(item.month);
      monthData.push(item.count);
    });

    this.monthChartData.set({
      labels: monthLabels,
      datasets: [{
        label: 'Documentos por Mes',
        data: monthData,
        borderColor: '#C1272D',
        backgroundColor: 'rgba(193, 39, 45, 0.1)',
        tension: 0.4,
        fill: true
      }]
    });

    // Procesar datos por prioridad
    const priorityLabels: string[] = [];
    const priorityData: number[] = [];
    
    if (data.byPriority && data.byPriority.length > 0) {
      data.byPriority.forEach((item: any) => {
        priorityLabels.push(item.priority.charAt(0).toUpperCase() + item.priority.slice(1));
        priorityData.push(item.count);
      });

      this.priorityChartData.set({
        labels: priorityLabels,
        datasets: [{
          data: priorityData,
          backgroundColor: [
            'rgba(107, 114, 128, 0.8)',  // Baja
            'rgba(59, 130, 246, 0.8)',   // Normal
            'rgba(245, 158, 11, 0.8)',   // Alta
            'rgba(239, 68, 68, 0.8)'     // Urgente
          ]
        }]
      });
    }

    // Estadísticas generales
    this.stats.set({
      totalDocuments: data.totalDocuments,
      byStatus: data.byStatus.map((item: any) => ({
        status: item.status,
        count: item.count,
        color: item.color
      })),
      byArea: data.byArea.map((item: any) => ({
        area: item.area,
        count: item.count
      })),
      byPriority: data.byPriority?.map((item: any) => ({
        priority: item.priority,
        count: item.count
      })) || [],
      byMonth: data.byMonth.map((item: any) => ({
        month: item.month,
        count: item.count
      })),
      byType: data.byType?.map((item: any) => ({
        type: item.type,
        count: item.count
      })) || []
    });
  }

  refresh(): void {
    this.loadReports();
  }

  exportToCSV(): void {
    // Exportar reporte general a CSV
    this.reportsService.exportToCsv('general');
  }

  /**
   * Exportar reporte específico por tipo
   */
  exportByStatus(): void {
    this.reportsService.exportToCsv('by-status');
  }

  exportByArea(): void {
    this.reportsService.exportToCsv('by-area');
  }
}
