import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  
  // Exponer toasts como señal de solo lectura
  readonly toasts$ = this.toasts.asReadonly();

  constructor() {}

  /**
   * Mostrar toast de éxito
   */
  success(title: string, message: string, duration: number = 5000): void {
    this.show('success', title, message, duration);
  }

  /**
   * Mostrar toast de error
   */
  error(title: string, message: string, duration: number = 7000): void {
    this.show('error', title, message, duration);
  }

  /**
   * Mostrar toast de advertencia
   */
  warning(title: string, message: string, duration: number = 6000): void {
    this.show('warning', title, message, duration);
  }

  /**
   * Mostrar toast de información
   */
  info(title: string, message: string, duration: number = 5000): void {
    this.show('info', title, message, duration);
  }

  /**
   * Mostrar toast genérico
   */
  private show(type: Toast['type'], title: string, message: string, duration: number): void {
    const toast: Toast = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    };

    // Agregar toast al array
    this.toasts.update(current => [...current, toast]);

    // Auto-remover después de la duración
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  /**
   * Remover toast por ID
   */
  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  /**
   * Limpiar todos los toasts
   */
  clear(): void {
    this.toasts.set([]);
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
