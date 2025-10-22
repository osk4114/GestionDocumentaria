import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { User } from '../../core/models/user.model';

interface Document {
  id: number;
  trackingCode: string;
  asunto: string;
  prioridad: string;
  created_at: string;
  sender: { nombreCompleto: string };
  documentType: { nombre: string };
  status: { nombre: string; color: string };
  currentArea: { nombre: string };
}

interface Stats {
  total: number;
  recibidos: number;
  enProceso: number;
  finalizados: number;
  urgentes: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user = signal<User | null>(null);
  documents = signal<Document[]>([]);
  filteredDocuments = signal<Document[]>([]);
  stats = signal<Stats>({ total: 0, recibidos: 0, enProceso: 0, finalizados: 0, urgentes: 0 });
  loading = signal(false);
  
  // Filtros
  searchTerm = '';
  statusFilter = '';
  priorityFilter = '';
  
  // Computed values
  userName = computed(() => this.user()?.nombre || 'Usuario');
  userRole = computed(() => this.user()?.role?.nombre || 'Sin rol');
  userArea = computed(() => this.user()?.area?.nombre || 'Sin área');

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private router: Router
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
      recibidos: docs.filter(d => d.status.nombre === 'Recibido').length,
      enProceso: docs.filter(d => d.status.nombre === 'En proceso').length,
      finalizados: docs.filter(d => d.status.nombre === 'Finalizado' || d.status.nombre === 'Atendido').length,
      urgentes: docs.filter(d => d.prioridad === 'urgente').length
    });
  }

  applyFilters(): void {
    let filtered = this.documents();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.trackingCode.toLowerCase().includes(term) ||
        d.asunto.toLowerCase().includes(term) ||
        d.sender.nombreCompleto.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(d => d.status.nombre === this.statusFilter);
    }

    if (this.priorityFilter) {
      filtered = filtered.filter(d => d.prioridad === this.priorityFilter);
    }

    this.filteredDocuments.set(filtered);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.priorityFilter = '';
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
}
