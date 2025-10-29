import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores personalizados para el sistema de gestión documentaria
 */
export class CustomValidators {
  
  /**
   * Valida DNI peruano (8 dígitos numéricos)
   */
  static dni(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Si está vacío, lo maneja el validator required
      }
      
      const dniPattern = /^\d{8}$/;
      const valid = dniPattern.test(control.value);
      
      return valid ? null : { 
        dni: { 
          value: control.value,
          message: 'El DNI debe tener exactamente 8 dígitos' 
        } 
      };
    };
  }

  /**
   * Valida Carnet de Extranjería peruano (9 dígitos numéricos)
   */
  static carnetExtranjeria(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const cePattern = /^\d{9}$/;
      const valid = cePattern.test(control.value);
      
      return valid ? null : { 
        carnetExtranjeria: { 
          value: control.value,
          message: 'El Carnet de Extranjería debe tener 9 dígitos' 
        } 
      };
    };
  }

  /**
   * Valida RUC peruano (11 dígitos numéricos, debe empezar con 10, 15, 16, 17 o 20)
   */
  static ruc(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const rucPattern = /^(10|15|16|17|20)\d{9}$/;
      const valid = rucPattern.test(control.value);
      
      if (!valid) {
        if (!/^\d{11}$/.test(control.value)) {
          return { 
            ruc: { 
              value: control.value,
              message: 'El RUC debe tener exactamente 11 dígitos' 
            } 
          };
        } else {
          return { 
            ruc: { 
              value: control.value,
              message: 'El RUC debe comenzar con 10, 15, 16, 17 o 20' 
            } 
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Valida teléfono celular peruano (9 dígitos, debe empezar con 9)
   */
  static telefono(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const telefonoPattern = /^9\d{8}$/;
      const valid = telefonoPattern.test(control.value);
      
      if (!valid) {
        if (!/^\d{9}$/.test(control.value)) {
          return { 
            telefono: { 
              value: control.value,
              message: 'El teléfono debe tener 9 dígitos' 
            } 
          };
        } else {
          return { 
            telefono: { 
              value: control.value,
              message: 'El teléfono debe comenzar con 9' 
            } 
          };
        }
      }
      
      return null;
    };
  }

  /**
   * Valida email con formato más estricto
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const valid = emailPattern.test(control.value);
      
      return valid ? null : { 
        email: { 
          value: control.value,
          message: 'Ingrese un email válido (ejemplo: usuario@correo.com)' 
        } 
      };
    };
  }

  /**
   * Valida que contenga solo letras y espacios
   */
  static soloLetras(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const letrasPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      const valid = letrasPattern.test(control.value);
      
      return valid ? null : { 
        soloLetras: { 
          value: control.value,
          message: 'Solo se permiten letras y espacios' 
        } 
      };
    };
  }

  /**
   * Valida longitud mínima con mensaje personalizado
   */
  static minLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = control.value.length >= length;
      
      return valid ? null : { 
        minLength: { 
          requiredLength: length,
          actualLength: control.value.length,
          message: `Debe tener al menos ${length} caracteres` 
        } 
      };
    };
  }

  /**
   * Valida longitud máxima con mensaje personalizado
   */
  static maxLength(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      
      const valid = control.value.length <= length;
      
      return valid ? null : { 
        maxLength: { 
          requiredLength: length,
          actualLength: control.value.length,
          message: `No debe exceder ${length} caracteres` 
        } 
      };
    };
  }
}
