# 🎨 Guía de Colores Institucionales - gob.pe

## Paleta de Colores Oficial

Basado en el estándar de **Gobierno del Perú (gob.pe)** para la **Dirección Regional de Transportes y Comunicaciones**.

---

## 🔴 **Rojo Institucional (Principal)**

### **Rojo gob.pe - #C1272D**
```scss
--color-primary: #C1272D;
```
**Uso:**
- Botones de acción principal
- Bordes destacados
- Estados de error
- Logo institucional
- Elementos de énfasis

**Variantes:**
```scss
--color-primary-dark: #9A1F24;   /* Hover states */
--color-primary-light: #E63946;  /* Fondos suaves */
```

---

## 🔵 **Azul Institucional (Secundario)**

### **Azul Oscuro - #003876**
```scss
--color-secondary: #003876;
```
**Uso:**
- Headers y navegación
- Fondos de secciones importantes
- Texto de títulos principales
- Botones secundarios importantes

### **Azul Medio - #0064AF**
```scss
--color-secondary-medium: #0064AF;
```
**Uso:**
- Enlaces (links)
- Botones de acción secundaria
- Íconos informativos
- Estados hover de elementos azules

### **Azul Claro - #4A90E2**
```scss
--color-secondary-light: #4A90E2;
```
**Uso:**
- Fondos suaves de información
- Bordes de elementos informativos
- Badges de notificación

---

## ⚫ **Colores Neutros (Textos)**

### **Gris Oscuro - #3C3C3B**
```scss
--color-text-primary: #3C3C3B;
```
**Uso:**
- Texto principal del cuerpo
- Párrafos largos
- Contenido general

### **Gris Medio - #666666**
```scss
--color-text-secondary: #666666;
```
**Uso:**
- Texto secundario
- Etiquetas (labels)
- Información complementaria

### **Gris Claro - #999999**
```scss
--color-text-muted: #999999;
```
**Uso:**
- Texto deshabilitado
- Placeholders
- Hints

### **Blanco - #FFFFFF**
```scss
--color-text-white: #FFFFFF;
```
**Uso:**
- Texto sobre fondos oscuros
- Texto sobre rojo/azul

---

## ⬜ **Fondos**

### **Blanco Principal - #FFFFFF**
```scss
--color-bg-primary: #FFFFFF;
```
**Uso:**
- Fondo de cards
- Modales
- Contenedores principales

### **Gris Muy Claro - #F5F5F5**
```scss
--color-bg-secondary: #F5F5F5;
```
**Uso:**
- Fondo general de la aplicación
- Alternancia en tablas
- Secciones secundarias

### **Gris Claro - #E8E8E8**
```scss
--color-bg-tertiary: #E8E8E8;
```
**Uso:**
- Fondos de inputs deshabilitados
- Separadores visuales

### **Azul Oscuro - #003876**
```scss
--color-bg-dark: #003876;
```
**Uso:**
- Headers institucionales
- Footers
- Sidebars de admin

---

## 🎯 **Estados**

### **Éxito - #28A745**
```scss
--color-success: #28A745;
```
**Uso:**
- Mensajes de éxito
- Estados completados
- Botones de confirmación

### **Advertencia - #FFC107**
```scss
--color-warning: #FFC107;
```
**Uso:**
- Alertas de advertencia
- Estados pendientes
- Información importante

### **Error - #C1272D**
```scss
--color-error: #C1272D;
```
**Uso:**
- Mensajes de error
- Validaciones fallidas
- Alertas críticas

### **Información - #0064AF**
```scss
--color-info: #0064AF;
```
**Uso:**
- Mensajes informativos
- Tips y ayuda
- Notificaciones generales

---

## 🖼️ **Bordes**

### **Estándar - #D9D9D9**
```scss
--color-border: #D9D9D9;
```

### **Claro - #E8E8E8**
```scss
--color-border-light: #E8E8E8;
```

### **Oscuro - #CCCCCC**
```scss
--color-border-dark: #CCCCCC;
```

---

## 📐 **Sombras**

```scss
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

---

## 🎨 **Ejemplos de Uso**

### **Botón Principal (Rojo)**
```html
<button class="btn-primary">Enviar Documento</button>
```
```scss
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-white);
  
  &:hover {
    background: var(--color-primary-dark);
  }
}
```

### **Botón Secundario (Azul Oscuro)**
```html
<button class="btn-secondary">Ver Detalles</button>
```
```scss
.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-text-white);
  
  &:hover {
    background: var(--color-secondary-medium);
  }
}
```

### **Enlace**
```html
<a href="#" class="link">Más información</a>
```
```scss
.link {
  color: var(--color-secondary-medium);
  text-decoration: underline;
  
  &:hover {
    color: var(--color-secondary);
  }
}
```

### **Card Institucional**
```html
<div class="card-institucional">
  <h3>Título</h3>
  <p>Contenido...</p>
</div>
```
```scss
.card-institucional {
  background: var(--color-bg-primary);
  border-top: 4px solid var(--color-primary);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
}
```

---

## 🚫 **No Usar**

### **Colores Prohibidos:**
- ❌ Colores brillantes no institucionales (fucsia, morado, etc.)
- ❌ Gradientes complejos
- ❌ Colores fluorescentes
- ❌ Combinaciones de alto contraste no institucionales

### **Excepciones:**
- ✅ Gráficas y charts pueden usar colores complementarios con moderación
- ✅ Estados de prioridad (urgente, alta, etc.) pueden usar naranja/amarillo

---

## 📱 **Accesibilidad**

### **Contraste Mínimo:**
- Texto normal sobre blanco: ratio 4.5:1 ✅
- Texto grande sobre blanco: ratio 3:1 ✅
- Rojo (#C1272D) sobre blanco: ratio 5.5:1 ✅
- Azul oscuro (#003876) sobre blanco: ratio 8.9:1 ✅

### **Recomendaciones:**
1. Nunca usar texto claro (#999) sobre fondos claros
2. Siempre usar blanco sobre azul oscuro o rojo
3. Usar iconos para complementar el significado de colores

---

## 🔄 **Migración de Colores Antiguos**

Si encuentras estos colores, cámbialos:

```scss
/* ❌ Antiguo */
color: #0066CC;

/* ✅ Nuevo */
color: var(--color-secondary-medium);
```

```scss
/* ❌ Antiguo */
background: #3399FF;

/* ✅ Nuevo */
background: var(--color-secondary-light);
```

---

## 📋 **Checklist de Diseño**

Antes de implementar un componente, verifica:

- [ ] ¿Usa variables CSS en lugar de colores hardcodeados?
- [ ] ¿El contraste de texto es accesible?
- [ ] ¿Los botones principales son rojos (#C1272D)?
- [ ] ¿Los headers usan azul oscuro (#003876)?
- [ ] ¿Los enlaces usan azul medio (#0064AF)?
- [ ] ¿Los fondos son blancos o gris claro (#F5F5F5)?
- [ ] ¿Sigue el estándar visual de gob.pe?

---

## 🎯 **Referencia Rápida**

| Elemento | Color Variable | Hex |
|----------|---------------|-----|
| **Botón Principal** | `--color-primary` | #C1272D |
| **Header/Nav** | `--color-secondary` | #003876 |
| **Enlaces** | `--color-secondary-medium` | #0064AF |
| **Texto Principal** | `--color-text-primary` | #3C3C3B |
| **Fondo Principal** | `--color-bg-primary` | #FFFFFF |
| **Fondo Página** | `--color-bg-secondary` | #F5F5F5 |

---

**Fecha:** 23 de Octubre, 2025  
**Versión:** 1.0  
**Estándar:** gob.pe (Gobierno del Perú)  
**Institución:** Dirección Regional de Transportes y Comunicaciones - Puno
