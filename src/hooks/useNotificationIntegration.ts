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
  const { initialize, unregister } = useCapacitorNotifications();
  const loginNotificationSentRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      initialize().catch((error) => {
        console.warn('[NotificationIntegration] Error al inicializar push:', error);
      });

      if (loginNotificationSentRef.current !== user.id) {
        loginNotificationSentRef.current = user.id;
        enhancedNotificationService.notifyLoginSuccess(user.id).catch(console.error);
      }

      return;
    }

    if (!isAuthenticated) {
      loginNotificationSentRef.current = null;
      unregister().catch(() => {});
    }
  }, [initialize, isAuthenticated, unregister, user?.id]);

  return {
    notifyModuleChange: enhancedNotificationService.notifyModuleChange.bind(enhancedNotificationService),
    sendAdminNotification: enhancedNotificationService.sendAdminNotification.bind(enhancedNotificationService),
    getUserNotifications: enhancedNotificationService.getUserNotifications.bind(enhancedNotificationService),
    markAsRead: enhancedNotificationService.markAsRead.bind(enhancedNotificationService)
  };
};
