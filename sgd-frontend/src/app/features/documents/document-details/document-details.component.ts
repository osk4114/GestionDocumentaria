import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../../core/services/document.service';

interface DocumentStatus {
  id: number;
  nombre: string;
  codigo: string;
  color: string;
  descripcion: string;
}

interface DocumentDetails {
  id: number;
  trackingCode: string;
  asunto: string;
  descripcion: string;
  created_at: string;
  sender: {
    tipoPersona?: 'natural' | 'juridica';
    nombreCompleto: string;
    tipoDocumento: string;
    numeroDocumento: string;
    email?: string;
    telefono?: string;
    
    // Campos persona natural
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    
    // Campos persona jurídica
    ruc?: string;
    nombreEmpresa?: string;
    
    // Representante legal
    representanteTipoDoc?: string;
    representanteNumDoc?: string;
    representanteNombres?: string;
    representanteApellidoPaterno?: string;
    representanteApellidoMaterno?: string;
    
    // Dirección detallada
    departamento?: string;
    provincia?: string;
    distrito?: string;
    direccion?: string;
    direccionCompleta?: string;
  };
  documentType: {
    nombre: string;
  };
  status: {
    id: number;
    nombre: string;
    color: string;
  };
  currentArea: {
    nombre: string;
    sigla: string;
  };
  attachments?: Array<{
    id: number;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    uploader?: {
      id: number;
      nombre: string;
    } | null;
  }>;
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
  imports: [CommonModule, FormsModule],
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
  
  // Control de cambio de estado
  availableStatuses = signal<DocumentStatus[]>([]);
  selectedStatusId: number | null = null;
  changingStatus = signal(false);
  
  // Control de acciones
  finalizingDocument = signal(false);
  archivingDocument = signal(false);

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocumentDetails();
    this.loadAvailableStatuses();
  }

  loadDocumentDetails(): void {
    this.loading.set(true);
    this.documentService.getDocumentHistory(this.documentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // El backend retorna { document, timeline, estadisticas }
          const docData = response.data.document || response.data;
          const movements = response.data.timeline || response.data.movements || [];
          
          this.document.set({
            ...docData,
            movements: movements,
            created_at: docData.createdAt || docData.created_at
          });
          
          // Establecer estado seleccionado actual
          this.selectedStatusId = docData.status?.id || null;
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles:', error);
        this.loading.set(false);
      }
    });
  }

  loadAvailableStatuses(): void {
    this.documentService.getDocumentStatuses().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo estados que se pueden cambiar manualmente
          const manualStatuses = response.data.filter((status: DocumentStatus) => 
            !['Archivado', 'Atendido'].includes(status.nombre)
          );
          this.availableStatuses.set(manualStatuses);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar estados:', error);
      }
    });
  }

  changeStatus(): void {
    if (!this.selectedStatusId || !this.document()) {
      return;
    }

    const currentStatusId = this.document()!.status.id;
    if (this.selectedStatusId === currentStatusId) {
      alert('El documento ya tiene ese estado');
      return;
    }

    if (confirm('¿Estás seguro de cambiar el estado del documento?')) {
      this.changingStatus.set(true);
      
      this.documentService.changeDocumentStatus(this.documentId, this.selectedStatusId).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.message || 'Estado cambiado exitosamente');
            this.loadDocumentDetails(); // Recargar detalles
            this.onAction.emit(); // Notificar al componente padre
          }
          this.changingStatus.set(false);
        },
        error: (error) => {
          console.error('❌ Error al cambiar estado:', error);
          alert(error.error?.message || 'Error al cambiar el estado del documento');
          this.changingStatus.set(false);
        }
      });
    }
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

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'Recibido': '📥',
      'Derivado': '📤',
      'Derivación': '📤',
      'Atendido': '✅',
      'Finalizado': '✅',
      'Archivado': '📦'
    };
    return icons[action] || '📄';
  }

  downloadAttachment(documentId: number, attachmentId: number, filename: string): void {
    const url = `http://localhost:3000/api/documents/${documentId}/attachments/${attachmentId}/download`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📃';
    return '📎';
  }

  /**
   * Finalizar documento
   */
  finalizeDocument(): void {
    const observacion = prompt('Ingresa una observación (opcional):');
    
    if (observacion === null) {
      return; // Usuario canceló
    }

    if (confirm('¿Estás seguro de finalizar este documento? Esta acción marcará el documento como atendido.')) {
      this.finalizingDocument.set(true);

      this.documentService.finalizeDocument(this.documentId, observacion || 'Documento atendido').subscribe({
        next: (response) => {
          if (response.success) {
            alert('✅ Documento atendido exitosamente');
            this.loadDocumentDetails(); // Recargar detalles
            this.onAction.emit(); // Notificar al componente padre
          }
          this.finalizingDocument.set(false);
        },
        error: (error) => {
          console.error('❌ Error al finalizar documento:', error);
          alert(error.error?.message || 'Error al finalizar el documento');
          this.finalizingDocument.set(false);
        }
      });
    }
  }

  /**
   * Archivar documento
   */
  archiveDocument(): void {
    const observacion = prompt('Ingresa una observación (opcional):');
    
    if (observacion === null) {
      return; // Usuario canceló
    }

    if (confirm('¿Estás seguro de archivar este documento?')) {
      this.archivingDocument.set(true);

      this.documentService.archiveDocument(this.documentId, observacion).subscribe({
        next: (response) => {
          if (response.success) {
            alert('📦 Documento archivado exitosamente');
            this.loadDocumentDetails(); // Recargar detalles
            this.onAction.emit(); // Notificar al componente padre
          }
          this.archivingDocument.set(false);
        },
        error: (error) => {
          console.error('❌ Error al archivar documento:', error);
          alert(error.error?.message || 'Error al archivar el documento');
          this.archivingDocument.set(false);
        }
      });
    }
  }
}
