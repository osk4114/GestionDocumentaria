import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService, DocumentFilters } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentTypeService } from '../../core/services/document-type.service';
import { DocumentDeriveComponent } from '../documents/document-derive/document-derive.component';
import { DocumentDetailsComponent } from '../documents/document-details/document-details.component';

interface Document {
  id: number;
  trackingCode: string;
  asunto: string;
  created_at: string;
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
  selector: 'app-bandeja',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentDeriveComponent, DocumentDetailsComponent],
  templateUrl: './bandeja.component.html',
  styleUrl: './bandeja.component.scss'
})
export class BandejaComponent implements OnInit {
  // Signals para estado reactivo
  documents = signal<Document[]>([]);
  documentTypes = signal<DocumentType[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'todos' | 'pendientes' | 'proceso' | 'finalizados' | 'archivados'>('todos');
  
  // Filtros avanzados
  searchTerm = signal<string>('');
  selectedDocumentType = signal<number | null>(null);
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  showFilters = signal<boolean>(false);

  // Modales
  showDeriveModal = signal(false);
  showDetailsModal = signal(false);
  selectedDocumentId = signal<number>(0);
  selectedDocument = signal<Document | null>(null);

  // Computed values
  currentUser = computed(() => this.authService.currentUser());
  userArea = computed(() => this.currentUser()?.area);
  
  // Estadísticas
  stats = computed(() => {
    const docs = this.documents();
    return {
      total: docs.length,
      pendientes: docs.filter(d => d.status.id === 1).length,
      enProceso: docs.filter(d => d.status.id === 2).length,
      finalizados: docs.filter(d => d.status.id === 4).length, // Atendido
      archivados: docs.filter(d => d.status.id === 6).length  // Archivado
    };
  });

  // Documentos filtrados según tab activo
  filteredDocuments = computed(() => {
    const docs = this.documents();
    const tab = this.activeTab();

    // Filtrar por estado según tab
    let filtered: Document[] = [];
    switch (tab) {
      case 'todos':
        filtered = docs;
        break;
      case 'pendientes':
        filtered = docs.filter(d => d.status.id === 1);
        break;
      case 'proceso':
        filtered = docs.filter(d => d.status.id === 2);
        break;
      case 'finalizados':
        filtered = docs.filter(d => d.status.id === 4); // Atendido
        break;
      case 'archivados':
        filtered = docs.filter(d => d.status.id === 6); // Archivado
        break;
    }

    return filtered;
  });

  constructor(
    private documentService: DocumentService,
    private documentTypeService: DocumentTypeService,
    private authService: AuthService,
    private router: Router
  ) {}

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

    this.documentService.getDocumentsByArea(user.areaId, filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.documents.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
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

  setActiveTab(tab: 'todos' | 'pendientes' | 'proceso' | 'finalizados' | 'archivados'): void {
    this.activeTab.set(tab);
  }

  viewDocument(doc: Document): void {
    this.selectedDocumentId.set(doc.id);
    this.showDetailsModal.set(true);
  }

  deriveDocument(doc: Document): void {
    this.selectedDocument.set(doc);
    this.selectedDocumentId.set(doc.id);
    this.showDeriveModal.set(true);
  }

  archiveDocument(doc: Document): void {
    const observacion = prompt(`¿Desea agregar una observación al archivar el documento ${doc.trackingCode}?`, '');
    
    if (observacion === null) {
      // Usuario canceló
      return;
    }

    if (!confirm(`¿Está seguro de archivar el documento ${doc.trackingCode}?`)) {
      return;
    }

    this.documentService.archiveDocument(doc.id, observacion || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Documento archivado correctamente');
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al archivar:', error);
        alert(error.error?.message || 'Error al archivar el documento');
      }
    });
  }

  closeModals(): void {
    this.showDeriveModal.set(false);
    this.showDetailsModal.set(false);
  }

  onDeriveSuccess(): void {
    this.closeModals();
    this.loadDocuments();
    alert('Documento derivado exitosamente');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
