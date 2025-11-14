import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentVersionService, DocumentVersion, VersionUploadData } from '../../../core/services/document-version.service';
import { CargoService } from '../../../core/services/cargo.service';

@Component({
  selector: 'app-document-versions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-versions-modal.component.html',
  styleUrl: './document-versions-modal.component.scss'
})
export class DocumentVersionsModalComponent implements OnInit {
  @Input() documentId!: number;
  @Input() documentTrackingCode!: string;
  @Output() onClose = new EventEmitter<void>();
  @Output() onVersionUploaded = new EventEmitter<void>();

  // Signals
  versions = signal<DocumentVersion[]>([]);
  loading = signal(true);
  uploading = signal(false);
  showUploadForm = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Formulario de subida
  selectedFile: File | null = null;
  uploadDescription: string = '';
  uploadTieneSello: boolean = false;
  uploadTieneFirma: boolean = false;

  // Estado de conservar cargo
  conservandoCargo = signal(false);

  constructor(
    public versionService: DocumentVersionService,
    private cargoService: CargoService
  ) {}

  ngOnInit(): void {
    this.loadVersions();
  }

  /**
   * Cargar versiones del documento
   */
  loadVersions(): void {
    this.loading.set(true);
    this.versionService.getVersions(this.documentId).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.versions.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar versiones:', error);
        this.errorMessage.set('Error al cargar las versiones del documento');
        this.loading.set(false);
      }
    });
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage.set('El archivo no puede superar los 10MB');
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.errorMessage.set(null);
    }
  }

  /**
   * Subir nueva versión
   */
  uploadVersion(): void {
    if (!this.selectedFile) {
      this.errorMessage.set('Por favor selecciona un archivo');
      return;
    }

    const uploadData: VersionUploadData = {
      file: this.selectedFile,
      descripcion: this.uploadDescription.trim() || undefined,
      tieneSello: this.uploadTieneSello,
      tieneFirma: this.uploadTieneFirma
    };

    this.uploading.set(true);
    this.errorMessage.set(null);

    this.versionService.uploadVersion(this.documentId, uploadData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Nueva versión subida exitosamente');
          this.resetUploadForm();
          this.showUploadForm.set(false);
          this.loadVersions(); // Recargar lista
          this.onVersionUploaded.emit();
          
          // Limpiar mensaje después de 3 segundos
          setTimeout(() => this.successMessage.set(null), 3000);
        }
        this.uploading.set(false);
      },
      error: (error) => {
        console.error('Error al subir versión:', error);
        this.errorMessage.set(error.message || 'Error al subir la versión');
        this.uploading.set(false);
      }
    });
  }

  /**
   * Descargar versión
   */
  downloadVersion(version: DocumentVersion): void {
    this.versionService.downloadVersion(version.id, version.originalName);
  }

  /**
   * Eliminar versión
   */
  deleteVersion(version: DocumentVersion): void {
    if (!confirm(`¿Estás seguro de eliminar la versión ${version.versionNumber}?`)) {
      return;
    }

    this.versionService.deleteVersion(version.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Versión eliminada exitosamente');
          this.loadVersions(); // Recargar lista
          
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      },
      error: (error) => {
        console.error('Error al eliminar versión:', error);
        this.errorMessage.set(error.message || 'Error al eliminar la versión');
      }
    });
  }

  /**
   * Mostrar/ocultar formulario de subida
   */
  toggleUploadForm(): void {
    this.showUploadForm.set(!this.showUploadForm());
    if (!this.showUploadForm()) {
      this.resetUploadForm();
    }
  }

  /**
   * Resetear formulario
   */
  resetUploadForm(): void {
    this.selectedFile = null;
    this.uploadDescription = '';
    this.uploadTieneSello = false;
    this.uploadTieneFirma = false;
    this.errorMessage.set(null);
    
    // Limpiar input file
    const fileInput = document.getElementById('versionFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear tamaño
   */
  formatSize(bytes: number): string {
    return this.versionService.formatFileSize(bytes);
  }

  /**
   * Conservar versión como cargo
   */
  conservarCargo(version: DocumentVersion): void {
    const customName = prompt(
      `Conservar versión ${version.versionNumber} como cargo.\n\n` +
      `¿Deseas agregar un nombre personalizado? (opcional)`,
      `${this.documentTrackingCode} - v${version.versionNumber}`
    );

    // Si cancela, no hacer nada
    if (customName === null) {
      return;
    }

    this.conservandoCargo.set(true);
    this.errorMessage.set(null);

    this.cargoService.createCargo({
      versionId: version.id,
      customName: customName.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('✅ Cargo conservado exitosamente en la bandeja del área');
          setTimeout(() => this.successMessage.set(null), 4000);
        }
        this.conservandoCargo.set(false);
      },
      error: (error) => {
        console.error('Error al conservar cargo:', error);
        this.errorMessage.set(error.message || 'Error al conservar el cargo');
        this.conservandoCargo.set(false);
      }
    });
  }

  /**
   * Cerrar modal
   */
  close(): void {
    this.onClose.emit();
  }
}
