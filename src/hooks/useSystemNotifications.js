import { useEffect, useRef } from 'react';
import { useNotifications } from '@/context/NotificationsContext';
import { useAuth } from '@/context/AuthContext';
import notificationService from '@/services/notificationService';

/**
 * Hook para manejar notificaciones automáticas del sistema
 * Se conecta a eventos del sistema y genera notificaciones cuando es necesario
 */
export const useSystemNotifications = () => {
  const { addNotification } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      
      // Notificación de bienvenida cuando el usuario se loguea
      addNotification({
        title: `Bienvenido, ${user.name || user.username}`,
        message: 'Has iniciado sesión exitosamente en el sistema',
        type: 'success',
        category: 'system',
        source: 'auth_login',
        metadata: {
          userId: user.id,
          userRole: user.role?.name
        }
      });

      // Verificar si hay actualizaciones del sistema
      checkSystemUpdates();
      
      // Verificar notificaciones de seguridad
      checkSecurityAlerts();
    }
    
    // Reset cuando el usuario se desloguee
    if (!isAuthenticated) {
      hasNotifiedRef.current = false;
    }
  }, [isAuthenticated, user?.id]);

  // Verificar actualizaciones del sistema
  const checkSystemUpdates = () => {
    const lastUpdateCheck = localStorage.getItem('last_update_check');
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (!lastUpdateCheck || new Date(lastUpdateCheck) < oneDayAgo) {
      // Simular verificación de actualizaciones
      setTimeout(() => {
        const hasUpdates = Math.random() > 0.7; // 30% probabilidad de actualizaciones
        
        if (hasUpdates) {
          addNotification({
            title: 'Actualización disponible',
            message: 'Hay una nueva versión del sistema disponible. Se recomienda actualizar.',
            type: 'info',
            category: 'updates',
            source: 'system_update_check'
          });
        }
        
        localStorage.setItem('last_update_check', now.toISOString());
      }, 5000); // Verificar después de 5 segundos
    }
  };

  // Verificar alertas de seguridad
  const checkSecurityAlerts = () => {
    const failedLoginAttempts = localStorage.getItem('failed_login_attempts');
    
    if (failedLoginAttempts && parseInt(failedLoginAttempts) > 5) {
      addNotification({
        title: 'Alerta de seguridad',
        message: `Se detectaron ${failedLoginAttempts} intentos de login fallidos recientes`,
        type: 'warning',
        category: 'security',
        source: 'security_monitor'
      });
      
      localStorage.removeItem('failed_login_attempts');
    }
  };

  // Función para crear notificaciones de eventos de usuario
  const notifyUserEvent = (event, data = {}) => {
    const notifications = {
      user_created: {
        title: 'Nuevo usuario registrado',
        message: `Se ha registrado un nuevo usuario: ${data.username || 'Usuario'}`,
        type: 'info',
        category: 'system'
      },
      user_updated: {
        title: 'Usuario actualizado',
        message: `Se ha actualizado la información del usuario: ${data.username || 'Usuario'}`,
        type: 'info',
        category: 'system'
      },
      user_deleted: {
        title: 'Usuario eliminado',
        message: `Se ha eliminado el usuario: ${data.username || 'Usuario'}`,
        type: 'warning',
        category: 'system'
      },
      role_changed: {
        title: 'Rol modificado',
        message: `Se ha cambiado el rol del usuario ${data.username || 'Usuario'} a ${data.newRole || 'Nuevo rol'}`,
        type: 'info',
        category: 'security'
      },
      password_changed: {
        title: 'Contraseña actualizada',
        message: 'Tu contraseña ha sido actualizada exitosamente',
        type: 'success',
        category: 'security'
      },
      login_failed: {
        title: 'Intento de login fallido',
        message: 'Se detectó un intento de login fallido en tu cuenta',
        type: 'warning',
        category: 'security'
      },
      session_expired: {
        title: 'Sesión expirada',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        type: 'info',
        category: 'system'
      }
    };

    const notification = notifications[event];
    if (notification) {
      addNotification({
        ...notification,
        source: `user_event_${event}`,
        metadata: data
      });
    }
  };

  // Función para crear notificaciones de sistema
  const notifySystemEvent = (event, data = {}) => {
    const notifications = {
      backup_completed: {
        title: 'Backup completado',
        message: 'El backup del sistema se ha completado exitosamente',
        type: 'success',
        category: 'system'
      },
      backup_failed: {
        title: 'Error en backup',
        message: 'El backup del sistema falló. Verifica los logs para más información.',
        type: 'error',
        category: 'system'
      },
      maintenance_scheduled: {
        title: 'Mantenimiento programado',
        message: `El sistema entrará en mantenimiento el ${data.date || 'próximamente'}`,
        type: 'info',
        category: 'reminders'
      },
      maintenance_started: {
        title: 'Mantenimiento iniciado',
        message: 'El sistema está en modo mantenimiento. Algunas funciones pueden no estar disponibles.',
        type: 'warning',
        category: 'system'
      },
      maintenance_completed: {
        title: 'Mantenimiento completado',
        message: 'El mantenimiento del sistema ha finalizado. Todas las funciones están disponibles.',
        type: 'success',
        category: 'system'
      },
      high_cpu_usage: {
        title: 'Uso alto de CPU',
        message: 'Se detectó un uso elevado de CPU en el servidor',
        type: 'warning',
        category: 'system'
      },
      database_slow: {
        title: 'Base de datos lenta',
        message: 'Se detectaron consultas lentas en la base de datos',
        type: 'warning',
        category: 'system'
      },
      storage_low: {
        title: 'Espacio de almacenamiento bajo',
        message: `El espacio disponible es menor al ${data.threshold || '10'}%`,
        type: 'error',
        category: 'system'
      }
    };

    const notification = notifications[event];
    if (notification) {
      addNotification({
        ...notification,
        source: `system_event_${event}`,
        metadata: data
      });
    }
  };

  // Función para crear notificaciones de API
  const notifyApiEvent = (event, data = {}) => {
    const notifications = {
      api_error: {
        title: 'Error de API',
        message: `Error en la API: ${data.endpoint || 'Endpoint desconocido'} - ${data.status || 'Error'}`,
        type: 'error',
        category: 'system'
      },
      api_slow: {
        title: 'API lenta',
        message: `Respuesta lenta de la API: ${data.endpoint || 'Endpoint'} (${data.responseTime || 'N/A'}ms)`,
        type: 'warning',
        category: 'system'
      },
      rate_limit_exceeded: {
        title: 'Límite de tasa excedido',
        message: `Se excedió el límite de solicitudes para: ${data.endpoint || 'API'}`,
        type: 'warning',
        category: 'system'
      },
      api_deprecated: {
        title: 'API deprecada',
        message: `Se está usando una API deprecada: ${data.endpoint || 'Endpoint'}`,
        type: 'info',
        category: 'updates'
      }
    };

    const notification = notifications[event];
    if (notification) {
      addNotification({
        ...notification,
        source: `api_event_${event}`,
        metadata: data
      });
    }
  };

  return {
    notifyUserEvent,
    notifySystemEvent,
    notifyApiEvent,
    addNotification
  };
};

// Función global para crear notificaciones desde cualquier parte de la app
export const createSystemNotification = (type, title, message, options = {}) => {
  return notificationService.addNotification({
    title,
    message,
    type: type || 'info',
    category: options.category || 'system',
    source: options.source || 'manual',
    metadata: options.metadata || {}
  });
};

// Función para monitorear errores de la app
export const setupErrorNotifications = () => {
  // Capturar errores de JavaScript
  window.addEventListener('error', (event) => {
    createSystemNotification(
      'error',
      'Error de JavaScript',
      `Error en ${event.filename}:${event.lineno} - ${event.message}`,
      {
        category: 'system',
        source: 'javascript_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          message: event.message
        }
      }
    );
  });

  // Capturar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    createSystemNotification(
      'error',
      'Error de Promise',
      `Promise rechazada: ${event.reason}`,
      {
        category: 'system',
        source: 'promise_rejection',
        metadata: {
          reason: event.reason
        }
      }
    );
  });

  // Monitorear conexión de red
  window.addEventListener('online', () => {
    createSystemNotification(
      'success',
      'Conexión restaurada',
      'La conexión a internet se ha restaurado',
      {
        category: 'system',
        source: 'network_status'
      }
    );
  });

  window.addEventListener('offline', () => {
    createSystemNotification(
      'warning',
      'Sin conexión',
      'Se perdió la conexión a internet. Trabajando en modo offline.',
      {
        category: 'system',
        source: 'network_status'
      }
    );
  });
};

export default useSystemNotifications;