import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';

interface Notification {
  id: string;
  type: 'document' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  data?: any;
}

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.scss'
})
export class NotificationsPanelComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  isOpen = signal(false);

  // Computed: count unread
  unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );

  constructor(
    private wsService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.subscribeToWebSocket();
  }

  /**
   * Cargar notificaciones desde localStorage
   */
  private loadNotifications(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    const stored = localStorage.getItem(`notifications_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convertir timestamps a Date
        const notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifications.set(notifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }

  /**
   * Guardar notificaciones en localStorage
   */
  private saveNotifications(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    localStorage.setItem(
      `notifications_${userId}`,
      JSON.stringify(this.notifications())
    );
  }

  /**
   * Suscribirse a eventos de WebSocket
   */
  private subscribeToWebSocket(): void {
    // Escuchar nuevos documentos derivados
    this.wsService.on('documentDerived', (data: any) => {
      this.addNotification({
        type: 'document',
        title: '📤 Nuevo Documento Derivado',
        message: `Se derivó: ${data.trackingCode} - ${data.asunto}`,
        data
      });
    });

    // Escuchar nuevos documentos recibidos
    this.wsService.on('newDocument', (data: any) => {
      this.addNotification({
        type: 'document',
        title: '📥 Nuevo Documento Recibido',
        message: `Documento: ${data.trackingCode}`,
        data
      });
    });
  }

  /**
   * Agregar nueva notificación
   */
  addNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): void {
    const newNotification: Notification = {
      id: this.generateId(),
      ...notification,
      read: false,
      timestamp: new Date()
    };

    this.notifications.update(current => [newNotification, ...current].slice(0, 50)); // Max 50
    this.saveNotifications();
  }

  /**
   * Toggle panel
   */
  toggle(): void {
    this.isOpen.update(val => !val);
  }

  /**
   * Cerrar panel
   */
  close(): void {
    this.isOpen.set(false);
  }

  /**
   * Marcar notificación como leída
   */
  markAsRead(id: string): void {
    this.notifications.update(current =>
      current.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.saveNotifications();
  }

  /**
   * Marcar todas como leídas
   */
  markAllAsRead(): void {
    this.notifications.update(current =>
      current.map(n => ({ ...n, read: true }))
    );
    this.saveNotifications();
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(): void {
    this.notifications.set([]);
    this.saveNotifications();
  }

  /**
   * Formatear tiempo relativo
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    if (days < 7) return `Hace ${days} d`;
    
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  /**
   * Obtener icono por tipo
   */
  getIcon(type: Notification['type']): string {
    const icons = {
      document: '📄',
      message: '💬',
      system: '⚙️'
    };
    return icons[type];
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
