import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { UserSession } from '../../core/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user = signal<User | null>(null);
  sessions = signal<UserSession[]>([]);
  isLoadingSessions = signal(false);
  
  // Computed values
  userName = computed(() => this.user()?.nombre || 'Usuario');
  userRole = computed(() => this.user()?.role?.nombre || 'Sin rol');
  userArea = computed(() => this.user()?.area?.nombre || 'Sin área');
  activeSessions = computed(() => 
    this.sessions().filter(s => s.isActive).length
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load user data from memory
    this.user.set(this.authService.currentUser());
    
    // Load sessions
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoadingSessions.set(true);
    this.authService.getSessions().subscribe({
      next: (response) => {
        console.log('📊 Sessions response:', response);
        if (response.success && response.data) {
          console.log('✅ Sessions data:', response.data);
          this.sessions.set(response.data);
          console.log('🔢 Active sessions count:', this.activeSessions());
        }
        this.isLoadingSessions.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading sessions:', error);
        this.isLoadingSessions.set(false);
      }
    });
  }

  onLogout(): void {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      const result = this.authService.logout();
      if (result) {
        result.subscribe({
          next: () => {
            // AuthService already navigates to /login
          },
          error: () => {
            // Navigate anyway
            this.router.navigate(['/login']);
          }
        });
      } else {
        // Already logged out (no token)
        this.router.navigate(['/login']);
      }
    }
  }

  onLogoutAll(): void {
    if (confirm('¿Está seguro que desea cerrar todas las sesiones activas? Esto cerrará su sesión en todos los dispositivos.')) {
      this.authService.logoutAll().subscribe({
        next: () => {
          // AuthService already navigates to /login
        },
        error: (error) => {
          console.error('Error during logout all:', error);
          this.router.navigate(['/login']);
        }
      });
    }
  }

  navigateToSessions(): void {
    this.router.navigate(['/sessions']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
