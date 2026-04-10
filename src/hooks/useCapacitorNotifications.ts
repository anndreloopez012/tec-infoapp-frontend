import { useCallback, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { NATIVE_FEATURES } from '@/config/nativeFeatures';
import { globalNotificationService } from '@/services/globalNotificationService';
import pushNotificationService from '@/services/pushNotificationService';

export type PushPermissionStatus =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'prompt-with-rationale'
  | 'not-supported'
  | 'disabled';

export interface UsePushNotificationsReturn {
  permissionStatus: PushPermissionStatus;
  isRegistered: boolean;
  registrationToken: string;
  initialize: () => Promise<void>;
  unregister: () => Promise<void>;
  initializePushNotifications: () => Promise<void>;
  initializeWebPushNotifications: () => Promise<void>;
  unregisterNotifications: () => Promise<void>;
  permissions: { receive: PushPermissionStatus };
}

let nativeListenersRegistered = false;

export const useCapacitorNotifications = (): UsePushNotificationsReturn => {
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>(
    NATIVE_FEATURES.PUSH_NOTIFICATIONS ? 'prompt' : 'disabled'
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string>('');
  const initAttemptedRef = useRef(false);

  const sendTokenToBackend = useCallback(async (token: string, platform: string) => {
    await globalNotificationService.subscribeToPush(token, platform);
  }, []);

  const initializeNative = useCallback(async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      if (nativeListenersRegistered) {
        console.log('[Push] Listeners ya registrados, solicitando token fresco...');
        await PushNotifications.register();
        return;
      }

      const permission = await PushNotifications.requestPermissions();
      const status = permission.receive as PushPermissionStatus;
      setPermissionStatus(status);

      if (status !== 'granted') {
        console.log('[Push] Permiso nativo denegado:', status);
        return;
      }

      nativeListenersRegistered = true;

      PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] Token nativo obtenido para', Capacitor.getPlatform());
        setRegistrationToken(token.value);
        setIsRegistered(true);
        await sendTokenToBackend(token.value, Capacitor.getPlatform());
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Error de registro:', JSON.stringify(error));
        setIsRegistered(false);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Notificación en foreground recibida:', notification.title);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Acción:', action.actionId);
        const url = action.notification?.data?.url;
        if (url && typeof window !== 'undefined') {
          window.location.href = String(url);
        }
      });

      await PushNotifications.register();
    } catch (error) {
      console.warn('[Push] Error inicializando push nativo:', error);
    }
  }, [sendTokenToBackend]);

  const initializeWeb = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined' || !pushNotificationService.isNotificationSupported()) {
        setPermissionStatus('not-supported');
        return;
      }

      const current = Notification.permission;
      setPermissionStatus(current === 'default' ? 'prompt' : (current as PushPermissionStatus));

      if (current !== 'granted') {
        return;
      }

      const subscription = await pushNotificationService.subscribeToPush();
      if (subscription) {
        const webPushToken = JSON.stringify(subscription.toJSON());
        setRegistrationToken(webPushToken);
        setIsRegistered(true);
        await sendTokenToBackend(webPushToken, 'web');
      }
    } catch (error) {
      console.warn('[Push] Error inicializando Web Push:', error);
      if (typeof Notification !== 'undefined') {
        const current = Notification.permission === 'default' ? 'prompt' : Notification.permission;
        setPermissionStatus(current as PushPermissionStatus);
      }
    }
  }, [sendTokenToBackend]);

  const initialize = useCallback(async () => {
    if (!NATIVE_FEATURES.PUSH_NOTIFICATIONS) {
      console.log('[Push] Sistema desactivado por configuración');
      return;
    }

    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    if (Capacitor.isNativePlatform()) {
      await initializeNative();
      return;
    }

    await initializeWeb();
  }, [initializeNative, initializeWeb]);

  const unregister = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform() && nativeListenersRegistered) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllListeners();
        nativeListenersRegistered = false;
      }
    } catch (error) {
      console.warn('[Push] Error al desregistrar notificaciones:', error);
    } finally {
      setIsRegistered(false);
      setRegistrationToken('');
      setPermissionStatus(NATIVE_FEATURES.PUSH_NOTIFICATIONS ? 'prompt' : 'disabled');
      initAttemptedRef.current = false;
    }
  }, []);

  return {
    permissionStatus,
    isRegistered,
    registrationToken,
    initialize,
    unregister,
    initializePushNotifications: initialize,
    initializeWebPushNotifications: initializeWeb,
    unregisterNotifications: unregister,
    permissions: { receive: permissionStatus }
  };
};
