import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService, DocumentFilters } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { AreaCategoryService, AreaCategory } from '../../core/services/area-category.service';
import { DocumentTypeService, DocumentType } from '../../core/services/document-type.service';
import { RealtimeEventsService } from '../../core/services/realtime-events.service';
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
  docTypeId?: number | null;
  documentType?: {
    id: number;
    nombre: string;
  } | null;
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
  documentTypes = signal<DocumentType[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'todos' | 'pendientes' | 'proceso' | 'finalizados' | 'archivados'>('todos');
  
  // Filtros avanzados
  searchTerm = signal<string>('');
  selectedCategory = signal<number | null>(null);
  selectedDocType = signal<number | null>(null);
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  showFilters = signal<boolean>(false);

  // Modales
  showDeriveModal = signal(false);
  showDetailsModal = signal(false);
  showCategoryModal = signal(false);
  showDocTypeModal = signal(false);
  selectedDocumentId = signal<number>(0);
  selectedDocument = signal<Document | null>(null);
  selectedCategoryId = signal<number | null>(null);
  selectedDocTypeId = signal<number | null>(null);

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
    private documentTypeService: DocumentTypeService,
    private authService: AuthService,
    private realtimeEvents: RealtimeEventsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAreaCategories();
    this.loadDocumentTypes();
    this.loadDocuments();
    this.setupRealtimeEvents();
  }

  private setupRealtimeEvents(): void {
    // Documento creado - solo refrescar la lista
    this.realtimeEvents.getDocumentCreated$().subscribe(() => {
      console.log('🔄 [BANDEJA] Documento creado - Refrescando lista...');
      this.loadDocuments();
    });

    // Documento derivado - solo refrescar la lista
    this.realtimeEvents.getDocumentDerived$().subscribe(() => {
      console.log('🔄 [BANDEJA] Documento derivado - Refrescando lista...');
      this.loadDocuments();
    });

    // Documento actualizado - solo refrescar la lista
    this.realtimeEvents.getDocumentUpdated$().subscribe(() => {
      console.log('🔄 [BANDEJA] Documento actualizado - Refrescando lista...');
      this.loadDocuments();
    });

    // Documento finalizado - solo refrescar la lista
    this.realtimeEvents.getDocumentFinalized$().subscribe(() => {
      console.log('🔄 [BANDEJA] Documento finalizado - Refrescando lista...');
      this.loadDocuments();
    });
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

  loadDocumentTypes(): void {
    this.documentTypeService.getActive().subscribe({
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

    if (this.selectedCategory()) {
      filters.category = this.selectedCategory()!;
    }

    if (this.selectedDocType()) {
      filters.documentType = this.selectedDocType()!;
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
    this.selectedDocType.set(null);
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
    this.showDocTypeModal.set(false);
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

  openDocTypeModal(doc: Document): void {
    this.selectedDocument.set(doc);
    this.selectedDocumentId.set(doc.id);
    this.selectedDocTypeId.set(doc.docTypeId || null);
    this.showDocTypeModal.set(true);
  }

  closeDocTypeModal(): void {
    this.showDocTypeModal.set(false);
    this.selectedDocument.set(null);
    this.selectedDocTypeId.set(null);
  }

  selectDocTypeId(docTypeId: number): void {
    this.selectedDocTypeId.set(docTypeId);
  }

  assignDocTypeToDocument(): void {
    const documentId = this.selectedDocumentId();
    const docTypeId = this.selectedDocTypeId();

    if (!documentId || !docTypeId) {
      alert('Por favor seleccione un tipo de documento');
      return;
    }

    this.documentService.updateDocumentType(documentId, docTypeId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Tipo de documento asignado correctamente');
          this.closeDocTypeModal();
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al asignar tipo:', error);
        alert(error.error?.message || 'Error al asignar tipo de documento');
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

  // 🔥 MÉTODOS PARA EVENTOS EN TIEMPO REAL
  private callCount = 0;
  private lastCallTime = 0;

  private handleNewDocument(newDoc: any): void {
    this.callCount++;
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    this.lastCallTime = now;

    console.log(`🔄 [handleNewDocument] Llamada #${this.callCount} (${timeSinceLastCall}ms desde última llamada)`);
    
    if (this.callCount > 10) {
      console.error('🚨 LOOP INFINITO DETECTADO - Deteniendo ejecución');
      return;
    }

    console.log('📦 Documento recibido:', newDoc);
    
    const current = this.documents();
    console.log('📋 Documentos actuales:', current.length);
    
    if (current.some(d => d.id === newDoc.id)) {
      console.log('📌 Documento ya existe (ID: ' + newDoc.id + '), actualizando...');
      this.updateDocumentInList(newDoc);
      return;
    }

    console.log('🆕 Transformando documento nuevo...');
    const transformedDoc = this.transformDocument(newDoc);
    console.log('✨ Documento transformado:', transformedDoc);
    
    console.log('➕ Agregando a la lista...');
    this.documents.update(docs => {
      const updated = [transformedDoc, ...docs];
      console.log('📊 Nueva cantidad de documentos:', updated.length);
      return updated;
    });
    console.log('✅ [handleNewDocument] Completado');
  }

  private updateDocumentInList(updatedDoc: any): void {
    console.log('🔄 [updateDocumentInList] Actualizando documento ID:', updatedDoc.id);
    const transformedDoc = this.transformDocument(updatedDoc);
    this.documents.update(current => 
      current.map(doc => {
        if (doc.id === transformedDoc.id) {
          console.log('🔄 Actualizando documento:', doc.trackingCode);
          return { ...doc, ...transformedDoc };
        }
        return doc;
      })
    );
    console.log('✅ [updateDocumentInList] Completado');
  }

  private transformDocument(doc: any): Document {
    console.log('🔄 [transformDocument] Transformando:', doc);
    try {
      const transformed: Document = {
        id: doc.id,
        trackingCode: doc.tracking_code || doc.trackingCode,
        asunto: doc.asunto,
        created_at: doc.created_at,
        sender: {
          nombreCompleto: doc.sender?.nombre_completo || doc.sender?.nombreCompleto || '',
          email: doc.sender?.email || ''
        },
        status: {
          id: doc.status?.id || 0,
          nombre: doc.status?.nombre || '',
          color: doc.status?.color || '#999999'
        },
        currentArea: doc.currentArea || doc.current_area ? {
          nombre: (doc.currentArea || doc.current_area)?.nombre || '',
          sigla: (doc.currentArea || doc.current_area)?.sigla || ''
        } : undefined,
        docTypeId: doc.docTypeId || doc.doc_type_id || null,
        documentType: doc.documentType || doc.document_type || null,
        categoriaId: doc.categoriaId || doc.categoria_id || null,
        categoria: doc.categoria || null
      };
      console.log('✅ [transformDocument] Transformado:', transformed);
      return transformed;
    } catch (error) {
      console.error('❌ [transformDocument] Error:', error);
      throw error;
    }
  }
}
