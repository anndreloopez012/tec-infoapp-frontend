export type NotificationPermission = 'granted' | 'denied' | 'default';

interface WebPushOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

class WebPushService {
  private permission: NotificationPermission = 'default';
  private isSupported = false;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async sendNotification(options: WebPushOptions): Promise<Notification | null> {
    if (!this.isSupported || document.hidden) {
      return null;
    }

    if (this.permission !== 'granted') {
      const nextPermission = await this.requestPermission();
      if (nextPermission !== 'granted') {
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
        data: options.data,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        options.onClick?.();
        notification.close();
      };

      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }
}

export const webPushService = new WebPushService();
export default webPushService;
