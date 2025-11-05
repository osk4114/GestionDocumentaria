import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService, DocumentFilters } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { AreaCategoryService, AreaCategory } from '../../core/services/area-category.service';
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
  status: {
    id: number;
    nombre: string;
    color: string;
  };
  currentArea?: {
    nombre: string;
    sigla: string;
  };
  categoriaId?: number | null;
  categoria?: {
    id: number;
    nombre: string;
    codigo: string;
    color: string;
  } | null;
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
  areaCategories = signal<AreaCategory[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'todos' | 'pendientes' | 'proceso' | 'finalizados' | 'archivados'>('todos');
  
  // Filtros avanzados
  searchTerm = signal<string>('');
  selectedCategory = signal<number | null>(null);
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  showFilters = signal<boolean>(false);

  // Modales
  showDeriveModal = signal(false);
  showDetailsModal = signal(false);
  showCategoryModal = signal(false);
  selectedDocumentId = signal<number>(0);
  selectedDocument = signal<Document | null>(null);
  selectedCategoryId = signal<number | null>(null);

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
    private areaCategoryService: AreaCategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAreaCategories();
    this.loadDocuments();
  }

  loadAreaCategories(): void {
    const user = this.currentUser();
    if (!user || !user.areaId) return;

    this.areaCategoryService.getCategoriesByArea(user.areaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.areaCategories.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error al cargar categorías del área:', error);
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

    if (this.selectedCategory()) {
      filters.category = this.selectedCategory()!;
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
    this.selectedCategory.set(null);
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
    this.showCategoryModal.set(false);
  }

  onDeriveSuccess(): void {
    this.closeModals();
    this.loadDocuments();
    alert('Documento derivado exitosamente');
  }

  openCategoryModal(doc: Document): void {
    this.selectedDocument.set(doc);
    this.selectedDocumentId.set(doc.id);
    this.selectedCategoryId.set(doc.categoriaId || null);
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.selectedDocument.set(null);
    this.selectedCategoryId.set(null);
  }

  selectCategoryId(categoryId: number): void {
    this.selectedCategoryId.set(categoryId);
  }

  assignCategoryToDocument(): void {
    const documentId = this.selectedDocumentId();
    const categoryId = this.selectedCategoryId();

    if (!documentId || !categoryId) {
      alert('Por favor seleccione una categoría');
      return;
    }

    this.documentService.updateDocumentCategory(documentId, categoryId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Categoría asignada correctamente');
          this.closeCategoryModal();
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al asignar categoría:', error);
        alert(error.error?.message || 'Error al asignar categoría');
      }
    });
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
