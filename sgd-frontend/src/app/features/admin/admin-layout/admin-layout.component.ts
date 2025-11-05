import { Component, signal, inject, HostListener, OnInit } from '@angular/core';
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
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);
  isMobile = signal(false);
  currentUser = this.authService.currentUser;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/admin', active: true },
    { label: 'Áreas', icon: '🏢', route: '/admin/areas', active: false },
    { label: 'Roles', icon: '👥', route: '/admin/roles', active: false },
    { label: 'Usuarios', icon: '👤', route: '/admin/users', active: false },
    { label: 'Categorías', icon: '🏷️', route: '/admin/categories', active: false },
    { label: 'Reportes', icon: '📈', route: '/admin/reports', active: false }
  ];

  ngOnInit(): void {
    this.checkScreenSize();
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
