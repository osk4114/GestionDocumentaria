import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';

interface DocumentDetails {
  id: number;
  trackingCode: string;
  asunto: string;
  descripcion: string;
  prioridad: string;
  created_at: string;
  sender: {
    nombreCompleto: string;
    tipoDocumento: string;
    numeroDocumento: string;
    email?: string;
    telefono?: string;
  };
  documentType: {
    nombre: string;
  };
  status: {
    nombre: string;
    color: string;
  };
  currentArea: {
    nombre: string;
    sigla: string;
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
    user: {
      nombre: string;
      role: {
        nombre: string;
      };
    };
  }>;
}

@Component({
  selector: 'app-document-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-details.component.html',
  styleUrl: './document-details.component.scss'
})
export class DocumentDetailsComponent implements OnInit {
  @Input() documentId!: number;
  @Output() onClose = new EventEmitter<void>();
  @Output() onAction = new EventEmitter<void>();

  document = signal<DocumentDetails | null>(null);
  loading = signal(true);
  activeTab = signal<'info' | 'history'>('info');

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocumentDetails();
  }

  loadDocumentDetails(): void {
    this.loading.set(true);
    this.documentService.getDocumentHistory(this.documentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.document.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar detalles:', error);
        this.loading.set(false);
      }
    });
  }

  setTab(tab: 'info' | 'history'): void {
    this.activeTab.set(tab);
  }

  close(): void {
    this.onClose.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      baja: 'Baja',
      normal: 'Normal',
      alta: 'Alta',
      urgente: 'Urgente'
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      baja: 'priority-low',
      normal: 'priority-normal',
      alta: 'priority-high',
      urgente: 'priority-urgent'
    };
    return classes[priority] || '';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'Recibido': '📥',
      'Derivado': '📤',
      'Finalizado': '✅',
      'Archivado': '📦'
    };
    return icons[action] || '📄';
  }
}
