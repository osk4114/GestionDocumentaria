import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { CustomValidators } from '../../shared/validators/custom-validators';

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
      tipoPersona: ['', Validators.required],
      
      // Campos para Persona Natural
      tipoDocumentoNatural: ['DNI'],
      numeroDocumentoNatural: [''],
      nombres: ['', CustomValidators.soloLetras()],
      apellidoPaterno: ['', CustomValidators.soloLetras()],
      apellidoMaterno: ['', CustomValidators.soloLetras()],
      
      // Campos para Persona Jurídica
      ruc: ['', CustomValidators.ruc()],
      nombreEmpresa: [''],
      tipoDocumentoRepresentante: ['DNI'],
      numeroDocumentoRepresentante: [''],
      nombresRepresentante: ['', CustomValidators.soloLetras()],
      apellidoPaternoRepresentante: ['', CustomValidators.soloLetras()],
      apellidoMaternoRepresentante: ['', CustomValidators.soloLetras()],
      
      // Dirección (común para ambos)
      departamento: ['', CustomValidators.soloLetras()],
      provincia: ['', CustomValidators.soloLetras()],
      distrito: ['', CustomValidators.soloLetras()],
      direccion: [''],
      
      // Contacto
      email: ['', [Validators.required, CustomValidators.email()]],
      telefono: ['', [Validators.required, CustomValidators.telefono()]],
      
      // Descripción de la solicitud
      asunto: ['', [Validators.required, CustomValidators.minLength(10), CustomValidators.maxLength(200)]],
      descripcion: ['', CustomValidators.maxLength(500)],
      
      // Documentos
      linkDescarga: [''],
      
      // Checkboxes
      aceptoPolitica: [false, Validators.requiredTrue],
      aceptoDeclaracion: [false, Validators.requiredTrue]
    });

    this.loadDocumentTypes();
    
    // Escuchar cambios en tipoPersona para actualizar validaciones
    this.documentForm.get('tipoPersona')?.valueChanges.subscribe(tipo => {
      this.updateValidations(tipo);
    });
    
    // NO inicializar validaciones hasta que el usuario seleccione
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

  updateValidations(tipoPersona: string) {
    if (tipoPersona === 'natural') {
      // Activar validaciones para persona natural
      this.documentForm.get('nombres')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      this.documentForm.get('apellidoPaterno')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      this.documentForm.get('apellidoMaterno')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      this.documentForm.get('numeroDocumentoNatural')?.setValidators([Validators.required, CustomValidators.dni()]);
      
      // Desactivar validaciones para persona jurídica
      this.documentForm.get('ruc')?.clearValidators();
      this.documentForm.get('nombreEmpresa')?.clearValidators();
      this.documentForm.get('numeroDocumentoRepresentante')?.clearValidators();
      this.documentForm.get('nombresRepresentante')?.clearValidators();
      this.documentForm.get('apellidoPaternoRepresentante')?.clearValidators();
      this.documentForm.get('apellidoMaternoRepresentante')?.clearValidators();
      
    } else if (tipoPersona === 'juridica') {
      // Activar validaciones para persona jurídica
      this.documentForm.get('ruc')?.setValidators([Validators.required, CustomValidators.ruc()]);
      this.documentForm.get('nombreEmpresa')?.setValidators([Validators.required]);
      this.documentForm.get('numeroDocumentoRepresentante')?.setValidators([Validators.required, CustomValidators.dni()]);
      this.documentForm.get('nombresRepresentante')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      this.documentForm.get('apellidoPaternoRepresentante')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      this.documentForm.get('apellidoMaternoRepresentante')?.setValidators([Validators.required, CustomValidators.soloLetras()]);
      
      // Desactivar validaciones para persona natural
      this.documentForm.get('nombres')?.clearValidators();
      this.documentForm.get('apellidoPaterno')?.clearValidators();
      this.documentForm.get('apellidoMaterno')?.clearValidators();
      this.documentForm.get('numeroDocumentoNatural')?.clearValidators();
    }
    
    // Actualizar validez de todos los campos
    Object.keys(this.documentForm.controls).forEach(key => {
      this.documentForm.get(key)?.updateValueAndValidity();
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

    // Crear FormData para enviar archivos
    const formData = new FormData();
    
    // Tipo de persona
    formData.append('tipoPersona', this.documentForm.get('tipoPersona')?.value);
    
    // Campos persona natural
    formData.append('tipoDocumentoNatural', this.documentForm.get('tipoDocumentoNatural')?.value || '');
    formData.append('numeroDocumentoNatural', this.documentForm.get('numeroDocumentoNatural')?.value || '');
    formData.append('nombres', this.documentForm.get('nombres')?.value || '');
    formData.append('apellidoPaterno', this.documentForm.get('apellidoPaterno')?.value || '');
    formData.append('apellidoMaterno', this.documentForm.get('apellidoMaterno')?.value || '');
    
    // Campos persona jurídica
    formData.append('ruc', this.documentForm.get('ruc')?.value || '');
    formData.append('nombreEmpresa', this.documentForm.get('nombreEmpresa')?.value || '');
    formData.append('tipoDocumentoRepresentante', this.documentForm.get('tipoDocumentoRepresentante')?.value || '');
    formData.append('numeroDocumentoRepresentante', this.documentForm.get('numeroDocumentoRepresentante')?.value || '');
    formData.append('nombresRepresentante', this.documentForm.get('nombresRepresentante')?.value || '');
    formData.append('apellidoPaternoRepresentante', this.documentForm.get('apellidoPaternoRepresentante')?.value || '');
    formData.append('apellidoMaternoRepresentante', this.documentForm.get('apellidoMaternoRepresentante')?.value || '');
    
    // Dirección
    formData.append('departamento', this.documentForm.get('departamento')?.value || '');
    formData.append('provincia', this.documentForm.get('provincia')?.value || '');
    formData.append('distrito', this.documentForm.get('distrito')?.value || '');
    formData.append('direccion', this.documentForm.get('direccion')?.value || '');
    
    // Contacto
    formData.append('email', this.documentForm.get('email')?.value);
    formData.append('telefono', this.documentForm.get('telefono')?.value);
    
    // Documento
    formData.append('asunto', this.documentForm.get('asunto')?.value);
    formData.append('descripcion', this.documentForm.get('descripcion')?.value || '');
    formData.append('linkDescarga', this.documentForm.get('linkDescarga')?.value || '');
    
    // Agregar archivos adjuntos
    const files = this.selectedFiles();
    files.forEach((file) => {
      formData.append('archivos', file);
    });

    this.documentService.submitDocumentWithFiles(formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.trackingCode.set(response.data.trackingCode);
          this.submitSuccess.set(true);
        } else {
          this.errorMessage.set(response.message || 'Error al registrar el documento');
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        this.errorMessage.set(error.error?.message || 'Error al conectar con el servidor');
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.documentForm.reset({
      tipoPersona: '',
      aceptoPolitica: false,
      aceptoDeclaracion: false
    });
    this.selectedFiles.set([]);
    this.submitSuccess.set(false);
    this.trackingCode.set('');
    this.errorMessage.set('');
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(fieldName: string): string {
    const control = this.documentForm.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    
    // Errores personalizados con mensaje incluido
    if (errors['dni']) return errors['dni'].message;
    if (errors['ruc']) return errors['ruc'].message;
    if (errors['telefono']) return errors['telefono'].message;
    if (errors['email']) return errors['email'].message;
    if (errors['soloLetras']) return errors['soloLetras'].message;
    if (errors['minLength']) return errors['minLength'].message;
    if (errors['maxLength']) return errors['maxLength'].message;
    
    // Errores estándar
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['requiredTrue']) return 'Debe aceptar esta condición';
    
    return 'Campo inválido';
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   */
  hasError(fieldName: string): boolean {
    const control = this.documentForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Verifica si un campo es válido y ha sido tocado
   */
  isValid(fieldName: string): boolean {
    const control = this.documentForm.get(fieldName);
    return !!(control && control.valid && control.touched && control.value);
  }

}
