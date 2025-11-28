import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { enhancedNotificationService } from '@/services/enhancedNotificationService';
import { useCapacitorNotifications } from './useCapacitorNotifications';

/**
 * Hook que integra las notificaciones con el sistema de autenticación
 * y maneja las notificaciones automáticas del sistema
 */
export const useNotificationIntegration = () => {
  const { user, isAuthenticated } = useAuth();
  const { initializePushNotifications } = useCapacitorNotifications();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Inicializar notificaciones push cuando el usuario esté autenticado
      initializePushNotifications();
      
      // Notificar login exitoso
      if (user.id) {
        enhancedNotificationService.notifyLoginSuccess(user.id).catch(console.error);
      }
    }
    
    // Reset cuando el usuario se desloguee
    if (!isAuthenticated) {
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated, user?.id]);

  return {
    // Funciones para usar en componentes
    notifyModuleChange: enhancedNotificationService.notifyModuleChange.bind(enhancedNotificationService),
    sendAdminNotification: enhancedNotificationService.sendAdminNotification.bind(enhancedNotificationService),
    getUserNotifications: enhancedNotificationService.getUserNotifications.bind(enhancedNotificationService),
    markAsRead: enhancedNotificationService.markAsRead.bind(enhancedNotificationService)
  };
};