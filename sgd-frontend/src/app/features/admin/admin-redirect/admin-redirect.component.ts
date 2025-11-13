import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';

/**
 * Componente de redirección inteligente para el panel de administración.
 * Redirige al usuario a la primera sección del admin a la que tenga acceso.
 */
@Component({
  selector: 'app-admin-redirect',
  standalone: true,
  template: '<div class="loading">Redirigiendo...</div>',
  styles: [`
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.2rem;
      color: #666;
    }
  `]
})
export class AdminRedirectComponent implements OnInit {
  private router = inject(Router);
  private permissionService = inject(PermissionService);

  ngOnInit(): void {
    this.redirectToFirstAvailableSection();
  }

  private redirectToFirstAvailableSection(): void {
    // Orden de prioridad de las secciones
    const sections = [
      { path: 'users', permissions: ['users.view.all', 'users.view.area', 'area_mgmt.users.view'] },
      { path: 'roles', permissions: ['roles.view', 'area_mgmt.roles.view'] },
      { path: 'areas', permissions: ['areas.view.all'] },
      { path: 'document-types', permissions: ['document_types.view', 'area_mgmt.document_types.view'] },
      { path: 'categories', permissions: ['categories.view', 'area_mgmt.categories.full'] },
      { path: 'reports', permissions: ['reports.view.all', 'reports.view.area', 'area_mgmt.reports.view'] }
    ];

    // Buscar la primera sección con permisos
    for (const section of sections) {
      if (this.permissionService.hasAnyPermission(section.permissions)) {
        console.log(`✅ Redirigiendo a /admin/${section.path}`);
        this.router.navigate(['/admin', section.path]);
        return;
      }
    }

    // Si no tiene permisos para ninguna sección, redirigir al dashboard
    console.warn('⚠️ Usuario sin permisos de administración, redirigiendo al dashboard');
    this.router.navigate(['/dashboard']);
  }
}
