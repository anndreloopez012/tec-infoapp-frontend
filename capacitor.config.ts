import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ID único de la aplicación (recomendado: com.empresa.app)
  appId: 'com.app.tec.gt',

  // Nombre que aparecerá en el dispositivo
  appName: 'CRM GC',

  // Directorio donde se genera el build de la aplicación web (dist es el default de Vite)
  webDir: 'dist',

  // Configuración del servidor para desarrollo
  server: {
    // URL de tu frontend real para pruebas en dispositivos
    url: 'https://app.tec.gt',

    // Permite conexiones HTTP no seguras (solo útil si pruebas en localhost)
    cleartext: true,
  },

  // Configuración de plugins nativos
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Camera: {
      permissions: {
        camera: 'Se requiere permiso para acceder a la cámara y tomar fotos',
      },
    },

    Geolocation: {
      permissions: {
        location: 'Se requiere permiso para acceder a tu ubicación',
      },
    },
  },
};

export default config;