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
  senderForm: FormGroup;
  documentForm: FormGroup;
  
  loading = signal(false);
  submitSuccess = signal(false);
  trackingCode = signal('');
  errorMessage = signal('');
  
  step = signal<'sender' | 'document'>('sender');

  documentTypes = signal<any[]>([]);
  
  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'PASAPORTE', label: 'Pasaporte' },
    { value: 'CARNET_EXTRANJERIA', label: 'Carnet de Extranjería' }
  ];

  prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService
  ) {
    this.senderForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.email]],
      telefono: [''],
      direccion: ['']
    });

    this.documentForm = this.fb.group({
      documentTypeId: ['', Validators.required],
      asunto: ['', [Validators.required, Validators.minLength(5)]],
      descripcion: [''],
      prioridad: ['normal', Validators.required]
    });

    this.loadDocumentTypes();
  }

  loadDocumentTypes() {
    this.documentService.getDocumentTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.documentTypes.set(response.data);
        } else {
          // Fallback a tipos por defecto si falla
          this.documentTypes.set([
            { id: 1, nombre: 'Oficio' },
            { id: 2, nombre: 'Solicitud' },
            { id: 3, nombre: 'Memorándum' },
            { id: 4, nombre: 'Informe' },
            { id: 5, nombre: 'Carta' }
          ]);
        }
      },
      error: () => {
        // Fallback en caso de error
        this.documentTypes.set([
          { id: 1, nombre: 'Oficio' },
          { id: 2, nombre: 'Solicitud' },
          { id: 3, nombre: 'Memorándum' },
          { id: 4, nombre: 'Informe' },
          { id: 5, nombre: 'Carta' }
        ]);
      }
    });
  }

  nextStep() {
    if (this.senderForm.valid) {
      this.step.set('document');
    }
  }

  previousStep() {
    this.step.set('sender');
  }

  submitDocument() {
    if (this.senderForm.invalid || this.documentForm.invalid) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const submissionData = {
      sender: this.senderForm.value,
      document: this.documentForm.value
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
    this.senderForm.reset({ tipoDocumento: 'DNI', prioridad: 'normal' });
    this.documentForm.reset({ prioridad: 'normal' });
    this.step.set('sender');
    this.submitSuccess.set(false);
    this.trackingCode.set('');
    this.errorMessage.set('');
  }

}
