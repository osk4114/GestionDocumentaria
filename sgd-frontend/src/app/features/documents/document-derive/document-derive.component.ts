import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreaService, Area } from '../../../core/services/area.service';
import { UserService, UserAdmin } from '../../../core/services/user.service';
import { DocumentService } from '../../../core/services/document.service';

interface DeriveData {
  toAreaId: number;
  toUserId?: number;
  observacion: string;
}

@Component({
  selector: 'app-document-derive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-derive.component.html',
  styleUrl: './document-derive.component.scss'
})
export class DocumentDeriveComponent implements OnInit {
  @Input() documentId!: number;
  @Input() documentCode!: string;
  @Input() documentSubject!: string;
  @Input() currentArea!: string;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<void>();

  areas = signal<Area[]>([]);
  users = signal<UserAdmin[]>([]);
  loading = signal(false);
  loadingUsers = signal(false);

  formData = signal<DeriveData>({
    toAreaId: 0,
    toUserId: undefined,
    observacion: ''
  });

  errorMessage = signal('');

  constructor(
    private areaService: AreaService,
    private userService: UserService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadAreas();
  }

  loadAreas(): void {
    this.areaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo áreas activas
          this.areas.set(response.data.filter(a => a.isActive));
        }
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
        this.showError('Error al cargar las áreas');
      }
    });
  }

  onAreaChange(): void {
    const data = this.formData();
    if (data.toAreaId) {
      this.loadUsersByArea(data.toAreaId);
    } else {
      this.users.set([]);
    }
    // Resetear usuario seleccionado
    this.formData.set({ ...data, toUserId: undefined });
  }

  loadUsersByArea(areaId: number): void {
    this.loadingUsers.set(true);
    this.userService.getByArea(areaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar solo usuarios activos
          this.users.set(response.data.filter(u => u.isActive));
        }
        this.loadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.users.set([]);
        this.loadingUsers.set(false);
      }
    });
  }

  derive(): void {
    const data = this.formData();

    // Validaciones
    if (!data.toAreaId) {
      this.showError('Debe seleccionar un área de destino');
      return;
    }

    if (!data.observacion.trim()) {
      this.showError('Debe ingresar una observación');
      return;
    }

    this.loading.set(true);

    // Llamar al servicio de documentos para derivar
    this.documentService.deriveDocument(this.documentId, {
      toAreaId: data.toAreaId,
      toUserId: data.toUserId || null,
      observacion: data.observacion
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loading.set(false);
          this.onSuccess.emit();
        }
      },
      error: (error) => {
        console.error('Error al derivar documento:', error);
        this.showError(error.error?.message || 'Error al derivar el documento');
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.onClose.emit();
  }

  // Helper methods para el template
  getAreaName(areaId: number): string {
    return this.areas().find(a => a.id === areaId)?.nombre || '';
  }

  getUserName(userId: number | undefined): string {
    if (!userId) return '';
    return this.users().find(u => u.id === userId)?.nombre || '';
  }

  showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}
