import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
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
export class PermissionSelectorComponent implements OnInit, OnChanges {
  @Input() selectedPermissionIds: number[] = [];
  @Output() permissionSelectionChange = new EventEmitter<number[]>();

  // Signals
  selectedPermissions = signal<number[]>([]);
  loading = signal(false);
  showDetails = false;
  expandedCategories = signal<Set<string>>(new Set());
  expandedGroups = signal<Set<string>>(new Set());

  constructor(private permissionMgmtService: PermissionManagementService) {}

  ngOnInit(): void {
    this.selectedPermissions.set([...this.selectedPermissionIds]);
    this.loadPermissions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 🔄 Actualizar permisos seleccionados cuando cambia el @Input
    if (changes['selectedPermissionIds'] && !changes['selectedPermissionIds'].firstChange) {
      const newIds = changes['selectedPermissionIds'].currentValue || [];
      console.log('🔄 [PERMISSION-SELECTOR] Actualizando permisos seleccionados:', newIds);
      this.selectedPermissions.set([...newIds]);
    }
  }

  get categories(): string[] {
    return this.permissionMgmtService.getCategories();
  }

  get totalPermissions() {
    return this.permissionMgmtService.availablePermissions().length;
  }

  // Detectar si el usuario solo tiene acceso a area_management (Jefe de Área)
  get isAreaManager(): boolean {
    const categories = this.categories;
    return categories.length === 1 && categories[0] === 'area_management';
  }

  // Obtener todos los permisos (para vista de Jefe de Área)
  get allPermissions(): Permission[] {
    return this.permissionMgmtService.availablePermissions();
  }

  // Agrupar permisos por funcionalidad/flujo de trabajo
  get permissionGroups(): { name: string; description: string; icon: string; permissions: Permission[] }[] {
    if (!this.isAreaManager) return [];

    const allPerms = this.allPermissions;
    
    return [
      {
        name: 'Gestión de Equipo',
        description: 'Crear, editar y gestionar usuarios de su área',
        icon: '👥',
        permissions: allPerms.filter(p => p.codigo.includes('.users.'))
      },
      {
        name: 'Configuración de Roles',
        description: 'Crear y asignar roles personalizados para su equipo',
        icon: '🎭',
        permissions: allPerms.filter(p => p.codigo.includes('.roles.'))
      },
      {
        name: 'Flujo Completo de Documentos',
        description: 'Ver, crear, editar, derivar, finalizar y archivar documentos',
        icon: '📋',
        permissions: allPerms.filter(p => 
          p.codigo.includes('.documents.') && 
          !p.codigo.includes('.stats')
        )
      },
      {
        name: 'Gestión de Archivos Adjuntos',
        description: 'Ver, subir, descargar y eliminar archivos adjuntos',
        icon: '📎',
        permissions: allPerms.filter(p => p.codigo.includes('.attachments.'))
      },
      {
        name: 'Control de Versiones',
        description: 'Ver, subir y gestionar versiones de documentos',
        icon: '📚',
        permissions: allPerms.filter(p => p.codigo.includes('.versions.'))
      },
      {
        name: 'Gestión de Movimientos',
        description: 'Aceptar, rechazar y completar derivaciones',
        icon: '↔️',
        permissions: allPerms.filter(p => p.codigo.includes('.movements.'))
      },
      {
        name: 'Tipos y Categorías',
        description: 'Configurar tipos de documento y categorías',
        icon: '🏷️',
        permissions: allPerms.filter(p => 
          p.codigo.includes('.document_types.') || 
          p.codigo.includes('.categories.')
        )
      },
      {
        name: 'Reportes y Estadísticas',
        description: 'Ver y exportar reportes del área',
        icon: '📊',
        permissions: allPerms.filter(p => 
          p.codigo.includes('.reports.') || 
          p.codigo.includes('.stats.')
        )
      }
    ].filter(group => group.permissions.length > 0); // Solo grupos con permisos
  }

  // Verificar si un grupo está completamente seleccionado
  isGroupSelected(group: { permissions: Permission[] }): boolean {
    return group.permissions.every(p => this.selectedPermissions().includes(p.id));
  }

  // Verificar si un grupo está parcialmente seleccionado
  isGroupPartiallySelected(group: { permissions: Permission[] }): boolean {
    const selected = group.permissions.filter(p => this.selectedPermissions().includes(p.id));
    return selected.length > 0 && selected.length < group.permissions.length;
  }

  // Seleccionar/deseleccionar grupo completo
  toggleGroup(group: { permissions: Permission[] }, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    let selected = [...this.selectedPermissions()];

    if (checkbox.checked) {
      // Agregar todos los permisos del grupo
      group.permissions.forEach(p => {
        if (!selected.includes(p.id)) {
          selected.push(p.id);
        }
      });
    } else {
      // Remover todos los permisos del grupo
      selected = selected.filter(id => 
        !group.permissions.some(p => p.id === id)
      );
    }

    this.selectedPermissions.set(selected);
    this.permissionSelectionChange.emit(selected);
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
      'auth': 'Sesiones, perfil y registro de usuarios',
      'users': 'Crear, editar y gestionar usuarios (propios o de área)',
      'roles': 'Crear roles personalizados y asignar permisos',
      'areas': 'Gestionar áreas/departamentos y sus estadísticas',
      'area_management': 'Gestión completa de SU área asignada (usuarios, docs, reportes) ⚠️ Combinar con "Documentos" para bandeja',
      'categories': 'Categorías personalizadas de documentos por área',
      'document_types': 'Tipos de documento globales del sistema',
      'documents': 'Ver, crear, editar y derivar documentos (NECESARIO para bandeja)',
      'attachments': 'Subir, descargar y eliminar archivos adjuntos',
      'versions': 'Gestionar versiones de documentos (con sello/firma)',
      'movements': 'Aceptar, rechazar y completar documentos derivados',
      'reports': 'Generar y exportar reportes del sistema',
      'system': 'Configuración avanzada y auditoría del sistema'
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

  toggleCategoryExpansion(category: string): void {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(category)) {
      expanded.delete(category);
    } else {
      expanded.add(category);
    }
    this.expandedCategories.set(expanded);
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories().has(category);
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

  // ============================================================
  // Métodos para expansión/colapso de grupos (JEFE DE ÁREA)
  // ============================================================
  
  toggleGroupExpansion(groupName: string): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    
    this.expandedGroups.set(newExpanded);
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups().has(groupName);
  }
}