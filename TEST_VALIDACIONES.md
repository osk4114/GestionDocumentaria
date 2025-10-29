# 🧪 Guía de Pruebas - Validaciones Avanzadas y UX Mejorada

## Fecha: 29 de octubre de 2025

---

## 📋 **Checklist de Validaciones Implementadas**

### ✅ **Validadores Personalizados Creados**

| Validador | Descripción | Patrón |
|-----------|-------------|--------|
| `dni()` | DNI peruano de 8 dígitos | `/^\d{8}$/` |
| `carnetExtranjeria()` | Carnet de Extranjería de 9 dígitos | `/^\d{9}$/` |
| `ruc()` | RUC peruano de 11 dígitos (inicia con 10, 15, 16, 17, 20) | `/^(10\|15\|16\|17\|20)\d{9}$/` |
| `telefono()` | Teléfono celular de 9 dígitos (inicia con 9) | `/^9\d{8}$/` |
| `email()` | Email con formato estricto | `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` |
| `soloLetras()` | Solo letras y espacios (con tildes y ñ) | `/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/` |

---

## 🧪 **Casos de Prueba**

### **1. Persona Natural - Validaciones DNI**

#### ✅ Test 1.1: DNI Válido
```
Tipo Persona: Natural
DNI: 12345678
Resultado esperado: ✓ (icono verde, borde verde)
```

#### ❌ Test 1.2: DNI Inválido - Menos de 8 dígitos
```
Tipo Persona: Natural
DNI: 123456
Resultado esperado: ❌ Mensaje "El DNI debe tener exactamente 8 dígitos"
```

#### ❌ Test 1.3: DNI Inválido - Más de 8 dígitos
```
Tipo Persona: Natural
DNI: 123456789
Resultado esperado: ❌ Mensaje "El DNI debe tener exactamente 8 dígitos"
```

#### ❌ Test 1.4: DNI Inválido - Contiene letras
```
Tipo Persona: Natural
DNI: 1234567A
Resultado esperado: ❌ Mensaje "El DNI debe tener exactamente 8 dígitos"
```

---

### **2. Persona Natural - Validaciones Nombres y Apellidos**

#### ✅ Test 2.1: Nombres Válidos
```
Nombres: Juan Carlos
Resultado esperado: ✓ (icono verde)
```

#### ❌ Test 2.2: Nombres Inválidos - Contienen números
```
Nombres: Juan123
Resultado esperado: ❌ Mensaje "Solo se permiten letras y espacios"
```

#### ❌ Test 2.3: Nombres Inválidos - Contienen símbolos
```
Nombres: Juan@Carlos
Resultado esperado: ❌ Mensaje "Solo se permiten letras y espacios"
```

#### ✅ Test 2.4: Nombres Válidos - Con tildes y ñ
```
Nombres: José María Ñuño
Apellido Paterno: García
Apellido Materno: López
Resultado esperado: ✓ Todos válidos
```

---

### **3. Persona Jurídica - Validaciones RUC**

#### ✅ Test 3.1: RUC Válido - Persona Jurídica (inicia con 20)
```
Tipo Persona: Jurídica
RUC: 20123456789
Resultado esperado: ✓ (icono verde)
```

#### ✅ Test 3.2: RUC Válido - Persona Natural con RUC (inicia con 10)
```
RUC: 10123456789
Resultado esperado: ✓ (icono verde)
```

#### ❌ Test 3.3: RUC Inválido - Menos de 11 dígitos
```
RUC: 2012345678
Resultado esperado: ❌ Mensaje "El RUC debe tener exactamente 11 dígitos"
```

#### ❌ Test 3.4: RUC Inválido - No inicia con prefijo válido
```
RUC: 30123456789
Resultado esperado: ❌ Mensaje "El RUC debe comenzar con 10, 15, 16, 17 o 20"
```

---

### **4. Validaciones Teléfono**

#### ✅ Test 4.1: Teléfono Válido
```
Teléfono: 987654321
Resultado esperado: ✓ (icono verde)
```

#### ❌ Test 4.2: Teléfono Inválido - No inicia con 9
```
Teléfono: 812345678
Resultado esperado: ❌ Mensaje "El teléfono debe comenzar con 9"
```

#### ❌ Test 4.3: Teléfono Inválido - Menos de 9 dígitos
```
Teléfono: 98765432
Resultado esperado: ❌ Mensaje "El teléfono debe tener 9 dígitos"
```

---

### **5. Validaciones Email**

#### ✅ Test 5.1: Email Válido
```
Email: usuario@correo.com
Resultado esperado: ✓ (icono verde)
```

#### ✅ Test 5.2: Email Válido - Con puntos y guiones
```
Email: usuario.prueba-123@dominio.com.pe
Resultado esperado: ✓ (icono verde)
```

#### ❌ Test 5.3: Email Inválido - Sin @
```
Email: usuariocorreo.com
Resultado esperado: ❌ Mensaje "Ingrese un email válido (ejemplo: usuario@correo.com)"
```

#### ❌ Test 5.4: Email Inválido - Sin dominio
```
Email: usuario@
Resultado esperado: ❌ Mensaje "Ingrese un email válido (ejemplo: usuario@correo.com)"
```

---

### **6. Validaciones Asunto**

#### ✅ Test 6.1: Asunto Válido
```
Asunto: Solicitud de certificado de estudios
Resultado esperado: ✓ (icono verde)
```

#### ❌ Test 6.2: Asunto Inválido - Menos de 10 caracteres
```
Asunto: Hola
Resultado esperado: ❌ Mensaje "Debe tener al menos 10 caracteres"
```

#### ❌ Test 6.3: Asunto Inválido - Más de 200 caracteres
```
Asunto: (texto de más de 200 caracteres)
Resultado esperado: ❌ Mensaje "No debe exceder 200 caracteres"
```

---

## 🎨 **Validación de Feedback Visual**

### **Indicadores Visuales**

| Estado | Color de Borde | Color de Fondo | Icono | Animación |
|--------|---------------|----------------|-------|-----------|
| Normal | #d1d5db (gris) | Blanco | - | - |
| En foco | #0066cc (azul) | Blanco | - | Sombra azul suave |
| Válido | #28a745 (verde) | #f8fff9 | ✓ | fadeIn 0.3s |
| Error | #dc3545 (rojo) | #fff8f8 | - | slideDown 0.3s |

### **Asteriscos Requeridos**
- Color: #dc3545 (rojo)
- Peso: 600 (bold)
- Posición: Al lado del label

### **Mensajes de Error**
- Color texto: #dc3545 (rojo)
- Tamaño fuente: 0.875rem
- Animación: slideDown desde arriba
- Posición: Debajo del input

---

## 📝 **Pasos para Probar Manualmente**

### **Escenario 1: Persona Natural Completa**
1. Ir a `http://localhost:4200/submit-document`
2. Seleccionar "Persona natural"
3. Dejar DNI vacío → Llenar nombre → Intentar enviar
4. **Esperado:** Error "Este campo es obligatorio" en DNI
5. Llenar DNI con "123" → Salir del campo
6. **Esperado:** Error "El DNI debe tener exactamente 8 dígitos"
7. Corregir DNI a "12345678" → Salir del campo
8. **Esperado:** ✓ verde aparece, borde verde
9. Llenar nombre con "Juan123"
10. **Esperado:** Error "Solo se permiten letras y espacios"
11. Corregir a "Juan"
12. **Esperado:** ✓ verde aparece

### **Escenario 2: Persona Jurídica Completa**
1. Seleccionar "Persona jurídica"
2. Llenar RUC con "201234567" (10 dígitos)
3. **Esperado:** Error "El RUC debe tener exactamente 11 dígitos"
4. Llenar RUC con "30123456789" (inicia con 30)
5. **Esperado:** Error "El RUC debe comenzar con 10, 15, 16, 17 o 20"
6. Corregir a "20123456789"
7. **Esperado:** ✓ verde aparece
8. Llenar datos del representante con validaciones

### **Escenario 3: Validaciones de Contacto**
1. Llenar email con "correo@"
2. **Esperado:** Error de email inválido
3. Llenar teléfono con "812345678"
4. **Esperado:** Error "El teléfono debe comenzar con 9"
5. Corregir teléfono a "987654321"
6. **Esperado:** ✓ verde aparece

---

## ✅ **Criterios de Aceptación**

- [ ] Todos los campos requeridos muestran asterisco rojo (*)
- [ ] Los campos inválidos muestran borde y fondo rojo
- [ ] Los campos válidos muestran borde verde e icono ✓
- [ ] Los mensajes de error son específicos y útiles
- [ ] Las animaciones son suaves (0.3s)
- [ ] El formulario NO se envía si hay errores
- [ ] Las validaciones cambian dinámicamente según tipo de persona
- [ ] Los placeholders muestran ejemplos de formato correcto
- [ ] Los campos tienen límite de caracteres (maxlength)

---

## 🚀 **Resultado Final Esperado**

Al completar todas las pruebas:
- ✅ Validaciones de DNI funcionan correctamente
- ✅ Validaciones de RUC funcionan correctamente
- ✅ Validaciones de teléfono funcionan correctamente
- ✅ Validaciones de email funcionan correctamente
- ✅ Validaciones de nombres (solo letras) funcionan
- ✅ Feedback visual es claro e intuitivo
- ✅ Mensajes de error son específicos
- ✅ Animaciones mejoran la experiencia de usuario
- ✅ Asteriscos rojos indican campos requeridos
- ✅ Iconos verdes confirman datos válidos

---

## 📊 **Resumen de Archivos Modificados**

1. ✅ `custom-validators.ts` - 8 validadores personalizados
2. ✅ `submit-document.component.ts` - Aplicación de validadores + métodos helper
3. ✅ `submit-document.component.html` - Indicadores visuales + mensajes de error
4. ✅ `submit-document.component.scss` - Estilos de validación + animaciones
