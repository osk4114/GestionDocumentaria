import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { Subscription } from 'rxjs';

/**
 * Directiva estructural para mostrar/ocultar elementos según múltiples permisos (AND lógico)
 * El elemento se muestra SOLO si el usuario tiene TODOS los permisos especificados
 * 
 * Uso:
 * <button *hasAllPermissions="['users.view.all', 'users.edit.all']">Administrar Usuarios</button>
 * <div *hasAllPermissions="['documents.create', 'documents.finalize']">
 *   Crear y Finalizar Documento
 * </div>
 * 
 * Con else template:
 * <button *hasAllPermissions="['users.view.all', 'users.delete']; else noFullAccess">
 *   Administración Completa
 * </button>
 * <ng-template #noFullAccess>
 *   <span class="text-gray-400">Permisos insuficientes</span>
 * </ng-template>
 */
@Directive({
  selector: '[hasAllPermissions]',
  standalone: true
})
export class HasAllPermissionsDirective implements OnInit, OnDestroy {
  private permissionCodes: string[] = [];
  private elseTemplateRef: TemplateRef<any> | null = null;
  private subscription?: Subscription;
  private hasView = false;

  @Input() set hasAllPermissions(permissions: string[]) {
    this.permissionCodes = permissions || [];
    this.updateView();
  }

  @Input() set hasAllPermissionsElse(templateRef: TemplateRef<any>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en permisos
    this.subscription = this.permissionService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    if (!this.permissionCodes || this.permissionCodes.length === 0) return;

    const hasPermission = this.permissionService.hasAllPermissions(this.permissionCodes);

    if (hasPermission && !this.hasView) {
      // Mostrar el template principal
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Ocultar el template principal
      this.viewContainer.clear();
      this.hasView = false;
      
      // Mostrar el template else si existe
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
    } else if (!hasPermission && !this.hasView && this.elseTemplateRef) {
      // Caso inicial sin permisos: mostrar else
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }
}
