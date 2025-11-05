import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AreaCategoryService, AreaCategory } from '../../../core/services/area-category.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.scss'
})
export class CategoriesListComponent implements OnInit {
  categories = signal<AreaCategory[]>([]);
  loading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  // Formulario
  categoryForm = signal<Partial<AreaCategory>>({
    nombre: '',
    codigo: '',
    color: '#003876',
    descripcion: '',
    isActive: true
  });

  // Colores predefinidos
  colorOptions = [
    { name: 'Azul Institucional', value: '#003876' },
    { name: 'Rojo Institucional', value: '#C1272D' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Morado', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Índigo', value: '#6366f1' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Gris', value: '#6b7280' }
  ];

  currentUser = computed(() => this.authService.currentUser());
  userArea = computed(() => this.currentUser()?.area);

  constructor(
    private areaCategoryService: AreaCategoryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    const user = this.currentUser();
    if (!user || !user.areaId) {
      console.error('Usuario sin área asignada');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.areaCategoryService.getCategoriesByArea(user.areaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        this.loading.set(false);
        alert('Error al cargar categorías');
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.categoryForm.set({
      nombre: '',
      codigo: '',
      color: '#003876',
      descripcion: '',
      isActive: true
    });
    this.showModal.set(true);
  }

  openEditModal(category: AreaCategory): void {
    this.isEditing.set(true);
    this.categoryForm.set({ ...category });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.categoryForm.set({
      nombre: '',
      codigo: '',
      color: '#003876',
      descripcion: '',
      isActive: true
    });
  }

  saveCategory(): void {
    const form = this.categoryForm();
    const user = this.currentUser();

    if (!form.nombre || !form.codigo || !user?.areaId) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const categoryData = {
      nombre: form.nombre!,
      codigo: form.codigo!,
      color: form.color || '#003876',
      descripcion: form.descripcion || '',
      isActive: form.isActive !== false
    };

    if (this.isEditing() && form.id) {
      // Actualizar
      this.areaCategoryService.updateCategory(form.id, categoryData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Categoría actualizada exitosamente');
            this.closeModal();
            this.loadCategories();
          }
        },
        error: (error) => {
          console.error('Error al actualizar categoría:', error);
          alert(error.error?.message || 'Error al actualizar categoría');
        }
      });
    } else {
      // Crear
      this.areaCategoryService.createCategory(user.areaId, categoryData).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Categoría creada exitosamente');
            this.closeModal();
            this.loadCategories();
          }
        },
        error: (error) => {
          console.error('Error al crear categoría:', error);
          alert(error.error?.message || 'Error al crear categoría');
        }
      });
    }
  }

  toggleCategory(category: AreaCategory): void {
    const action = category.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${action} esta categoría?`)) {
      return;
    }

    this.areaCategoryService.toggleCategory(category.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Categoría ${action === 'activar' ? 'activada' : 'desactivada'} exitosamente`);
          this.loadCategories();
        }
      },
      error: (error) => {
        console.error(`Error al ${action} categoría:`, error);
        alert(error.error?.message || `Error al ${action} categoría`);
      }
    });
  }

  deleteCategory(category: AreaCategory): void {
    if (!confirm(`¿Está seguro de eliminar la categoría "${category.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.areaCategoryService.deleteCategory(category.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Categoría eliminada exitosamente');
          this.loadCategories();
        }
      },
      error: (error) => {
        console.error('Error al eliminar categoría:', error);
        alert(error.error?.message || 'Error al eliminar categoría');
      }
    });
  }

  updateFormField<K extends keyof AreaCategory>(field: K, value: AreaCategory[K]): void {
    this.categoryForm.update(form => ({ ...form, [field]: value }));
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
