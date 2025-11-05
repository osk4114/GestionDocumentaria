import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentTypeService, DocumentType } from '../../../core/services/document-type.service';

@Component({
  selector: 'app-document-types-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="types-container">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Tipos de Documento</h1>
          <p class="page-subtitle">Gestiona los tipos de documentos disponibles</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <span>➕</span> Nuevo Tipo
        </button>
      </div>

      @if (successMessage()) {
        <div class="alert alert-success">✓ {{ successMessage() }}</div>
      }
      @if (errorMessage()) {
        <div class="alert alert-error">✗ {{ errorMessage() }}</div>
      }

      <div class="filters-card">
        <div class="filters-row">
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              (ngModelChange)="applyFilters()"
              placeholder="Buscar tipos de documento..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          <select 
            [(ngModel)]="filterStatus"
            (ngModelChange)="applyFilters()"
            class="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <div class="results-count">
            <span class="count-badge">{{ filteredTypes().length }}</span> resultados
          </div>
        </div>
      </div>

      <div class="table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tipos...</p>
          </div>
        } @else if (filteredTypes().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📄</span>
            <h3>No se encontraron tipos de documento</h3>
          </div>
        } @else {
          <!-- Vista de Tabla (Desktop) -->
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th class="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (type of filteredTypes(); track type.id) {
                  <tr>
                    <td>{{ type.id }}</td>
                    <td class="font-semibold">{{ type.nombre }}</td>
                    <td class="description-col">{{ type.descripcion || '-' }}</td>
                    <td>
                      <span 
                        class="status-badge"
                        [class.status-active]="type.isActive"
                        [class.status-inactive]="!type.isActive"
                      >
                        {{ type.isActive ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>{{ type.created_at ? (type.created_at | date:'dd/MM/yyyy') : '-' }}</td>
                    <td class="actions-col">
                      <div class="action-buttons">
                        <button class="btn-icon btn-edit" (click)="openEditModal(type)" title="Editar">✏️</button>
                        <button class="btn-icon btn-toggle" (click)="toggleStatus(type)" [title]="type.isActive ? 'Desactivar' : 'Activar'">
                          {{ type.isActive ? '🚫' : '✅' }}
                        </button>
                        <button class="btn-icon btn-delete" (click)="deleteType(type)" title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Vista de Cards (Móvil) -->
          <div class="cards-wrapper">
            @for (type of filteredTypes(); track type.id) {
              <div class="admin-card">
                <div class="card-header">
                  <div class="card-id">ID: {{ type.id }}</div>
                  <span 
                    class="status-badge"
                    [class.status-active]="type.isActive"
                    [class.status-inactive]="!type.isActive"
                  >
                    {{ type.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>

                <div class="card-body">
                  <div class="card-title-section">
                    <div class="card-title">{{ type.nombre }}</div>
                  </div>

                  @if (type.descripcion) {
                    <div class="card-description">
                      {{ type.descripcion }}
                    </div>
                  }

                  <div class="card-meta">
                    <div class="meta-item">
                      <span class="meta-label">Fecha creación:</span>
                      <span class="meta-value">{{ type.created_at ? (type.created_at | date:'dd/MM/yyyy') : '-' }}</span>
                    </div>
                  </div>
                </div>

                <div class="card-actions">
                  <button 
                    class="btn-card btn-edit" 
                    (click)="openEditModal(type)"
                  >
                    <span class="btn-icon">✏️</span>
                    <span class="btn-text">Editar</span>
                  </button>
                  <button 
                    class="btn-card btn-toggle" 
                    (click)="toggleStatus(type)"
                  >
                    <span class="btn-icon">{{ type.isActive ? '🚫' : '✅' }}</span>
                    <span class="btn-text">{{ type.isActive ? 'Desactivar' : 'Activar' }}</span>
                  </button>
                  <button 
                    class="btn-card btn-delete" 
                    (click)="deleteType(type)"
                  >
                    <span class="btn-icon">🗑️</span>
                    <span class="btn-text">Eliminar</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ modalMode() === 'create' ? 'Nuevo Tipo' : 'Editar Tipo' }}</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre <span class="required">*</span></label>
              <input type="text" [(ngModel)]="formData().nombre" class="form-input" placeholder="Ej: Oficio"/>
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea [(ngModel)]="formData().descripcion" class="form-textarea" rows="3" placeholder="Descripción del tipo de documento..."></textarea>
            </div>
            @if (modalMode() === 'create') {
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData().isActive" class="form-checkbox"/>
                  <span>Activar tipo al crearlo</span>
                </label>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button class="btn-primary" (click)="saveType()" [disabled]="loading()">
              @if (loading()) { <span class="spinner-small"></span> }
              {{ modalMode() === 'create' ? 'Crear Tipo' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './document-types-list.component.scss'
})
export class DocumentTypesListComponent implements OnInit {
  types = signal<DocumentType[]>([]);
  filteredTypes = signal<DocumentType[]>([]);
  loading = signal(false);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  formData = signal({ id: 0, nombre: '', descripcion: '', isActive: true });
  searchTerm = '';
  filterStatus = 'all';
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private typeService: DocumentTypeService) {}

  ngOnInit(): void { this.loadTypes(); }

  loadTypes(): void {
    this.loading.set(true);
    this.typeService.getAll().subscribe({
      next: (res) => { if (res.success && res.data) { this.types.set(res.data); this.applyFilters(); } this.loading.set(false); },
      error: () => { this.showError('Error al cargar tipos'); this.loading.set(false); }
    });
  }

  applyFilters(): void {
    let filtered = this.types();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.nombre.toLowerCase().includes(term));
    }
    if (this.filterStatus !== 'all') {
      const isActive = this.filterStatus === 'active';
      filtered = filtered.filter(t => t.isActive === isActive);
    }
    this.filteredTypes.set(filtered);
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.formData.set({ id: 0, nombre: '', descripcion: '', isActive: true });
    this.showModal.set(true);
  }

  openEditModal(type: DocumentType): void {
    this.modalMode.set('edit');
    this.formData.set({ id: type.id, nombre: type.nombre, descripcion: type.descripcion || '', isActive: type.isActive });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.clearMessages(); }

  saveType(): void {
    const data = this.formData();
    if (!data.nombre) { this.showError('El nombre es obligatorio'); return; }
    this.loading.set(true);
    const action = this.modalMode() === 'create' 
      ? this.typeService.create({ nombre: data.nombre, descripcion: data.descripcion, isActive: data.isActive })
      : this.typeService.update(data.id, { nombre: data.nombre, descripcion: data.descripcion });
    action.subscribe({
      next: () => { this.showSuccess(`Tipo ${this.modalMode() === 'create' ? 'creado' : 'actualizado'}`); this.loadTypes(); this.closeModal(); this.loading.set(false); },
      error: (err) => { this.showError(err.error?.message || 'Error'); this.loading.set(false); }
    });
  }

  toggleStatus(type: DocumentType): void {
    if (confirm(`¿${type.isActive ? 'Desactivar' : 'Activar'} "${type.nombre}"?`)) {
      const action = type.isActive ? this.typeService.deactivate(type.id) : this.typeService.activate(type.id);
      action.subscribe({
        next: () => { this.showSuccess(`Tipo ${type.isActive ? 'desactivado' : 'activado'}`); this.loadTypes(); },
        error: () => this.showError('Error al cambiar estado')
      });
    }
  }

  deleteType(type: DocumentType): void {
    if (confirm(`¿Eliminar "${type.nombre}"?`)) {
      this.typeService.delete(type.id).subscribe({
        next: () => { this.showSuccess('Tipo eliminado'); this.loadTypes(); },
        error: (err) => this.showError(err.error?.message || 'Error al eliminar')
      });
    }
  }

  showSuccess(msg: string): void { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(''), 3000); }
  showError(msg: string): void { this.errorMessage.set(msg); setTimeout(() => this.errorMessage.set(''), 5000); }
  clearMessages(): void { this.successMessage.set(''); this.errorMessage.set(''); }
}
