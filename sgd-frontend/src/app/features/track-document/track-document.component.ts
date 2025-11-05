import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';

interface DocumentTracking {
  id: number;
  trackingCode: string;
  asunto: string;
  created_at: string;
  sender: {
    nombreCompleto: string;
  };
  documentType: {
    nombre: string;
  } | null;
  status: {
    nombre: string;
    color: string;
  };
  movements: Array<{
    id: number;
    accion: string;
    observacion: string;
    timestamp: string;
    fromArea: {
      nombre: string;
      sigla: string;
    } | null;
    toArea: {
      nombre: string;
      sigla: string;
    };
  }>;
}

@Component({
  selector: 'app-track-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './track-document.component.html',
  styleUrl: './track-document.component.scss'
})
export class TrackDocumentComponent implements OnInit {
  searchForm: FormGroup;
  loading = signal(false);
  document = signal<DocumentTracking | null>(null);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      trackingCode: ['', [Validators.required, Validators.pattern(/^SGD-\d{4}-\d{6}$/)]]
    });
  }

  ngOnInit() {
    // Si viene el código en la URL, buscar automáticamente
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.searchForm.patchValue({ trackingCode: params['code'] });
        this.searchDocument();
      }
    });
  }

  searchDocument() {
    if (this.searchForm.invalid) {
      this.errorMessage.set('Por favor ingrese un código válido (formato: SGD-2024-123456)');
      return;
    }

    // Deshabilitar input mientras busca
    this.searchForm.get('trackingCode')?.disable();
    this.loading.set(true);
    this.errorMessage.set('');
    this.document.set(null);

    const trackingCode = this.searchForm.value.trackingCode;

    this.documentService.trackDocument(trackingCode).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.document.set(response.data);
        } else {
          this.errorMessage.set('Documento no encontrado. Verifique el código e intente nuevamente.');
        }
        this.loading.set(false);
        this.searchForm.get('trackingCode')?.enable();
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Documento no encontrado. Verifique el código e intente nuevamente.'
        );
        this.loading.set(false);
        this.searchForm.get('trackingCode')?.enable();
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  newSearch() {
    this.searchForm.reset();
    this.document.set(null);
    this.errorMessage.set('');
  }

  /**
   * Navega al landing page cuando se hace clic en el logo
   */
  navigateToLanding() {
    this.router.navigate(['/']);
  }

}
