import { Component, signal, inject, HostListener, OnInit, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { RealtimeEventsService } from '../../../core/services/realtime-events.service';
import { PERMISSION_DIRECTIVES } from '../../../shared/directives';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  permissions?: string[]; // Permisos requeridos (al menos uno)
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ...PERMISSION_DIRECTIVES],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  public permissionService = inject(PermissionService);
  private realtimeEvents = inject(RealtimeEventsService);
  private isRefreshingProfile = false; // Flag para evitar loops
  
  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);
  isMobile = signal(false);
  currentUser = this.authService.currentUser;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/admin', active: true },
    { label: 'Áreas', icon: '🏢', route: '/admin/areas', active: false, permissions: ['areas.view.all'] },
    { label: 'Roles', icon: '👥', route: '/admin/roles', active: false, permissions: ['roles.view', 'area_mgmt.roles.view'] },
    { label: 'Usuarios', icon: '👤', route: '/admin/users', active: false, permissions: ['users.view.all', 'users.view.area', 'area_mgmt.users.view'] },
    { label: 'Tipos de Documento', icon: '📋', route: '/admin/document-types', active: false, permissions: ['document_types.view', 'area_mgmt.document_types.view'] },
    { label: 'Categorías', icon: '🏷️', route: '/admin/categories', active: false, permissions: ['categories.view', 'area_mgmt.categories.full'] },
    { label: 'Reportes', icon: '📈', route: '/admin/reports', active: false, permissions: ['reports.view.all', 'reports.view.area', 'area_mgmt.reports.view'] }
  ];

  // Computed: filtrar menú según permisos
  visibleMenuItems = computed(() => {
    return this.menuItems.filter(item => {
      if (!item.permissions || item.permissions.length === 0) {
        return true; // Dashboard siempre visible
      }
      return this.permissionService.hasAnyPermission(item.permissions);
    });
  });

  constructor() {
    // 🔥 EVENTO: Usuario actualizado - Refrescar perfil automáticamente
    effect(() => {
      const userUpdated = this.realtimeEvents.lastUserUpdated();
      if (userUpdated) {
        // Usar untracked para evitar dependencias reactivas
        const currentUserId = untracked(() => this.currentUser()?.id);
        if (userUpdated.userId === currentUserId && !this.isRefreshingProfile) {
          console.log('👤 [LAYOUT] Perfil actualizado - Refrescando datos...');
          this.refreshUserProfile();
        }
      }
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  /**
   * Refrescar perfil del usuario cuando es actualizado por un admin
   */
  private refreshUserProfile(): void {
    if (this.isRefreshingProfile) return; // Evitar llamadas múltiples
    
    this.isRefreshingProfile = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ [LAYOUT] Perfil refrescado:', response.data.role?.nombre);
        }
        this.isRefreshingProfile = false;
      },
      error: (error) => {
        console.error('❌ Error al refrescar perfil:', error);
        this.isRefreshingProfile = false;
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobile.set(width < 768);
    
    // En mobile, sidebar cerrado por defecto
    if (width < 768) {
      this.sidebarOpen.set(false);
      this.mobileMenuOpen.set(false);
    } else {
      this.sidebarOpen.set(true);
      this.mobileMenuOpen.set(false);
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
    } else {
      this.sidebarOpen.set(!this.sidebarOpen());
    }
  }

  closeMobileMenu(): void {
    if (this.isMobile()) {
      this.mobileMenuOpen.set(false);
    }
  }

  setActive(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
    this.closeMobileMenu();
  }

  logout(): void {
    const result = this.authService.logout();
    if (result) {
      result.subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
