import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { User } from '../../core/models/user.model';
import { DocumentDeriveComponent } from '../documents/document-derive/document-derive.component';
import { DocumentDetailsComponent } from '../documents/document-details/document-details.component';
import { NotificationsPanelComponent } from '../../shared/components/notifications-panel/notifications-panel.component';
import { ToastService } from '../../core/services/toast.service';
import { PERMISSION_DIRECTIVES } from '../../shared/directives';
import { PermissionService } from '../../core/services/permission.service';

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
    nombre: string;
  } | null;
  status: { 
    nombre: string; 
    color: string;
  };
  currentArea?: { 
    nombre: string;
  };
}

interface Stats {
  total: number;
  pendientes: number;
  enProceso: number;
  finalizados: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    DocumentDeriveComponent, 
    DocumentDetailsComponent, 
    NotificationsPanelComponent,
    ...PERMISSION_DIRECTIVES
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user = signal<User | null>(null);
  documents = signal<Document[]>([]);
  filteredDocuments = signal<Document[]>([]);
  stats = signal<Stats>({ total: 0, pendientes: 0, enProceso: 0, finalizados: 0 });
  loading = signal(false);
  
  // Modales
  showDeriveModal = signal(false);
  showDetailsModal = signal(false);
  selectedDocument = signal<Document>({
    id: 0,
    trackingCode: '',
    asunto: '',
    created_at: '',
    sender: { nombreCompleto: '', email: '' },
    documentType: null,
    status: { nombre: '', color: '' },
    currentArea: { nombre: '' }
  });
  selectedDocumentId = signal(0);
  
  // Filtros
  searchTerm = '';
  statusFilter = '';
  
  // Paginación
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = computed(() => Math.ceil(this.filteredDocuments().length / this.pageSize()));
  paginatedDocuments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredDocuments().slice(start, end);
  });
  
  // Ordenamiento
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  
  // Computed values
  userName = computed(() => this.user()?.nombre || 'Usuario');
  userRole = computed(() => this.user()?.role?.nombre || 'Sin rol');
  userArea = computed(() => this.user()?.area?.nombre || 'Sin área');
  
  // Exponer Math para el template
  Math = Math;

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private router: Router,
    private toastService: ToastService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.user.set(this.authService.currentUser());
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.documentService.getAllDocuments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.documents.set(response.data);
          this.filteredDocuments.set(response.data);
          this.calculateStats();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.loading.set(false);
      }
    });
  }

  calculateStats(): void {
    const docs = this.documents();
    this.stats.set({
      total: docs.length,
      pendientes: docs.filter(d => d.status.nombre === 'Pendiente').length,
      enProceso: docs.filter(d => d.status.nombre === 'En Proceso').length,
      finalizados: docs.filter(d => d.status.nombre === 'Atendido').length
    });
  }

  applyFilters(): void {
    let filtered = this.documents();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.trackingCode.toLowerCase().includes(term) ||
        d.asunto.toLowerCase().includes(term) ||
        (d.sender.nombreCompleto?.toLowerCase().includes(term) || false) ||
        (d.sender.email?.toLowerCase().includes(term) || false)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(d => d.status.nombre === this.statusFilter);
    }

    this.filteredDocuments.set(filtered);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.filteredDocuments.set(this.documents());
  }

  viewDocument(doc: Document): void {
    this.router.navigate(['/documents', doc.id]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  onLogout(): void {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      const result = this.authService.logout();
      if (result) {
        result.subscribe({
          next: () => {
            this.router.navigate(['/login']);
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  navigateToSessions(): void {
    this.router.navigate(['/sessions']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  openDeriveModal(document: Document): void {
    this.selectedDocument.set(document);
    this.showDeriveModal.set(true);
  }

  closeDeriveModal(): void {
    this.showDeriveModal.set(false);
  }

  onDeriveSuccess(): void {
    this.showDeriveModal.set(false);
    this.toastService.success(
      'Documento Derivado',
      'El documento ha sido derivado exitosamente'
    );
    this.loadDocuments();
  }

  // Modal de detalles
  openDetailsModal(document: Document): void {
    this.selectedDocumentId.set(document.id);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
  }

  // Paginación
  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Resetear a primera página
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  // Ordenamiento
  sortBy(column: string): void {
    if (this.sortColumn() === column) {
      // Toggle direction
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    // Ordenar documentos
    const sorted = [...this.filteredDocuments()].sort((a, b) => {
      let aVal: any = a[column as keyof Document];
      let bVal: any = b[column as keyof Document];

      // Manejar valores anidados
      if (column === 'sender') aVal = a.sender.nombreCompleto || a.sender.email || '';
      if (column === 'sender') bVal = b.sender.nombreCompleto || b.sender.email || '';
      if (column === 'documentType') aVal = a.documentType?.nombre || '';
      if (column === 'documentType') bVal = b.documentType?.nombre || '';
      if (column === 'status') aVal = a.status.nombre;
      if (column === 'status') bVal = b.status.nombre;
      if (column === 'currentArea') aVal = a.currentArea?.nombre || '';
      if (column === 'currentArea') bVal = b.currentArea?.nombre || '';

      if (aVal < bVal) return this.sortDirection() === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection() === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredDocuments.set(sorted);
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}
