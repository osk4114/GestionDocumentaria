import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
  
  constructor(public toastService: ToastService) {}

  getIcon(type: Toast['type']): string {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  }

  getTypeClass(type: Toast['type']): string {
    return `toast-${type}`;
  }

  close(id: string): void {
    // Agregar clase de animación de salida
    const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
    if (toastElement) {
      toastElement.classList.add('toast-removing');
      // Esperar a que termine la animación antes de remover
      setTimeout(() => {
        this.toastService.remove(id);
      }, 300);
    } else {
      this.toastService.remove(id);
    }
  }
}
