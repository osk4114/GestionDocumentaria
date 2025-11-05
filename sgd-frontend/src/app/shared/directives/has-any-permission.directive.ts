import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { Subscription } from 'rxjs';

/**
 * Directiva estructural para mostrar/ocultar elementos según múltiples permisos (OR lógico)
 * El elemento se muestra si el usuario tiene AL MENOS UNO de los permisos especificados
 * 
 * Uso:
 * <button *hasAnyPermission="['users.create', 'users.edit.all']">Gestionar Usuarios</button>
 * <div *hasAnyPermission="['documents.view.all', 'documents.view.area', 'documents.view.own']">
 *   Ver Documentos
 * </div>
 * 
 * Con else template:
 * <button *hasAnyPermission="['users.create', 'users.edit.all']; else noPermission">
 *   Gestionar Usuarios
 * </button>
 * <ng-template #noPermission>
 *   <span class="text-gray-400">Sin permisos de gestión</span>
 * </ng-template>
 */
@Directive({
  selector: '[hasAnyPermission]',
  standalone: true
})
export class HasAnyPermissionDirective implements OnInit, OnDestroy {
  private permissionCodes: string[] = [];
  private elseTemplateRef: TemplateRef<any> | null = null;
  private subscription?: Subscription;
  private hasView = false;

  @Input() set hasAnyPermission(permissions: string[]) {
    this.permissionCodes = permissions || [];
    this.updateView();
  }

  @Input() set hasAnyPermissionElse(templateRef: TemplateRef<any>) {
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

    const hasPermission = this.permissionService.hasAnyPermission(this.permissionCodes);

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
