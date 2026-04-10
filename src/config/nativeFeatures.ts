const env = import.meta.env as Record<string, string | boolean | undefined>;

const parseEnvBool = (value: string | boolean | undefined, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

/**
 * Configuración de características nativas para el proyecto
 * Cambia estos valores a false para deshabilitar funcionalidades en proyectos específicos
 */
export const NATIVE_FEATURES = {
  // PUSH NOTIFICATIONS - Notificaciones push nativas
  // Permite: notificaciones de login, cambios en módulos, avisos administrativos
  // Casos de uso: alertas en tiempo real, notificaciones offline
  PUSH_NOTIFICATIONS: parseEnvBool(env.VITE_NATIVE_PUSH_NOTIFICATIONS, true),
  
  // CAMERA - Acceso a cámara del dispositivo  
  // Permite: tomar fotos, escanear códigos QR/barras, captura de documentos
  // Casos de uso: perfiles de usuario, documentación, inventarios, reportes con fotos
  CAMERA: parseEnvBool(env.VITE_NATIVE_CAMERA, true),
  
  // GEOLOCATION - Acceso a ubicación GPS
  // Permite: obtener coordenadas, tracking, mapas, geofencing
  // Casos de uso: check-ins, rutas, servicios basados en ubicación, reportes geolocalizados
  GEOLOCATION: parseEnvBool(env.VITE_NATIVE_GEOLOCATION, true),
} as const;

/**
 * Qué puedes hacer con cada funcionalidad:
 * 
 * 🔔 PUSH NOTIFICATIONS:
 * - Notificar login exitoso/fallido
 * - Alertar cambios en módulos a usuarios involucrados
 * - Enviar avisos administrativos
 * - Recordatorios y alertas programadas
 * - Notificaciones offline (llegan aunque la app esté cerrada)
 * 
 * 📷 CAMERA:
 * - Tomar fotos para perfiles de usuario
 * - Capturar documentos (IDs, facturas, contratos)
 * - Escanear códigos QR/barras
 * - Agregar fotos a reportes o formularios
 * - Evidencia fotográfica en auditorías
 * 
 * 📍 GEOLOCATION:
 * - Check-in/check-out con ubicación
 * - Tracking de rutas y movimientos
 * - Servicios basados en ubicación
 * - Geofencing (alertas por ubicación)
 * - Reportes con coordenadas GPS
 * - Mapas y navegación
 */
