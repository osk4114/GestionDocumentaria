import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService, DocumentFilters } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentDeriveComponent } from '../documents/document-derive/document-derive.component';
import { DocumentDetailsComponent } from '../documents/document-details/document-details.component';

interface Document {
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
    id: number;
    nombre: string;
    color: string;
  };
  currentArea?: {
    nombre: string;
    sigla: string;
  };
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
  loading = signal<boolean>(true);
  activeTab = signal<'pendientes' | 'proceso' | 'finalizados' | 'archivados'>('pendientes');
  searchTerm = signal<string>('');

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
      pendientes: docs.filter(d => d.status.id === 1).length,
      enProceso: docs.filter(d => d.status.id === 2).length,
      finalizados: docs.filter(d => d.status.id === 3).length,
      archivados: docs.filter(d => d.status.id === 4).length
    };
  });

  // Documentos filtrados según tab activo y búsqueda
  filteredDocuments = computed(() => {
    const docs = this.documents();
    const tab = this.activeTab();
    const search = this.searchTerm().toLowerCase();

    // Filtrar por estado según tab
    let filtered: Document[] = [];
    switch (tab) {
      case 'pendientes':
        filtered = docs.filter(d => d.status.id === 1);
        break;
      case 'proceso':
        filtered = docs.filter(d => d.status.id === 2);
        break;
      case 'finalizados':
        filtered = docs.filter(d => d.status.id === 3);
        break;
      case 'archivados':
        filtered = docs.filter(d => d.status.id === 4);
        break;
    }

    // Aplicar búsqueda
    if (search) {
      filtered = filtered.filter(d =>
        d.trackingCode.toLowerCase().includes(search) ||
        d.asunto.toLowerCase().includes(search) ||
        d.sender.nombreCompleto.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  constructor(
    private documentService: DocumentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    const user = this.currentUser();
    if (!user || !user.areaId) {
      console.error('Usuario sin área asignada');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    const filters: DocumentFilters = {
      area: user.areaId
    };

    this.documentService.getDocumentsWithFilters(filters).subscribe({
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

  setActiveTab(tab: 'pendientes' | 'proceso' | 'finalizados' | 'archivados'): void {
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
    if (!confirm(`¿Está seguro de archivar el documento ${doc.trackingCode}?`)) {
      return;
    }

    this.documentService.archiveDocument(doc.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Documento archivado correctamente');
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al archivar:', error);
        alert('Error al archivar el documento');
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
