import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = environment.apiUrl.replace('/api', ''); // http://localhost:3000

  constructor(
    private router: Router,
    private storage: StorageService
  ) {}

  /**
   * Conectar al servidor WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('⚠️ WebSocket ya está conectado');
      return;
    }

    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', this.socket?.id);
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
    });

    // Escuchar fallo de autenticación
    this.socket.on('authentication-failed', (data: { reason: string; message: string }) => {
      console.error('🚫 Autenticación WebSocket fallida:', data);
      this.handleSessionInvalidated(data);
    });

    // Escuchar evento de sesión invalidada
    this.socket.on('session-invalidated', (data: { reason: string; message: string }) => {
      console.warn('🚨 Sesión invalidada:', data);
      this.handleSessionInvalidated(data);
    });
  }

  /**
   * Autenticar usuario con el servidor WebSocket
   */
  private authenticate(): void {
    const user = this.storage.getUser();
    const sessionId = this.storage.getSessionId();

    if (user && sessionId && this.socket) {
      this.socket.emit('authenticate', {
        userId: user.id,
        sessionId: sessionId
      });
      console.log(`🔐 Autenticación WebSocket enviada (userId: ${user.id}, sessionId: ${sessionId})`);
    }
  }

  /**
   * Manejar sesión invalidada
   */
  private handleSessionInvalidated(data: { reason: string; message: string }): void {
    console.error('🚨🚨🚨 SESIÓN INVALIDADA - Limpiando datos y redirigiendo 🚨🚨🚨');
    console.error('Razón:', data.reason);
    console.error('Mensaje:', data.message);

    // Desconectar WebSocket primero
    this.disconnect();

    // Limpiar storage local
    this.storage.clearAll();
    console.log('✓ Storage limpiado');

    // Redirigir al login
    console.log('🔄 Redirigiendo a /login...');
    this.router.navigate(['/login'], {
      queryParams: { reason: 'session-closed' }
    }).then(() => {
      console.log('✓ Redirección completada');
      // Mostrar alerta después de redirigir
      setTimeout(() => {
        alert(`⚠️ ${data.message}`);
      }, 500);
    });
  }

  /**
   * Desconectar del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket desconectado manualmente');
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Escuchar eventos personalizados
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Dejar de escuchar eventos
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Emitir evento al servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}
