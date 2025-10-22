import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { WebSocketService } from './websocket.service';
import { 
  LoginCredentials, 
  LoginResponse, 
  RefreshTokenResponse, 
  UserSession,
  ChangePasswordRequest,
  RegisterRequest
} from '../models/auth.model';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // Signals para estado reactivo (Angular 17)
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => !!this.currentUser());
  public userRole = computed(() => this.currentUser()?.role?.nombre || null);
  
  // BehaviorSubject para compatibilidad con Guards
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router,
    private websocketService: WebSocketService
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Cargar usuario desde localStorage al iniciar
   */
  private loadUserFromStorage(): void {
    const user = this.storage.getUser();
    const hasToken = this.storage.hasToken();
    
    if (user && hasToken && !this.storage.isTokenExpired()) {
      this.currentUser.set(user);
      this.isAuthenticatedSubject.next(true);
      
      // 🔌 Conectar WebSocket si el usuario ya estaba autenticado
      this.websocketService.connect();
    } else {
      this.logout();
    }
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          const { token, refreshToken, sessionId, user } = response.data;
          
          // Guardar en storage
          this.storage.setToken(token);
          this.storage.setRefreshToken(refreshToken);
          this.storage.setSessionId(sessionId);
          this.storage.setUser(user);
          
          // Actualizar estado
          this.currentUser.set(user);
          this.isAuthenticatedSubject.next(true);

          // 🔌 Conectar WebSocket para recibir notificaciones en tiempo real
          this.websocketService.connect();
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Registrar nuevo usuario (solo admin)
   */
  register(data: RegisterRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.API_URL}/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Logout - cerrar sesión actual
   */
  logout(): Observable<any> | void {
    const token = this.storage.getToken();
    
    if (token) {
      return this.http.post(`${this.API_URL}/logout`, {}).pipe(
        tap(() => this.clearAuthData()),
        catchError(() => {
          this.clearAuthData();
          return throwError(() => new Error('Error al cerrar sesión'));
        })
      );
    } else {
      this.clearAuthData();
    }
  }

  /**
   * Cerrar todas las sesiones excepto la actual
   */
  logoutAll(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_URL}/logout-all`, {}).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Renovar token con refresh token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.storage.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          const { token, refreshToken: newRefreshToken, sessionId } = response.data;
          
          this.storage.setToken(token);
          this.storage.setRefreshToken(newRefreshToken);
          this.storage.setSessionId(sessionId);
        }
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storage.setUser(response.data);
          this.currentUser.set(response.data);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/change-password`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Listar sesiones activas del usuario
   */
  getSessions(): Observable<ApiResponse<UserSession[]>> {
    return this.http.get<ApiResponse<UserSession[]>>(`${this.API_URL}/sessions`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Revocar sesión específica
   */
  revokeSession(sessionId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/sessions/${sessionId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Limpiar datos de autenticación
   */
  private clearAuthData(): void {
    this.storage.clearAll();
    this.currentUser.set(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return this.storage.getToken();
  }

  /**
   * Manejador de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en AuthService:', error);
    return throwError(() => error);
  }
}
