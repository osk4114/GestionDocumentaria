import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  // Signals para reactividad
  credentials = signal<LoginCredentials>({ email: '', password: '' });
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  warningMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si viene de una sesión cerrada desde otro dispositivo
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'session-closed') {
        this.warningMessage.set('⚠️ Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo');
      }
    });
  }

  /**
   * Manejar submit del formulario
   */
  onSubmit(): void {
    this.errorMessage.set(null);

    // Validaciones básicas
    if (!this.credentials().email || !this.credentials().password) {
      this.errorMessage.set('Por favor complete todos los campos');
      return;
    }

    if (!this.isValidEmail(this.credentials().email)) {
      this.errorMessage.set('Por favor ingrese un email válido');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.credentials()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          console.log('✅ Login exitoso');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('❌ Error en login:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage.set('Credenciales incorrectas');
        } else if (error.status === 429) {
          this.errorMessage.set('Demasiados intentos. Intente en 15 minutos');
        } else if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('Error al iniciar sesión. Intente nuevamente');
        }
      }
    });
  }

  /**
   * Toggle visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Actualizar email
   */
  updateEmail(email: string): void {
    this.credentials.update(creds => ({ ...creds, email }));
  }

  /**
   * Actualizar password
   */
  updatePassword(password: string): void {
    this.credentials.update(creds => ({ ...creds, password }));
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
