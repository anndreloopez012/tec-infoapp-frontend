# 🔔 Guía de Testing de Notificaciones

## 📋 Configuración Inicial

### 1. Backend Strapi - APIs requeridas:

```bash
# En tu proyecto Strapi, crea estos Content Types:

## global-notifications
- title (Text, required)
- message (Long text, required)  
- type (Enumeration: login_success, login_failed, module_updated, admin_announcement, etc.)
- recipient_type (Enumeration: all, role, specific_users)
- recipient_ids (JSON)
- role_ids (JSON)
- priority (Enumeration: low, medium, high, urgent)
- scheduled_at (DateTime)
- expires_at (DateTime)
- metadata (JSON)

## user-notifications  
- user (Relation to User, required)
- notification (Relation to global-notifications, required)
- read_at (DateTime)
- delivered_at (DateTime)

## push-tokens
- token (Text, required)
- device_type (Enumeration: ios, android, web)
- user_id (Relation to User, required)
- active (Boolean, default: true)
```

### 2. Permisos en Strapi:
- Authenticated role: find, findOne, create, update para user-notifications
- Authenticated role: find, findOne para global-notifications  
- Admin/Super role: create, update, delete para global-notifications

## 🧪 Cómo Testear

### 1. Testing en Web (Desarrollo):
```bash
# 1. Ejecuta tu proyecto
npm run dev

# 2. Ve a la consola del navegador
# Las notificaciones aparecerán como toasts y en console.log
```

### 2. Testing en Móvil:
```bash
# 1. Exporta a Github y clona el proyecto
git clone tu-repo

# 2. Instala dependencias
npm install

# 3. Agrega plataformas móviles
npx cap add ios     # Para iOS (requiere Mac)
npx cap add android # Para Android

# 4. Construye el proyecto
npm run build

# 5. Sincroniza con Capacitor
npx cap sync

# 6. Ejecuta en dispositivo/emulador
npx cap run android  # Para Android
npx cap run ios      # Para iOS (requiere Xcode)
```

## 📱 Funcionalidades Implementadas

### ✅ Login Notifications:
- **Éxito**: Se envía automáticamente al hacer login
- **Fallo**: Se puede testear desde el servicio (próximamente integrado en login)

### ✅ Module Notifications:
```typescript
// Usar en cualquier componente donde se hagan cambios
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';

const { notifyModuleChange } = useNotificationIntegration();

// Después de guardar cambios
await notifyModuleChange(
  'Usuarios',           // nombre del módulo
  'Usuario actualizado', // acción realizada
  [1, 2, 3],            // IDs de usuarios a notificar
  currentUser.id        // quien hizo el cambio
);
```

### ✅ Admin Notifications:
- Ve a `/admin/notifications` (solo admin/super_admin)
- Envía notificaciones a todos, por rol, o usuarios específicos

## 🔧 Debugging

### Console Logs a revisar:
```bash
# Registro de push notifications
"Push registration success, token: [TOKEN]"
"Push notification received: [DATA]"

# Errores comunes
"Error on registration: [ERROR]"
"Error sending token to backend: [ERROR]"
```

### Network Requests:
- POST `/api/push-tokens` - Registro de token
- POST `/api/global-notifications` - Crear notificación
- GET `/api/user-notifications` - Obtener notificaciones del usuario

## 📲 Estados de Notificaciones

### Browser/Web:
- ✅ Toasts inmediatos (cuando la app está abierta)
- ⚠️ Push notifications limitadas (requiere HTTPS y service worker)

### Mobile App:
- ✅ Push notifications nativas (app cerrada/minimizada)
- ✅ Toasts cuando la app está abierta
- ✅ Badge count en el ícono de la app

## 🔄 Flujo Completo de Testing

1. **Login** → Recibe notificación de éxito
2. **Cambiar algo en un módulo** → Los involucrados reciben notificación
3. **Admin envía aviso** → Destinatarios seleccionados reciben notificación
4. **Ver notificaciones** → Lista con opciones de marcar como leído

## ⚙️ Configuración de Características

Para deshabilitar funcionalidades en proyectos específicos, edita:
```typescript
// src/config/nativeFeatures.ts
export const NATIVE_FEATURES = {
  PUSH_NOTIFICATIONS: false, // Deshabilitar notificaciones
  CAMERA: false,             // Deshabilitar cámara
  GEOLOCATION: false,        // Deshabilitar ubicación
}
```

## 🚨 Troubleshooting

### Si no llegan las notificaciones:
1. Verifica que el token se guarde en Strapi (tabla push-tokens)
2. Revisa permisos de la app en el dispositivo
3. Confirma que el backend tenga los endpoints configurados
4. Verifica que NATIVE_FEATURES.PUSH_NOTIFICATIONS = true

### Si falla el registro:
- Android: Verifica que tengas configurado Firebase (para producción)
- iOS: Verifica certificados de push notifications
- Web: Verifica que tengas HTTPS y service worker

## 📚 Próximos Pasos

1. Integrar notificación de login fallido en el formulario de login
2. Agregar notificaciones programadas
3. Configurar Firebase para Android en producción
4. Configurar Apple Push Notification service para iOS