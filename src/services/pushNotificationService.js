// Service para manejar Push Notifications de manera funcional
class PushNotificationService {
  constructor() {
    this.vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; // Clave pública VAPID válida
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.registration = null;
    this.subscription = null;
  }

  // Verificar si las notificaciones están soportadas
  isNotificationSupported() {
    return this.isSupported && 'Notification' in window;
  }

  // Obtener el estado actual de permisos
  getPermissionStatus() {
    if (!this.isNotificationSupported()) {
      return 'not-supported';
    }
    return Notification.permission;
  }

  // Solicitar permisos para notificaciones
  async requestPermission() {
    if (!this.isNotificationSupported()) {
      throw new Error('Las notificaciones push no están soportadas en este navegador');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Los permisos de notificación han sido denegados por el usuario');
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Permisos de notificación denegados');
    }

    return permission;
  }

  // Obtener o crear suscripción push
  async subscribeToPush() {
    try {
      // Asegurar que tenemos permisos
      await this.requestPermission();

      // Obtener service worker registration
      this.registration = await navigator.serviceWorker.ready;

      // Verificar si ya existe una suscripción
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Crear nueva suscripción
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey)
        });
      }

      this.subscription = subscription;

      // Almacenar suscripción localmente
      localStorage.setItem('pushSubscription', JSON.stringify(subscription.toJSON()));

      return subscription;
    } catch (error) {
      console.error('Error al suscribirse a push notifications:', error);
      throw error;
    }
  }

  // Desuscribirse de push notifications
  async unsubscribeFromPush() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
      }

      // Limpiar almacenamiento local
      localStorage.removeItem('pushSubscription');
      localStorage.removeItem('notificationSettings');

      return true;
    } catch (error) {
      console.error('Error al desuscribirse:', error);
      throw error;
    }
  }

  // Obtener suscripción actual
  async getCurrentSubscription() {
    try {
      if (!this.isNotificationSupported()) {
        return null;
      }

      this.registration = await navigator.serviceWorker.ready;
      this.subscription = await this.registration.pushManager.getSubscription();

      return this.subscription;
    } catch (error) {
      console.error('Error al obtener suscripción:', error);
      return null;
    }
  }

  // Enviar notificación de prueba local
  async sendTestNotification(title = 'Notificación de Prueba', body = 'Esta es una notificación de prueba del Admin Panel') {
    try {
      await this.requestPermission();

      const notification = new Notification(title, {
        body,
        icon: '/logoTec.png',
        badge: '/logoTec.png',
        image: '/icon-512x512.png',
        tag: 'test-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'Ver más'
          },
          {
            action: 'dismiss',
            title: 'Cerrar'
          }
        ]
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
      throw error;
    }
  }

  // Configurar opciones de notificación
  saveNotificationSettings(settings) {
    const defaultSettings = {
      enabled: true,
      sound: true,
      vibration: true,
      showPreview: true,
      autoClose: true,
      autoCloseDelay: 5000,
      categories: {
        system: true,
        security: true,
        updates: true,
        reminders: true
      }
    };

    const finalSettings = { ...defaultSettings, ...settings };
    localStorage.setItem('notificationSettings', JSON.stringify(finalSettings));
    return finalSettings;
  }

  // Obtener configuraciones de notificación
  getNotificationSettings() {
    const stored = localStorage.getItem('notificationSettings');
    const defaultSettings = {
      enabled: true,
      sound: true,
      vibration: true,
      showPreview: true,
      autoClose: true,
      autoCloseDelay: 5000,
      categories: {
        system: true,
        security: true,
        updates: true,
        reminders: true
      }
    };

    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  }

  // Enviar notificación push a través del service worker
  async sendPushNotification(data) {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready;
      }

      // Enviar mensaje al service worker para mostrar notificación
      this.registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        data: {
          title: data.title || 'CRM Admin Panel',
          body: data.body || 'Nueva notificación',
          icon: data.icon || '/logoTec.png',
          badge: data.badge || '/logoTec.png',
          tag: data.tag || 'admin-notification',
          data: data.data || {},
          actions: data.actions || [
            { action: 'view', title: 'Ver más' },
            { action: 'dismiss', title: 'Cerrar' }
          ]
        }
      });

      return true;
    } catch (error) {
      console.error('Error al enviar push notification:', error);
      throw error;
    }
  }

  // Utility para convertir VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Obtener estadísticas de notificaciones
  getNotificationStats() {
    const stats = localStorage.getItem('notificationStats');
    const defaultStats = {
      totalSent: 0,
      totalReceived: 0,
      lastNotification: null,
      categories: {
        system: 0,
        security: 0,
        updates: 0,
        reminders: 0
      }
    };

    return stats ? JSON.parse(stats) : defaultStats;
  }

  // Actualizar estadísticas
  updateNotificationStats(category = 'system') {
    const stats = this.getNotificationStats();
    stats.totalSent += 1;
    stats.lastNotification = new Date().toISOString();
    if (stats.categories[category] !== undefined) {
      stats.categories[category] += 1;
    }

    localStorage.setItem('notificationStats', JSON.stringify(stats));
    return stats;
  }
}

export default new PushNotificationService();