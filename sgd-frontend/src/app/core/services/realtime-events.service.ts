import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { ToastService } from './toast.service';

/**
 * ============================================================
 * SERVICIO DE EVENTOS EN TIEMPO REAL - FRONTEND
 * ============================================================
 * 
 * Escucha eventos del backend via WebSocket y actualiza el estado
 * de la aplicación sin necesidad de hacer refresh.
 * 
 * Eventos escuchados:
 * - document:created    - Nuevo documento creado
 * - document:derived    - Documento derivado a tu área
 * - document:updated    - Documento actualizado
 * - document:assigned   - Documento asignado a ti
 * - document:finalized  - Documento finalizado
 * - document:archived   - Documento archivado
 * 
 * Uso en componentes:
 * ```typescript
 * constructor(private realtimeEvents: RealtimeEventsService) {
 *   effect(() => {
 *     const newDoc = this.realtimeEvents.lastDocumentCreated();
 *     if (newDoc) {
 *       this.refreshList();
 *     }
 *   });
 * }
 * ```
 * 
 * @author Sistema SGD
 * @version 1.0
 * @date 2025-11-12
 */

export interface DocumentEvent {
  event: string;
  timestamp: string;
  document: any;
  message: string;
  // Campos adicionales según el evento
  fromAreaId?: number;
  toAreaId?: number;
  assignedUserId?: number;
  changedFields?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeEventsService {
  
  // 🔔 Subjects para emitir eventos (en lugar de signals que causan loops)
  private documentCreated$ = new Subject<DocumentEvent>();
  private documentDerived$ = new Subject<DocumentEvent>();
  private documentUpdated$ = new Subject<DocumentEvent>();
  private documentAssigned$ = new Subject<DocumentEvent>();
  private documentFinalized$ = new Subject<DocumentEvent>();
  private documentArchived$ = new Subject<DocumentEvent>();
  private userUpdated$ = new Subject<any>(); // Nuevo evento para usuarios

  // 🔔 Signals SOLO para lectura (no se modifican desde componentes)
  lastDocumentCreated = signal<DocumentEvent | null>(null);
  lastDocumentDerived = signal<DocumentEvent | null>(null);
  lastDocumentUpdated = signal<DocumentEvent | null>(null);
  lastDocumentAssigned = signal<DocumentEvent | null>(null);
  lastDocumentFinalized = signal<DocumentEvent | null>(null);
  lastDocumentArchived = signal<DocumentEvent | null>(null);
  lastUserUpdated = signal<any | null>(null); // Nuevo signal

  // 📊 Contador de eventos pendientes (para badge)
  pendingEventsCount = signal<number>(0);

  // 🎯 Lista de todos los eventos recientes (últimos 50)
  recentEvents = signal<DocumentEvent[]>([]);

  constructor(
    private websocket: WebSocketService,
    private toast: ToastService
  ) {
    this.initializeListeners();
  }

  /**
   * Inicializar listeners de eventos WebSocket
   * SOLUCIÓN: Usar Subjects en lugar de modificar signals directamente
   */
  private initializeListeners(): void {
    // Documento creado
    this.websocket.on('document:created', (data: DocumentEvent) => {
      console.log('📄 Evento recibido: document:created', data);
      const doc = data.document;
      const trackingCode = doc.tracking_code || doc.trackingCode || 'Sin código';
      const asunto = doc.asunto || 'Sin asunto';
      
      // Emitir a través del Subject (no modificar signal directamente)
      this.documentCreated$.next(data);
      this.toast.info(
        '📄 Nuevo Documento',
        `${trackingCode}: ${asunto.substring(0, 50)}${asunto.length > 50 ? '...' : ''}`
      );
    });

    // Documento derivado
    this.websocket.on('document:derived', (data: DocumentEvent) => {
      console.log('📤 Evento recibido: document:derived', data);
      const doc = data.document;
      const trackingCode = doc.tracking_code || doc.trackingCode || 'Sin código';
      
      this.documentDerived$.next(data);
      this.toast.warning(
        '📤 Documento Derivado',
        `${trackingCode} llegó a tu área`
      );
    });

    // Documento actualizado
    this.websocket.on('document:updated', (data: DocumentEvent) => {
      console.log('✏️ Evento recibido: document:updated', data);
      this.documentUpdated$.next(data);
    });

    // Documento asignado
    this.websocket.on('document:assigned', (data: DocumentEvent) => {
      console.log('👤 Evento recibido: document:assigned', data);
      const doc = data.document;
      const trackingCode = doc.tracking_code || doc.trackingCode || 'Sin código';
      
      this.documentAssigned$.next(data);
      this.toast.info(
        '👤 Documento Asignado',
        `${trackingCode} te fue asignado`
      );
    });

    // Documento finalizado
    this.websocket.on('document:finalized', (data: DocumentEvent) => {
      console.log('✅ Evento recibido: document:finalized', data);
      const doc = data.document;
      const trackingCode = doc.tracking_code || doc.trackingCode || 'Sin código';
      
      this.documentFinalized$.next(data);
      this.toast.success(
        '✅ Documento Finalizado',
        `${trackingCode} fue atendido`
      );
    });

    // Documento archivado
    this.websocket.on('document:archived', (data: DocumentEvent) => {
      console.log('📦 Evento recibido: document:archived', data);
      const doc = data.document;
      const trackingCode = doc.tracking_code || doc.trackingCode || 'Sin código';
      
      this.documentArchived$.next(data);
      this.toast.info(
        '📦 Documento Archivado',
        `${trackingCode} fue archivado`
      );
    });

    // Usuario actualizado (nuevo evento)
    this.websocket.on('user:updated', (data: any) => {
      console.log('👤 Evento recibido: user:updated', data);
      this.lastUserUpdated.set(data);
      this.userUpdated$.next(data);
      
      // Mostrar notificación si hubo cambio de rol
      if (data.changedFields?.includes('rolId')) {
        this.toast.info(
          '👤 Perfil Actualizado',
          'Tu rol ha sido modificado. Actualizando permisos...'
        );
      }
    });
  }

  /**
   * Agregar evento a la lista de eventos recientes
   */
  private addToRecentEvents(event: DocumentEvent): void {
    const current = this.recentEvents();
    const updated = [event, ...current].slice(0, 50); // Mantener solo últimos 50
    this.recentEvents.set(updated);
  }

  /**
   * Incrementar contador de eventos pendientes
   */
  private incrementPendingEvents(): void {
    this.pendingEventsCount.update(count => count + 1);
  }

  /**
   * Limpiar contador de eventos pendientes
   */
  clearPendingEvents(): void {
    this.pendingEventsCount.set(0);
  }

  /**
   * Limpiar un evento específico
   */
  clearEvent(eventType: 'created' | 'derived' | 'updated' | 'assigned' | 'finalized' | 'archived'): void {
    switch(eventType) {
      case 'created':
        this.lastDocumentCreated.set(null);
        break;
      case 'derived':
        this.lastDocumentDerived.set(null);
        break;
      case 'updated':
        this.lastDocumentUpdated.set(null);
        break;
      case 'assigned':
        this.lastDocumentAssigned.set(null);
        break;
      case 'finalized':
        this.lastDocumentFinalized.set(null);
        break;
      case 'archived':
        this.lastDocumentArchived.set(null);
        break;
    }
  }

  /**
   * Limpiar todos los eventos
   */
  clearAllEvents(): void {
    this.lastDocumentCreated.set(null);
    this.lastDocumentDerived.set(null);
    this.lastDocumentUpdated.set(null);
    this.lastDocumentAssigned.set(null);
    this.lastDocumentFinalized.set(null);
    this.lastDocumentArchived.set(null);
    this.recentEvents.set([]);
    this.clearPendingEvents();
  }

  /**
   * Obtener documentos por evento
   */
  getDocumentsByEvent(eventType: string): any[] {
    return this.recentEvents().filter(e => e.event === eventType).map(e => e.document);
  }

  /**
   * Verificar si hay eventos nuevos
   */
  hasNewEvents(): boolean {
    return this.pendingEventsCount() > 0;
  }

  // ============================================================
  // MÉTODOS PARA SUSCRIBIRSE A EVENTOS (Subjects)
  // ============================================================

  /**
   * Obtener observable de documentos creados
   */
  getDocumentCreated$() {
    return this.documentCreated$.asObservable();
  }

  /**
   * Obtener observable de documentos derivados
   */
  getDocumentDerived$() {
    return this.documentDerived$.asObservable();
  }

  /**
   * Obtener observable de documentos actualizados
   */
  getDocumentUpdated$() {
    return this.documentUpdated$.asObservable();
  }

  /**
   * Obtener observable de documentos asignados
   */
  getDocumentAssigned$() {
    return this.documentAssigned$.asObservable();
  }

  /**
   * Obtener observable de documentos finalizados
   */
  getDocumentFinalized$() {
    return this.documentFinalized$.asObservable();
  }

  /**
   * Obtener observable de documentos archivados
   */
  getDocumentArchived$() {
    return this.documentArchived$.asObservable();
  }

  /**
   * Obtener observable de usuario actualizado
   */
  getUserUpdated$() {
    return this.userUpdated$.asObservable();
  }

}
