import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  // Datos de ubicación de Perú
  departamentos = signal<string[]>([
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 
    'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 
    'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 
    'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
  ]);
  
  provincias = signal<string[]>([]);
  distritos = signal<string[]>([]);

  // Mapa de provincias por departamento (principales)
  private provinciasPorDepartamento: { [key: string]: string[] } = {
    'Puno': ['Puno', 'Azángaro', 'Carabaya', 'Chucuito', 'El Collao', 'Huancané', 'Lampa', 'Melgar', 'Moho', 'San Antonio de Putina', 'San Román', 'Sandia', 'Yunguyo'],
    'Lima': ['Lima', 'Barranca', 'Cajatambo', 'Canta', 'Cañete', 'Huaral', 'Huarochirí', 'Huaura', 'Oyón', 'Yauyos'],
    'Cusco': ['Cusco', 'Acomayo', 'Anta', 'Calca', 'Canas', 'Canchis', 'Chumbivilcas', 'Espinar', 'La Convención', 'Paruro', 'Paucartambo', 'Quispicanchi', 'Urubamba'],
    'Arequipa': ['Arequipa', 'Camaná', 'Caravelí', 'Castilla', 'Caylloma', 'Condesuyos', 'Islay', 'La Unión'],
    'La Libertad': ['Trujillo', 'Ascope', 'Bolívar', 'Chepén', 'Julcán', 'Otuzco', 'Pacasmayo', 'Pataz', 'Sánchez Carrión', 'Santiago de Chuco', 'Gran Chimú', 'Virú'],
    'Piura': ['Piura', 'Ayabaca', 'Huancabamba', 'Morropón', 'Paita', 'Sechura', 'Sullana', 'Talara'],
    'Lambayeque': ['Chiclayo', 'Ferreñafe', 'Lambayeque'],
    'Cajamarca': ['Cajamarca', 'Cajabamba', 'Celendín', 'Chota', 'Contumazá', 'Cutervo', 'Hualgayoc', 'Jaén', 'San Ignacio', 'San Marcos', 'San Miguel', 'San Pablo', 'Santa Cruz'],
    'Junín': ['Huancayo', 'Concepción', 'Chanchamayo', 'Jauja', 'Junín', 'Satipo', 'Tarma', 'Yauli', 'Chupaca'],
    'Ica': ['Ica', 'Chincha', 'Nasca', 'Palpa', 'Pisco'],
    'Áncash': ['Huaraz', 'Aija', 'Antonio Raymondi', 'Asunción', 'Bolognesi', 'Carhuaz', 'Carlos Fermín Fitzcarrald', 'Casma', 'Corongo', 'Huari', 'Huarmey', 'Huaylas', 'Mariscal Luzuriaga', 'Ocros', 'Pallasca', 'Pomabamba', 'Recuay', 'Santa', 'Sihuas', 'Yungay'],
    'Ayacucho': ['Huamanga', 'Cangallo', 'Huanca Sancos', 'Huanta', 'La Mar', 'Lucanas', 'Parinacochas', 'Páucar del Sara Sara', 'Sucre', 'Víctor Fajardo', 'Vilcas Huamán'],
    'Huancavelica': ['Huancavelica', 'Acobamba', 'Angaraes', 'Castrovirreyna', 'Churcampa', 'Huaytará', 'Tayacaja'],
    'Huánuco': ['Huánuco', 'Ambo', 'Dos de Mayo', 'Huacaybamba', 'Huamalíes', 'Leoncio Prado', 'Marañón', 'Pachitea', 'Puerto Inca', 'Lauricocha', 'Yarowilca'],
    'San Martín': ['Moyobamba', 'Bellavista', 'El Dorado', 'Huallaga', 'Lamas', 'Mariscal Cáceres', 'Picota', 'Rioja', 'San Martín', 'Tocache'],
    'Loreto': ['Maynas', 'Alto Amazonas', 'Loreto', 'Mariscal Ramón Castilla', 'Requena', 'Ucayali', 'Datem del Marañón', 'Putumayo'],
    'Amazonas': ['Chachapoyas', 'Bagua', 'Bongará', 'Condorcanqui', 'Luya', 'Rodríguez de Mendoza', 'Utcubamba'],
    'Apurímac': ['Abancay', 'Andahuaylas', 'Antabamba', 'Aymaraes', 'Cotabambas', 'Chincheros', 'Grau'],
    'Madre de Dios': ['Tambopata', 'Manu', 'Tahuamanu'],
    'Moquegua': ['Mariscal Nieto', 'General Sánchez Cerro', 'Ilo'],
    'Pasco': ['Pasco', 'Daniel Alcides Carrión', 'Oxapampa'],
    'Tacna': ['Tacna', 'Candarave', 'Jorge Basadre', 'Tarata'],
    'Tumbes': ['Tumbes', 'Contralmirante Villar', 'Zarumilla'],
    'Ucayali': ['Coronel Portillo', 'Atalaya', 'Padre Abad', 'Purús'],
    'Callao': ['Callao']
  };

  // Mapa de distritos por provincia (ejemplos principales)
  private distritosPorProvincia: { [key: string]: string[] } = {
    'Puno': ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque'],
    'Lima': ['Lima', 'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacamac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'],
    'Cusco': ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'],
    'Arequipa': ['Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'José Luis Bustamante y Rivero', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandia', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura'],
    'Trujillo': ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Víctor Larco Herrera'],
    'Chiclayo': ['Chiclayo', 'Chongoyape', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz', 'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Pátapo', 'Picsi', 'Pimentel', 'Pomalca', 'Pucalá', 'Reque', 'Santa Rosa', 'Saña', 'Cayaltí', 'Tumán']
  };

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private router: Router
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

    // Escuchar cambios en departamento
    this.documentForm.get('departamento')?.valueChanges.subscribe(depto => {
      this.onDepartamentoChange(depto);
    });

    // Escuchar cambios en provincia
    this.documentForm.get('provincia')?.valueChanges.subscribe(prov => {
      this.onProvinciaChange(prov);
    });
    
    // NO inicializar validaciones hasta que el usuario seleccione
  }

  onDepartamentoChange(departamento: string) {
    // Limpiar provincia y distrito sin disparar eventos
    this.documentForm.patchValue({
      provincia: '',
      distrito: ''
    }, { emitEvent: false });
    
    // Cargar provincias del departamento seleccionado
    if (departamento && this.provinciasPorDepartamento[departamento]) {
      this.provincias.set(this.provinciasPorDepartamento[departamento]);
    } else {
      this.provincias.set([]);
    }
    
    this.distritos.set([]);
  }

  onProvinciaChange(provincia: string) {
    // Limpiar distrito sin disparar eventos
    this.documentForm.patchValue({
      distrito: ''
    }, { emitEvent: false });
    
    // Cargar distritos de la provincia seleccionada
    if (provincia && this.distritosPorProvincia[provincia]) {
      this.distritos.set(this.distritosPorProvincia[provincia]);
    } else {
      // Si no hay distritos específicos, mostrar la provincia como único distrito
      this.distritos.set(provincia ? [provincia] : []);
    }
  }

  loadDocumentTypes() {
    this.documentService.getPublicDocumentTypes().subscribe({
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
    
    // Actualizar validez de todos los campos sin emitir eventos
    Object.keys(this.documentForm.controls).forEach(key => {
      this.documentForm.get(key)?.updateValueAndValidity({ emitEvent: false });
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
    // Validar que el formulario sea válido
    if (this.documentForm.invalid) {
      this.errorMessage.set('Por favor complete todos los campos requeridos y acepte las condiciones');
      Object.keys(this.documentForm.controls).forEach(key => {
        this.documentForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Validar que haya al menos un archivo adjunto
    if (this.selectedFiles().length === 0) {
      this.errorMessage.set('Debes adjuntar al menos un archivo para enviar tu solicitud');
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

  /**
   * Navega al landing page cuando se hace clic en el logo
   */
  navigateToLanding() {
    this.router.navigate(['/']);
  }

}
