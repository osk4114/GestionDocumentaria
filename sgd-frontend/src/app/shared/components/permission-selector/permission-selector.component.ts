import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionManagementService, Permission } from '../../../core/services/permission-management.service';

@Component({
  selector: 'app-permission-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-selector.component.html',
  styleUrl: './permission-selector.component.scss'
})
export class PermissionSelectorComponent implements OnInit {
  @Input() selectedPermissionIds: number[] = [];
  @Output() permissionSelectionChange = new EventEmitter<number[]>();

  // Signals
  selectedPermissions = signal<number[]>([]);
  loading = signal(false);
  showDetails = false;

  constructor(private permissionMgmtService: PermissionManagementService) {}

  ngOnInit(): void {
    this.selectedPermissions.set([...this.selectedPermissionIds]);
    this.loadPermissions();
  }

  get categories(): string[] {
    return this.permissionMgmtService.getCategories();
  }

  get totalPermissions() {
    return this.permissionMgmtService.availablePermissions().length;
  }

  loadPermissions(): void {
    if (this.permissionMgmtService.availablePermissions().length === 0) {
      this.loading.set(true);
      this.permissionMgmtService.loadPermissions();
      
      // Esperar a que terminen de cargar los permisos
      const checkLoading = () => {
        if (!this.permissionMgmtService.loading()) {
          this.loading.set(false);
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    }
  }

  getCategoryPermissions(category: string): Permission[] {
    return this.permissionMgmtService.getPermissionsByCategory(category);
  }

  formatCategoryName(category: string): string {
    return this.permissionMgmtService.formatCategoryName(category);
  }

  getCategoryIcon(category: string): string {
    return this.permissionMgmtService.getCategoryIcon(category);
  }

  getCategoryDescription(category: string): string {
    const descriptions: { [key: string]: string } = {
      'auth': 'Autenticación, sesiones y perfiles de usuario',
      'users': 'Gestión completa de usuarios del sistema',
      'roles': 'Creación y administración de roles y permisos',
      'areas': 'Gestión de áreas/departamentos organizacionales',
      'categories': 'Categorías de documentos por área',
      'document_types': 'Tipos de documentos del sistema',
      'documents': 'Gestión completa de documentos y tramites',
      'attachments': 'Archivos adjuntos y descargas',
      'versions': 'Control de versiones de documentos',
      'movements': 'Historial y seguimiento de documentos',
      'reports': 'Reportes y estadísticas del sistema',
      'system': 'Configuración y administración del sistema'
    };
    return descriptions[category] || 'Permisos del sistema';
  }

  getSelectedCategoriesCount(): number {
    return this.categories.filter(category => this.isCategorySelected(category)).length;
  }

  getCategoryColor(category: string): string {
    return this.permissionMgmtService.getCategoryColor(category);
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissions().includes(permissionId);
  }

  togglePermission(permissionId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const selected = [...this.selectedPermissions()];
    
    if (checkbox.checked) {
      if (!selected.includes(permissionId)) {
        selected.push(permissionId);
      }
    } else {
      const index = selected.indexOf(permissionId);
      if (index > -1) {
        selected.splice(index, 1);
      }
    }

    this.selectedPermissions.set(selected);
    this.permissionSelectionChange.emit(selected);
  }

  isCategorySelected(category: string): boolean {
    const categoryPermissions = this.getCategoryPermissions(category);
    return categoryPermissions.every(p => this.selectedPermissions().includes(p.id));
  }

  isCategoryPartiallySelected(category: string): boolean {
    const categoryPermissions = this.getCategoryPermissions(category);
    const selectedInCategory = categoryPermissions.filter(p => this.selectedPermissions().includes(p.id));
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissions.length;
  }

  toggleCategory(category: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const categoryPermissions = this.getCategoryPermissions(category);
    let selected = [...this.selectedPermissions()];

    if (checkbox.checked) {
      // Agregar todos los permisos de la categoría
      categoryPermissions.forEach(p => {
        if (!selected.includes(p.id)) {
          selected.push(p.id);
        }
      });
    } else {
      // Remover todos los permisos de la categoría
      selected = selected.filter(id => 
        !categoryPermissions.some(p => p.id === id)
      );
    }

    this.selectedPermissions.set(selected);
    this.permissionSelectionChange.emit(selected);
  }

  selectAll(): void {
    const allPermissionIds = this.permissionMgmtService.availablePermissions().map((p: Permission) => p.id);
    this.selectedPermissions.set(allPermissionIds);
    this.permissionSelectionChange.emit(allPermissionIds);
  }

  deselectAll(): void {
    this.selectedPermissions.set([]);
    this.permissionSelectionChange.emit([]);
  }
}