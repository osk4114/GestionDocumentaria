import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarOpen = signal(true);
  currentUser = this.authService.currentUser;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/admin', active: true },
    { label: 'Áreas', icon: '🏢', route: '/admin/areas', active: false },
    { label: 'Roles', icon: '👥', route: '/admin/roles', active: false },
    { label: 'Usuarios', icon: '👤', route: '/admin/users', active: false },
    { label: 'Tipos de Documento', icon: '📄', route: '/admin/document-types', active: false },
    { label: 'Reportes', icon: '📈', route: '/admin/reports', active: false }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  setActive(index: number): void {
    this.menuItems.forEach((item, i) => {
      item.active = i === index;
    });
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
