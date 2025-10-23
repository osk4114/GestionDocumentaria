import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-container">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">Gestión de Roles</h1>
          <p class="page-subtitle">Administra los roles y permisos del sistema</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <span>➕</span> Nuevo Rol
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
              placeholder="Buscar roles..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          <div class="results-count">
            <span class="count-badge">{{ filteredRoles().length }}</span> resultados
          </div>
        </div>
      </div>

      <div class="table-card">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando roles...</p>
          </div>
        } @else if (filteredRoles().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <h3>No se encontraron roles</h3>
          </div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Fecha Creación</th>
                <th class="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (role of filteredRoles(); track role.id) {
                <tr>
                  <td>{{ role.id }}</td>
                  <td class="font-semibold">{{ role.nombre }}</td>
                  <td class="description-col">{{ role.descripcion || '-' }}</td>
                  <td>{{ role.created_at ? (role.created_at | date:'dd/MM/yyyy') : '-' }}</td>
                  <td class="actions-col">
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" (click)="openEditModal(role)" title="Editar">✏️</button>
                      <button class="btn-icon btn-delete" (click)="deleteRole(role)" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ modalMode() === 'create' ? 'Nuevo Rol' : 'Editar Rol' }}</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre <span class="required">*</span></label>
              <input type="text" [(ngModel)]="formData().nombre" class="form-input" placeholder="Ej: Administrador"/>
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea [(ngModel)]="formData().descripcion" class="form-textarea" rows="3" placeholder="Descripción del rol..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button class="btn-primary" (click)="saveRole()" [disabled]="loading()">
              @if (loading()) { <span class="spinner-small"></span> }
              {{ modalMode() === 'create' ? 'Crear Rol' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`@import '../areas/areas-list.component.scss';`]
})
export class RolesListComponent implements OnInit {
  roles = signal<Role[]>([]);
  filteredRoles = signal<Role[]>([]);
  loading = signal(false);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  formData = signal({ id: 0, nombre: '', descripcion: '' });
  searchTerm = '';
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private roleService: RoleService) {}

  ngOnInit(): void { this.loadRoles(); }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.getAll().subscribe({
      next: (res) => { if (res.success && res.data) { this.roles.set(res.data); this.applyFilters(); } this.loading.set(false); },
      error: (err) => { this.showError('Error al cargar roles'); this.loading.set(false); }
    });
  }

  applyFilters(): void {
    let filtered = this.roles();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.nombre.toLowerCase().includes(term));
    }
    this.filteredRoles.set(filtered);
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.formData.set({ id: 0, nombre: '', descripcion: '' });
    this.showModal.set(true);
  }

  openEditModal(role: Role): void {
    this.modalMode.set('edit');
    this.formData.set({ id: role.id, nombre: role.nombre, descripcion: role.descripcion || '' });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.clearMessages(); }

  saveRole(): void {
    const data = this.formData();
    if (!data.nombre) { this.showError('El nombre es obligatorio'); return; }
    this.loading.set(true);
    const action = this.modalMode() === 'create' 
      ? this.roleService.create({ nombre: data.nombre, descripcion: data.descripcion })
      : this.roleService.update(data.id, { nombre: data.nombre, descripcion: data.descripcion });
    action.subscribe({
      next: () => { this.showSuccess(`Rol ${this.modalMode() === 'create' ? 'creado' : 'actualizado'} exitosamente`); this.loadRoles(); this.closeModal(); this.loading.set(false); },
      error: (err) => { this.showError(err.error?.message || 'Error al guardar'); this.loading.set(false); }
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`¿Eliminar el rol "${role.nombre}"?`)) {
      this.roleService.delete(role.id).subscribe({
        next: () => { this.showSuccess('Rol eliminado'); this.loadRoles(); },
        error: (err) => this.showError(err.error?.message || 'Error al eliminar')
      });
    }
  }

  showSuccess(msg: string): void { this.successMessage.set(msg); setTimeout(() => this.successMessage.set(''), 3000); }
  showError(msg: string): void { this.errorMessage.set(msg); setTimeout(() => this.errorMessage.set(''), 5000); }
  clearMessages(): void { this.successMessage.set(''); this.errorMessage.set(''); }
}
