import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserSession } from '../../core/models/auth.model';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.scss'
})
export class SessionsComponent implements OnInit {
  sessions = signal<UserSession[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  currentSessionId = signal<string | null>(null);

  // Computed values
  activeSessions = computed(() => 
    this.sessions().filter(s => s.isActive).length
  );

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentSessionId();
    this.loadSessions();
  }

  loadCurrentSessionId(): void {
    const sessionId = localStorage.getItem('session_id');
    this.currentSessionId.set(sessionId);
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sessions.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.errorMessage.set('Error al cargar las sesiones');
        this.isLoading.set(false);
      }
    });
  }

  revokeSession(sessionId: number): void {
    if (!confirm('¿Estás seguro de que deseas cerrar esta sesión?')) {
      return;
    }

    this.authService.revokeSession(sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Sesión cerrada exitosamente');
          this.loadSessions();
          
          // Clear success message after 3 seconds
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      },
      error: (error) => {
        console.error('Error revoking session:', error);
        this.errorMessage.set('Error al cerrar la sesión');
        
        // Clear error message after 5 seconds
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  logoutAllDevices(): void {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión en todos los dispositivos? Esta acción cerrará todas las sesiones excepto la actual.')) {
      return;
    }

    this.authService.logoutAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Todas las sesiones han sido cerradas');
          this.loadSessions();
          
          // Clear success message after 3 seconds
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      },
      error: (error) => {
        console.error('Error logging out all devices:', error);
        this.errorMessage.set('Error al cerrar todas las sesiones');
        
        // Clear error message after 5 seconds
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  isCurrentSession(session: UserSession): boolean {
    return session.id.toString() === this.currentSessionId();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBrowserName(userAgent: string): string {
    if (!userAgent) return 'Desconocido';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    
    return 'Desconocido';
  }

  getDeviceType(userAgent: string): string {
    if (!userAgent) return 'Desconocido';
    
    if (userAgent.includes('Mobile')) return 'Móvil';
    if (userAgent.includes('Tablet')) return 'Tablet';
    
    return 'Escritorio';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
