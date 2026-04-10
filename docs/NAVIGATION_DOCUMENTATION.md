# Documentación de Navegación

Este documento explica cómo modificar y agregar opciones a los diferentes menús de navegación del sistema.

## 📱 Menú Móvil Flotante (`MobileFloatingMenu.tsx`)

### Cómo agregar nuevas opciones:

1. **Ubicación del archivo**: `src/components/layout/MobileFloatingMenu.tsx`

2. **Agregar nueva opción**: Modifica el array `menuItems` (líneas 21-57):

```typescript
const menuItems: MenuItem[] = [
  // ... opciones existentes ...
  {
    id: 'nueva-opcion',          // ID único para la opción
    title: 'Nuevo Módulo',       // Texto que se mostrará
    icon: IconoLucide,           // Icono de Lucide React
    href: '/nueva-ruta',         // Ruta a la que navegará
    color: 'primary'             // Color temático (primary, secondary, accent)
  }
];
```

3. **Agregar permisos** (si es necesario): Modifica el objeto `moduleMap` (líneas 70-74):

```typescript
const moduleMap = {
  'projects': 'api::project',
  'sales': 'api::sale',
  'clients': 'api::customer',
  'nueva-opcion': 'api::nuevo-modulo'  // Mapear al permiso correspondiente
};
```

### Iconos disponibles:
- Importa desde `lucide-react`: `import { NuevoIcono } from 'lucide-react';`
- Ejemplos: `Home`, `Users`, `Settings`, `Package`, `FileText`, etc.

### Orden de los elementos:
Los elementos aparecen en el orden que están definidos en el array `menuItems`.

---

## 🖥️ Navegación del Sidebar (`DynamicNavigation.tsx`)

### Módulos del Sistema vs Módulos Catálogos:

**Módulos del Sistema** (línea 48): Módulos principales de gestión
```typescript
const systemModules = ['api::project', 'api::customer', 'api::sale'];
```

**Módulos Catálogos**: Todos los demás módulos automáticamente

### Cómo mover un módulo entre categorías:

1. **Para mover a "Módulos del Sistema"**: Agregar el ID del módulo al array `systemModules`
2. **Para mover a "Módulos Catálogos"**: Quitar el ID del array `systemModules`

### Cómo agregar iconos para nuevos módulos:

Modifica el objeto `moduleIcons` (líneas 21-34):

```typescript
const moduleIcons = {
  // ... iconos existentes ...
  'api::nuevo-modulo': NuevoIcono,  // Mapear API ID al icono de Lucide
};
```

### Estructura de permisos:
Los módulos se generan automáticamente basados en los permisos del usuario. No necesitas agregar módulos manualmente aquí, solo configurar iconos y categorías.

---

## 🎨 Personalización de Diseño

### Colores del sistema:
- `primary`: Color principal del tema
- `secondary`: Color secundario 
- `accent`: Color de acento
- Todos definidos en `src/index.css`

### Animaciones:
- Utiliza `framer-motion` para animaciones
- Las animaciones están configuradas con `type: "spring"` para suavidad

### Responsive Design:
- **Mobile**: `sm:` (576px+) - Menú flotante más pequeño
- **Tablet**: `md:` (768px+) - Menú flotante tamaño normal, sidebar oculto
- **Desktop**: `lg:` (1024px+) - Sidebar visible, menú flotante oculto

---

## 🔧 Mantenimiento

### Archivos importantes:
- `src/components/layout/MobileFloatingMenu.tsx` - Menú móvil flotante
- `src/components/layout/DynamicNavigation.tsx` - Navegación del sidebar
- `src/components/layout/ModernLayout.tsx` - Layout principal y estado del sidebar
- `src/hooks/useAuthPermissions.ts` - Hook de permisos y autenticación

### Consideraciones de permisos:
- Los módulos se filtran automáticamente por permisos del usuario
- `home` y `profile` siempre son visibles en el menú móvil
- Otros elementos requieren permisos específicos del módulo

### Testing:
1. Verifica que los nuevos elementos aparezcan correctamente
2. Confirma que los permisos funcionen (prueba con diferentes roles)
3. Verifica responsive design en móvil, tablet y desktop
4. Prueba las animaciones y transiciones