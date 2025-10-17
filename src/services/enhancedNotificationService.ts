import { NotificationType, NotificationData } from './notificationTypes';
import { globalNotificationService } from './globalNotificationService';
import { buildApiUrl, getDefaultHeaders } from '@/config/api';

class EnhancedNotificationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
  }

  /**
   * Notificar login exitoso
   */
  async notifyLoginSuccess(userId: number) {
    const notification: NotificationData = {
      title: 'Inicio de sesión exitoso',
      message: `Has iniciado sesión correctamente a las ${new Date().toLocaleTimeString()}`,
      type: NotificationType.LOGIN_SUCCESS,
      recipient_type: 'specific_users',
      recipient_ids: [userId],
      priority: 'low'
    };

    return this.sendNotification(notification);
  }

  /**
   * Notificar login fallido
   */
  async notifyLoginFailed(email: string, ip?: string) {
    // Encontrar al usuario por email para notificarle
    try {
      const userResponse = await fetch(buildApiUrl(`/users?filters[email][$eq]=${encodeURIComponent(email)}`), {
        headers: getDefaultHeaders()
      });
      
      if (userResponse.ok) {
        const users = await userResponse.json();
        if (users.length > 0) {
          const notification: NotificationData = {
            title: 'Intento de acceso sospechoso',
            message: `Se detectó un intento de acceso fallido a tu cuenta desde ${ip || 'una ubicación desconocida'} a las ${new Date().toLocaleString()}`,
            type: NotificationType.LOGIN_FAILED,
            recipient_type: 'specific_users',
            recipient_ids: [users[0].id],
            priority: 'high'
          };

          return this.sendNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error notifying login failed:', error);
    }
  }

  /**
   * Notificar cambios en módulos
   */
  async notifyModuleChange(moduleName: string, action: string, involvedUserIds: number[], changedBy: number) {
    const notification: NotificationData = {
      title: `Cambio en ${moduleName}`,
      message: `Se ha realizado la acción "${action}" en el módulo ${moduleName}`,
      type: NotificationType.MODULE_UPDATED,
      recipient_type: 'specific_users',
      recipient_ids: involvedUserIds.filter(id => id !== changedBy), // No notificar al que hizo el cambio
      priority: 'medium',
      metadata: {
        module_name: moduleName,
        action: action,
        changed_by: changedBy
      }
    };

    return this.sendNotification(notification);
  }

  /**
   * Enviar notificación administrativa (compatible con Strapi default)
   */
  async sendAdminNotification(notification: any) {
    // No forzamos el tipo aquí; dejamos que venga desde el formulario
    // y normalizamos dentro de sendNotification
    return this.sendNotification(notification as any);
  }

  private async sendNotification(notification: any) {
    try {
      // Mapear tipo a los enumerados del Content Type de Strapi
      const mapType = (t: any) => {
        const allowed = ['info', 'success', 'warning', 'error', 'system'];
        if (typeof t === 'string' && allowed.includes(t)) return t;
        switch (t) {
          case NotificationType.LOGIN_SUCCESS:
            return 'success';
          case NotificationType.LOGIN_FAILED:
            return 'error';
          case NotificationType.MODULE_UPDATED:
            return 'info';
          case NotificationType.ADMIN_ANNOUNCEMENT:
            return 'system';
          default:
            return 'info';
        }
      };

      // Normalizar destino de usuarios según el modelo de Strapi
      const normalizedTargetUsers = (() => {
        if (notification.target_users) return notification.target_users;
        if (notification.recipient_type === 'role') return 'role_based';
        if (notification.recipient_type === 'specific_users') return 'specific';
        if (notification.recipient_type === 'all') return 'all';
        return notification.recipient_type || 'all';
      })();

      const targetRoles = notification.target_roles || notification.role_ids || [];
      const specificUserIds: number[] = notification.target_user_ids || notification.recipient_ids || [];

      // Construir payload EXACTO para global-notifications
      const strapiData: any = {
        title: notification.title,
        message: notification.message,
        type: mapType(notification.type),
        category: notification.category || 'general', // general, maintenance, update, security, promotion
        priority: notification.priority || 'medium', // low, medium, high, urgent
        target_users: normalizedTargetUsers, // all | active | role_based | specific
        is_active: notification.is_active !== undefined ? notification.is_active : true,
      };

      if (notification.scheduled_at) strapiData.scheduled_at = notification.scheduled_at;
      if (notification.expires_at) strapiData.expires_at = notification.expires_at;

      if (normalizedTargetUsers === 'role_based' && Array.isArray(targetRoles) && targetRoles.length) {
        strapiData.target_roles = targetRoles;
      }
      if (normalizedTargetUsers === 'specific' && Array.isArray(specificUserIds) && specificUserIds.length) {
        strapiData.target_user_ids = specificUserIds;
      }

      // Crear la notificación global
      const response = await fetch(buildApiUrl('/global-notifications'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ data: strapiData })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Strapi error creating global-notification:', err);
        throw new Error('Failed to create notification');
      }

      const created = await response.json();
      const notificationId = created?.data?.id ?? created?.id;

      // Resolver lista de usuarios destinatarios para poblar user-notifications
      let recipientUserIds: number[] = [];
      if (normalizedTargetUsers === 'all') {
        try {
          const res = await fetch(buildApiUrl('/users'), { headers: getDefaultHeaders() });
          if (res.ok) {
            const users = await res.json();
            recipientUserIds = (Array.isArray(users?.data) ? users.data : users).map((u: any) => u.id);
          }
        } catch (e) {
          console.error('Error getting all users:', e);
        }
      } else if (normalizedTargetUsers === 'active') {
        try {
          const res = await fetch(buildApiUrl('/users?filters[confirmed][$eq]=true&filters[blocked][$eq]=false'), { headers: getDefaultHeaders() });
          if (res.ok) {
            const users = await res.json();
            recipientUserIds = (Array.isArray(users?.data) ? users.data : users).map((u: any) => u.id);
          }
        } catch (e) {
          console.error('Error getting active users:', e);
        }
      } else if (normalizedTargetUsers === 'role_based' && Array.isArray(targetRoles) && targetRoles.length) {
        try {
          const res = await fetch(buildApiUrl('/users?populate=role'), { headers: getDefaultHeaders() });
          if (res.ok) {
            const users = await res.json();
            const list = Array.isArray(users?.data) ? users.data : users;
            recipientUserIds = list
              .filter((u: any) => u.role && targetRoles.includes(u.role.id))
              .map((u: any) => u.id);
          }
        } catch (e) {
          console.error('Error getting users by role:', e);
        }
      } else if (normalizedTargetUsers === 'specific') {
        recipientUserIds = specificUserIds;
      }

      // Crear registros en user-notifications según el esquema provisto
      if (notificationId && Array.isArray(recipientUserIds) && recipientUserIds.length > 0) {
        await Promise.all(
          recipientUserIds.map(async (uid) => {
            try {
              await fetch(buildApiUrl('/user-notifications'), {
                method: 'POST',
                headers: getDefaultHeaders(),
                body: JSON.stringify({
                  data: {
                    user: uid,
                    notification: notificationId,
                    is_read: false,
                    read_at: null,
                    is_delivered: false,
                    delivered_at: null
                  }
                })
              });
            } catch (e) {
              console.error('Failed to create user-notification for user', uid, e);
            }
          })
        );
      }

      // Enviar push
      await globalNotificationService.sendPushToUsers(
        recipientUserIds || [],
        strapiData.title,
        strapiData.message
      );

      return created;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getUserNotifications(userId: number, page = 1, limit = 20) {
    try {
      console.log('🔍 Fetching user notifications for user:', userId);
      
      // Intentar primero el endpoint por defecto de Strapi para user-notifications
      const response = await fetch(
        buildApiUrl(`/user-notifications?filters[user][id][$eq]=${userId}&pagination[page]=${page}&pagination[pageSize]=${limit}&sort=createdAt:desc&populate=notification`),
        {
          headers: getDefaultHeaders()
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User notifications response:', result);
        return result;
      }

      console.log('⚠️ Falling back to global notifications');
      
      // Fallback: usar global-notifications (endpoints por defecto) y filtrar en el cliente
      const fallbackRes = await fetch(
        buildApiUrl(`/global-notifications?pagination[page]=${page}&pagination[pageSize]=${limit}&sort=createdAt:desc`),
        {
          headers: getDefaultHeaders()
        }
      );

      if (!fallbackRes.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const json: any = await fallbackRes.json();
      const items: any[] = Array.isArray(json?.data) ? json.data : [];

      console.log('📦 Global notifications fallback data:', items);

      const normalized = items
        .map((item: any) => {
          const attributes = item?.attributes || {};
          const targetUsers = attributes.target_users || attributes.targetUsers;
          const targetUserIds: number[] = attributes.target_user_ids || attributes.targetUserIds || [];
          const appliesToUser =
            targetUsers === 'all' ||
            (targetUsers === 'specific' && Array.isArray(targetUserIds) && targetUserIds.includes(userId));

          if (!appliesToUser) return null;

          // IMPORTANTE: En el fallback, no tenemos un user-notification real, 
          // así que no podemos marcar como leído ni eliminar
          return {
            id: `fallback-${item.id}`, // Prefijo para identificar que es fallback
            notification: {
              title: attributes.title ?? 'Sin título',
              message: attributes.message ?? '',
              type: attributes.type ?? 'info',
              category: attributes.category ?? 'general',
              priority: attributes.priority ?? 'medium'
            },
            read_at: null,
            createdAt: attributes.createdAt ?? new Date().toISOString(),
            isFallback: true // Flag para identificar notificaciones fallback
          };
        })
        .filter(Boolean);

      console.log('📋 Normalized fallback notifications:', normalized);
      return { data: normalized, meta: json?.meta || {} };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(userNotificationIdOrDocId: number | string) {
    try {
      // Resolver identificador: preferir documentId cuando sea posible
      let identifier: string | number = userNotificationIdOrDocId;
      if (typeof userNotificationIdOrDocId === 'number') {
        try {
          const resp = await fetch(
            buildApiUrl(`/user-notifications?filters[id][$eq]=${userNotificationIdOrDocId}`),
            { method: 'GET', headers: getDefaultHeaders() }
          );
          if (resp.ok) {
            const json = await resp.json();
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
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación de usuario
   */
  async deleteUserNotification(userNotificationIdOrDocId: number | string) {
    try {
      // Resolver identificador: preferir documentId cuando sea posible
      let identifier: string | number = userNotificationIdOrDocId;
      if (typeof userNotificationIdOrDocId === 'number') {
        try {
          const resp = await fetch(
            buildApiUrl(`/user-notifications?filters[id][$eq]=${userNotificationIdOrDocId}`),
            { method: 'GET', headers: getDefaultHeaders() }
          );
          if (resp.ok) {
            const json = await resp.json();
            const first = Array.isArray(json?.data) && json.data.length ? json.data[0] : null;
            if (first?.documentId) identifier = first.documentId;
          }
        } catch (_) {}
      }

      const response = await fetch(buildApiUrl(`/user-notifications/${identifier}`), {
        method: 'DELETE',
        headers: getDefaultHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();