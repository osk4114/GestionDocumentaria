import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-submit-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-document.component.html',
  styleUrl: './submit-document.component.scss'
})
export class SubmitDocumentComponent {
  documentForm: FormGroup;
  
  loading = signal(false);
  submitSuccess = signal(false);
  trackingCode = signal('');
  errorMessage = signal('');
  selectedFiles = signal<File[]>([]);

  documentTypes = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService
  ) {
    this.documentForm = this.fb.group({
      // Información del solicitante
      tipoPersona: ['natural', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      
      // Descripción de la solicitud
      asunto: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: ['', Validators.maxLength(500)],
      
      // Documentos
      linkDescarga: [''],
      
      // Checkboxes
      aceptoPolitica: [false, Validators.requiredTrue],
      aceptoDeclaracion: [false, Validators.requiredTrue]
    });

    this.loadDocumentTypes();
  }

  loadDocumentTypes() {
    this.documentService.getDocumentTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.documentTypes.set(response.data);
        }
      },
      error: () => {
        // Fallback en caso de error
        this.documentTypes.set([
          { id: 1, nombre: 'Solicitud' },
          { id: 2, nombre: 'Oficio' },
          { id: 3, nombre: 'Carta' }
        ]);
      }
    });
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    const currentFiles = this.selectedFiles();
    
    // Calcular tamaño total
    const totalSize = [...currentFiles, ...files].reduce((acc, file) => acc + file.size, 0);
    const maxSize = 10 * 1024 * 1024; // 10 MB
    
    if (totalSize > maxSize) {
      this.errorMessage.set('El tamaño total de los archivos no debe superar 10 MB');
      return;
    }
    
    this.selectedFiles.set([...currentFiles, ...files]);
    this.errorMessage.set('');
  }

  removeFile(fileToRemove: File) {
    this.selectedFiles.set(this.selectedFiles().filter(file => file !== fileToRemove));
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  submitDocument() {
    if (this.documentForm.invalid) {
      this.errorMessage.set('Por favor complete todos los campos requeridos y acepte las condiciones');
      Object.keys(this.documentForm.controls).forEach(key => {
        this.documentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    // Preparar datos para envío según la nueva interfaz DocumentSubmission
    const submissionData: any = {
      tipoPersona: this.documentForm.get('tipoPersona')?.value,
      email: this.documentForm.get('email')?.value,
      telefono: this.documentForm.get('telefono')?.value,
      asunto: this.documentForm.get('asunto')?.value,
      descripcion: this.documentForm.get('descripcion')?.value || '',
      linkDescarga: this.documentForm.get('linkDescarga')?.value || '',
      prioridad: 'normal'
    };

    this.documentService.submitDocument(submissionData).subscribe({
      next: (response) => {
        if (response.success) {
          this.trackingCode.set(response.data.trackingCode);
          this.submitSuccess.set(true);
        } else {
          this.errorMessage.set(response.message || 'Error al registrar el documento');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Error al conectar con el servidor');
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.documentForm.reset({
      tipoPersona: 'natural',
      aceptoPolitica: false,
      aceptoDeclaracion: false
    });
    this.selectedFiles.set([]);
    this.submitSuccess.set(false);
    this.trackingCode.set('');
    this.errorMessage.set('');
  }

}
