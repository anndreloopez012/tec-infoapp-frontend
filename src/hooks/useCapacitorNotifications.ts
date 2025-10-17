import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { globalNotificationService } from '@/services/globalNotificationService';
import { useToast } from '@/hooks/use-toast';
import pushNotificationService from '@/services/pushNotificationService';

export interface NotificationPermission {
  receive: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
}

export const useCapacitorNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermission>({
    receive: 'prompt'
  });
  const [registrationToken, setRegistrationToken] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar tanto para plataformas nativas como web
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    } else {
      // Para web, inicializar notificaciones web push
      initializeWebPushNotifications();
    }
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      setPermissions(permission);

      if (permission.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();

        // Listen for registration token
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          setRegistrationToken(token.value);
          // Enviar el token al backend Strapi
          sendTokenToBackend(token.value, Capacitor.getPlatform());
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          toast({
            title: 'Error de notificaciones',
            description: 'No se pudieron configurar las notificaciones push',
            variant: 'destructive'
          });
        });

        // Listen for push notifications received
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          toast({
            title: notification.title || 'Nueva notificación',
            description: notification.body || 'Tienes una nueva notificación'
          });
        });

        // Listen for push notification actions
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification.actionId, notification.inputValue);
          // Aquí puedes manejar acciones específicas de las notificaciones
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const sendTokenToBackend = async (token: string, platform: string = 'web') => {
    try {
      console.log('🔔 Enviando token al backend:', { token: token.substring(0, 20) + '...', platform });
      await globalNotificationService.subscribeToPush(token, platform);
      console.log('✅ Token guardado exitosamente');
      toast({
        title: 'Notificaciones activadas',
        description: 'Se han configurado las notificaciones push correctamente'
      });
    } catch (error) {
      console.error('❌ Error sending token to backend:', error);
      toast({
        title: 'Error de notificaciones',
        description: 'No se pudo configurar las notificaciones push',
        variant: 'destructive'
      });
    }
  };

  const initializeWebPushNotifications = async () => {
    try {
      console.log('🌐 Inicializando notificaciones web push...');
      
      // Verificar soporte
      if (!pushNotificationService.isNotificationSupported()) {
        console.log('⚠️ Notificaciones no soportadas en este navegador');
        return;
      }

      // Reflejar estado actual de permiso en UI (default -> prompt)
      if (typeof Notification !== 'undefined') {
        const current = Notification.permission === 'default' ? 'prompt' : Notification.permission;
        setPermissions({ receive: current as any });
      }

      // Solicitar permisos y suscribirse
      const subscription = await pushNotificationService.subscribeToPush();
      
      // Si llegamos aquí, permisos fueron otorgados
      setPermissions({ receive: 'granted' });
      
      if (subscription) {
        // Convertir la suscripción a un token identificable
        const subscriptionJson = subscription.toJSON();
        const webPushToken = JSON.stringify(subscriptionJson);
        
        console.log('🔑 Token de notificación web obtenido');
        setRegistrationToken(webPushToken);
        
        // Enviar al backend
        await sendTokenToBackend(webPushToken, 'web');
      }
    } catch (error) {
      console.error('❌ Error inicializando notificaciones web:', error);
      // Reflejar permiso actual en la UI aunque falle la suscripción
      if (typeof Notification !== 'undefined') {
        const current = Notification.permission === 'default' ? 'prompt' : Notification.permission;
        setPermissions({ receive: current as any });
      }
      toast({
        title: 'Error de notificaciones web',
        description: 'No se pudieron configurar las notificaciones web',
        variant: 'destructive'
      });
    }
  };

  const unregisterNotifications = async () => {
    try {
      await PushNotifications.removeAllListeners();
      setRegistrationToken('');
      setPermissions({ receive: 'prompt' });
    } catch (error) {
      console.error('Error unregistering notifications:', error);
    }
  };

  return {
    permissions,
    registrationToken,
    initializePushNotifications,
    initializeWebPushNotifications,
    unregisterNotifications
  };
};