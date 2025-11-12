import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService, DocumentFilters } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeEventsService } from '../../core/services/realtime-events.service';
import { DocumentTypeService } from '../../core/services/document-type.service';
import { DocumentDetailsComponent } from '../documents/document-details/document-details.component';

interface Document {
  id: number;
  trackingCode: string;
  asunto: string;
  created_at: string;
  updated_at: string;
  sender: {
    nombreCompleto?: string;
    email?: string;
  };
  documentType?: {
    id: number;
    nombre: string;
  } | null;
  status: {
    id: number;
    nombre: string;
    color: string;
  };
  currentArea?: {
    nombre: string;
    sigla: string;
  };
}

interface DocumentType {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-archivados',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDetailsComponent],
  templateUrl: './archivados.component.html',
  styleUrl: './archivados.component.scss'
})
export class ArchivadosComponent implements OnInit {
  // Signals para estado reactivo
  documents = signal<Document[]>([]);
  documentTypes = signal<DocumentType[]>([]);
  loading = signal<boolean>(true);
  
  // Filtros avanzados
  searchTerm = signal<string>('');
  selectedDocumentType = signal<number | null>(null);
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  showFilters = signal<boolean>(false);

  // Modal
  showDetailsModal = signal(false);
  selectedDocumentId = signal<number>(0);

  // Computed values
  currentUser = computed(() => this.authService.currentUser());
  userArea = computed(() => this.currentUser()?.area);
  
  // Estadísticas
  stats = computed(() => {
    return {
      total: this.documents().length
    };
  });

  constructor(
    private documentService: DocumentService,
    private documentTypeService: DocumentTypeService,
    private authService: AuthService,
    private realtimeEvents: RealtimeEventsService,
    private router: Router
  ) {
    // 🔥 EVENTOS EN TIEMPO REAL - Agregar documentos archivados
    effect(() => {
      const archived = this.realtimeEvents.lastDocumentArchived();
      if (archived) {
        const user = this.currentUser();
        if (user && archived.document.currentAreaId === user.areaId) {
          this.handleNewArchivedDocument(archived.document);
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadDocumentTypes();
    this.loadDocuments();
  }

  loadDocumentTypes(): void {
    this.documentTypeService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.documentTypes.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
      }
    });
  }

  loadDocuments(): void {
    const user = this.currentUser();
    if (!user || !user.areaId) {
      console.error('Usuario sin área asignada');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Construir filtros
    const filters: DocumentFilters = {};
    
    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }
    
    if (this.selectedDocumentType()) {
      filters.documentType = this.selectedDocumentType()!;
    }
    
    if (this.dateFrom()) {
      filters.dateFrom = this.dateFrom();
    }
    
    if (this.dateTo()) {
      filters.dateTo = this.dateTo();
    }

    this.documentService.getArchivedByArea(user.areaId, filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.documents.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar documentos archivados:', error);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadDocuments();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDocumentType.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadDocuments();
  }

  toggleFilters(): void {
    this.showFilters.update(value => !value);
  }

  viewDocument(doc: Document): void {
    this.selectedDocumentId.set(doc.id);
    this.showDetailsModal.set(true);
  }

  unarchiveDocument(doc: Document): void {
    const observacion = prompt(`¿Desea agregar una observación al desarchivar el documento ${doc.trackingCode}?`, '');
    
    if (observacion === null) {
      // Usuario canceló
      return;
    }

    if (!confirm(`¿Está seguro de reactivar el documento ${doc.trackingCode}?\n\nEl documento volverá a estar "En proceso" en tu bandeja.`)) {
      return;
    }

    this.documentService.unarchiveDocument(doc.id, observacion || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Documento desarchivado correctamente');
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al desarchivar:', error);
        alert(error.error?.message || 'Error al desarchivar el documento');
      }
    });
  }

  closeModals(): void {
    this.showDetailsModal.set(false);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/bandeja']);
  }

  // 🔥 MÉTODOS PARA EVENTOS EN TIEMPO REAL
  private handleNewArchivedDocument(newDoc: any): void {
    const current = this.documents();
    
    if (current.some(d => d.id === newDoc.id)) {
      return;
    }

    const transformedDoc = this.transformDocument(newDoc);
    this.documents.update(docs => [transformedDoc, ...docs]);
  }

  private transformDocument(doc: any): Document {
    return {
      id: doc.id,
      trackingCode: doc.tracking_code || doc.trackingCode,
      asunto: doc.asunto,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      sender: {
        nombreCompleto: doc.sender?.nombre_completo || doc.sender?.nombreCompleto,
        email: doc.sender?.email
      },
      documentType: doc.documentType || doc.document_type || null,
      status: {
        id: doc.status?.id,
        nombre: doc.status?.nombre,
        color: doc.status?.color
      },
      currentArea: doc.currentArea || doc.current_area ? {
        nombre: (doc.currentArea || doc.current_area)?.nombre,
        sigla: (doc.currentArea || doc.current_area)?.sigla
      } : undefined
    };
  }
}
