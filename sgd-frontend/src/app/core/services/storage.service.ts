import { Injectable } from '@angular/core';

/**
 * Servicio para manejar el almacenamiento local de forma segura
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = 'sgd_access_token';
  private readonly REFRESH_TOKEN_KEY = 'sgd_refresh_token';
  private readonly USER_KEY = 'sgd_user_data';
  private readonly SESSION_ID_KEY = 'sgd_session_id';

  constructor() {}

  // ========== TOKEN ==========
  
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // ========== REFRESH TOKEN ==========
  
  setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  removeRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // ========== SESSION ID ==========
  
  setSessionId(sessionId: number): void {
    localStorage.setItem(this.SESSION_ID_KEY, sessionId.toString());
  }

  getSessionId(): number | null {
    const id = localStorage.getItem(this.SESSION_ID_KEY);
    return id ? parseInt(id, 10) : null;
  }

  removeSessionId(): void {
    localStorage.removeItem(this.SESSION_ID_KEY);
  }

  // ========== USER DATA ==========
  
  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // ========== CLEAR ALL ==========
  
  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
    this.removeSessionId();
  }

  // ========== UTILITY ==========
  
  hasToken(): boolean {
    return !!this.getToken();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
