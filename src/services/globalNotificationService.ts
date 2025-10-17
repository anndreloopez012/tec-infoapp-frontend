import { API_CONFIG, buildApiUrl, getDefaultHeaders, handleApiError } from '@/config/api';

export interface GlobalNotification {
  id?: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  category?: 'general' | 'maintenance' | 'update' | 'security' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_users?: 'all' | 'active' | 'role_based' | 'specific';
  target_roles?: string[];
  target_user_ids?: number[];
  scheduled_at?: string;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_read: number;
  delivery_rate: number;
  read_rate: number;
}

class GlobalNotificationService {
  
  // Crear notificación global
  async createNotification(notification: GlobalNotification): Promise<GlobalNotification> {
    try {
      const response = await fetch(buildApiUrl('/global-notifications'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ data: notification })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Enviar notificación inmediatamente
  async sendNotification(notificationId: number): Promise<boolean> {
    try {
      const response = await fetch(buildApiUrl(`/global-notifications/${notificationId}/send`), {
        method: 'POST',
        headers: getDefaultHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Obtener notificaciones para el usuario actual
  async getUserNotifications(userId: number, page = 1, pageSize = 20): Promise<{
    notifications: GlobalNotification[];
    pagination: any;
  }> {
    try {
      const response = await fetch(buildApiUrl(`/user-notifications?filters[user][id][$eq]=${userId}&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=created_at:desc`), {
        method: 'GET',
        headers: getDefaultHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        notifications: result.data,
        pagination: result.meta.pagination
      };
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(userNotificationIdOrDocId: number | string): Promise<boolean> {
    try {
      // Resolver identificador (usar documentId cuando sea posible)
      let identifier: string | number = userNotificationIdOrDocId;
      if (typeof userNotificationIdOrDocId === 'number') {
        try {
          const lookup = await fetch(
            buildApiUrl(`/user-notifications?filters[id][$eq]=${userNotificationIdOrDocId}`),
            { method: 'GET', headers: getDefaultHeaders() }
          );
          if (lookup.ok) {
            const json = await lookup.json();
            const first = Array.isArray(json?.data) && json.data.length ? json.data[0] : null;
            if (first?.documentId) identifier = first.documentId;
          }
        } catch (_) {}
      }

      const response = await fetch(buildApiUrl(`/user-notifications/${identifier}`), {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          data: {
            is_read: true,
            read_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(notificationId?: number): Promise<NotificationStats> {
    try {
      const url = notificationId 
        ? `/notification-stats/${notificationId}`
        : '/notification-stats';
      
      const response = await fetch(buildApiUrl(url), {
        method: 'GET',
        headers: getDefaultHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Suscribir usuario a notificaciones push
  async subscribeToPush(pushToken: string, deviceType: string): Promise<boolean> {
    try {
      // 1) Resolver ID de usuario de forma confiable
      let userId: number | null = null;
      try {
        const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
        if (raw) userId = JSON.parse(raw)?.id ?? null;
      } catch (_) {}

      if (!userId) {
        // Intentar obtener el usuario actual desde la API (requiere JWT válido)
        const meRes = await fetch(buildApiUrl('/users/me'), {
          method: 'GET',
          headers: getDefaultHeaders()
        });
        if (meRes.ok) {
          const me = await meRes.json();
          userId = me?.id ?? null;
          if (userId) {
            // Cachear para futuros usos
            const cachedUser = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
            try {
              const parsed = cachedUser ? JSON.parse(cachedUser) : {};
              localStorage.setItem(
                API_CONFIG.STORAGE_KEYS.USER_DATA,
                JSON.stringify({ ...parsed, id: userId })
              );
            } catch (_) {}
          }
        }
      }

      if (!userId) {
        console.warn('subscribeToPush: No se pudo determinar el ID de usuario. Abortando registro de push-token.');
        return false;
      }

      // 2) Buscar si ya existe un token para este usuario+dispositivo
      const findRes = await fetch(
        buildApiUrl(
          `/push-tokens?filters[user][id][$eq]=${userId}&filters[device_type][$eq]=${encodeURIComponent(
            deviceType
          )}`
        ),
        { method: 'GET', headers: getDefaultHeaders() }
      );

      let existing: any | null = null;
      if (findRes.ok) {
        const found = await findRes.json();
        const list = found?.data || [];
        existing = Array.isArray(list) && list.length > 0 ? list[0] : null;
      }

      // 3) Actualizar si existe, crear si no
      if (existing?.id) {
        const identifier = existing.documentId || existing.id;
        const updateRes = await fetch(buildApiUrl(`/push-tokens/${identifier}`), {
          method: 'PUT',
          headers: getDefaultHeaders(),
          body: JSON.stringify({
            data: {
              token: pushToken,
              device_type: deviceType,
              user: userId,
              is_active: true
            }
          })
        });
        if (!updateRes.ok) {
          throw new Error(`HTTP error! status: ${updateRes.status}`);
        }
        return true;
      }

      // Crear nuevo registro
      const createRes = await fetch(buildApiUrl('/push-tokens'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          data: {
            token: pushToken,
            device_type: deviceType,
            user: userId,
            is_active: true
          }
        })
      });
      if (!createRes.ok) {
        throw new Error(`HTTP error! status: ${createRes.status}`);
      }
      return true;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  // Enviar push notification a usuarios específicos
  async sendPushToUsers(userIds: number[], title: string, message: string): Promise<boolean> {
    try {
      // Primero obtener los tokens de push de los usuarios
      const userIdsQuery = userIds.map((id, index) => `filters[user][id][$in][${index}]=${id}`).join('&');
      const tokensResponse = await fetch(buildApiUrl(`/push-tokens?${userIdsQuery}&filters[is_active][$eq]=true`), {
        method: 'GET',
        headers: getDefaultHeaders()
      });

      if (!tokensResponse.ok) {
        throw new Error(`HTTP error! status: ${tokensResponse.status}`);
      }

      const tokensResult = await tokensResponse.json();
      const tokens = tokensResult.data || [];

      if (tokens.length === 0) {
        console.log('No se encontraron tokens de push activos para los usuarios especificados');
        return true; // No es un error, simplemente no hay tokens
      }

      // Enviar notificaciones push usando los tokens obtenidos
      // Aquí podrías integrar con un servicio de push notifications real como Firebase FCM
      console.log('Enviando push notifications a tokens:', tokens.map(t => ({ token: t.token, device_type: t.device_type })));
      console.log('Título:', title);
      console.log('Mensaje:', message);

      // Por el momento retornamos true - aquí deberías integrar con tu servicio de push real
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      // No lanzar error para que no falle el flujo principal
      return false;
    }
  }
}

export const globalNotificationService = new GlobalNotificationService();