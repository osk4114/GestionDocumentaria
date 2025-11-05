import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { Subscription } from 'rxjs';

/**
 * Directiva estructural para mostrar/ocultar elementos según un permiso específico
 * 
 * Uso:
 * <button *hasPermission="'users.create'">Crear Usuario</button>
 * <div *hasPermission="'documents.edit.all'">Editar Documento</div>
 * 
 * Con else template:
 * <button *hasPermission="'users.create'; else noPermission">Crear Usuario</button>
 * <ng-template #noPermission>
 *   <span class="text-gray-400">Sin permisos</span>
 * </ng-template>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissionCode: string = '';
  private elseTemplateRef: TemplateRef<any> | null = null;
  private subscription?: Subscription;
  private hasView = false;

  @Input() set hasPermission(permission: string) {
    this.permissionCode = permission;
    this.updateView();
  }

  @Input() set hasPermissionElse(templateRef: TemplateRef<any>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en permisos (por si se recargan dinámicamente)
    this.subscription = this.permissionService.userPermissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    if (!this.permissionCode) return;

    const hasPermission = this.permissionService.hasPermission(this.permissionCode);

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
