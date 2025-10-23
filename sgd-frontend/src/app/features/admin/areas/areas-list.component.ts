import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreaService, Area } from '../../../core/services/area.service';

@Component({
  selector: 'app-areas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './areas-list.component.html',
  styleUrl: './areas-list.component.scss'
})
export class AreasListComponent implements OnInit {
  areas = signal<Area[]>([]);
  filteredAreas = signal<Area[]>([]);
  loading = signal(false);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  
  // Formulario
  formData = signal({
    id: 0,
    nombre: '',
    sigla: '',
    descripcion: '',
    isActive: true
  });

  // Búsqueda y filtros
  searchTerm = '';
  filterStatus = 'all'; // all, active, inactive

  // Mensajes
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private areaService: AreaService) {}

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.loading.set(true);
    this.areaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.areas.set(response.data);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.showError('Error al cargar las áreas');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.areas();

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(area =>
        area.nombre.toLowerCase().includes(term) ||
        area.sigla.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.filterStatus !== 'all') {
      const isActive = this.filterStatus === 'active';
      filtered = filtered.filter(area => area.isActive === isActive);
    }

    this.filteredAreas.set(filtered);
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.formData.set({
      id: 0,
      nombre: '',
      sigla: '',
      descripcion: '',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(area: Area): void {
    this.modalMode.set('edit');
    this.formData.set({
      id: area.id,
      nombre: area.nombre,
      sigla: area.sigla,
      descripcion: area.descripcion || '',
      isActive: area.isActive
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.clearMessages();
  }

  saveArea(): void {
    const data = this.formData();
    
    // Validaciones
    if (!data.nombre || !data.sigla) {
      this.showError('El nombre y la sigla son obligatorios');
      return;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      // Crear nueva área
      this.areaService.create({
        nombre: data.nombre,
        sigla: data.sigla,
        descripcion: data.descripcion,
        isActive: data.isActive
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Área creada exitosamente');
            this.loadAreas();
            this.closeModal();
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al crear área:', error);
          this.showError(error.error?.message || 'Error al crear el área');
          this.loading.set(false);
        }
      });
    } else {
      // Actualizar área existente
      this.areaService.update(data.id, {
        nombre: data.nombre,
        sigla: data.sigla,
        descripcion: data.descripcion
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Área actualizada exitosamente');
            this.loadAreas();
            this.closeModal();
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar área:', error);
          this.showError(error.error?.message || 'Error al actualizar el área');
          this.loading.set(false);
        }
      });
    }
  }

  toggleStatus(area: Area): void {
    if (confirm(`¿Está seguro de ${area.isActive ? 'desactivar' : 'activar'} el área "${area.nombre}"?`)) {
      const action = area.isActive 
        ? this.areaService.deactivate(area.id)
        : this.areaService.activate(area.id);

      action.subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(`Área ${area.isActive ? 'desactivada' : 'activada'} exitosamente`);
            this.loadAreas();
          }
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.showError('Error al cambiar el estado del área');
        }
      });
    }
  }

  deleteArea(area: Area): void {
    if (confirm(`¿Está seguro de eliminar el área "${area.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      this.areaService.delete(area.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Área eliminada exitosamente');
            this.loadAreas();
          }
        },
        error: (error) => {
          console.error('Error al eliminar área:', error);
          this.showError(error.error?.message || 'Error al eliminar el área');
        }
      });
    }
  }

  showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
