class NotificationService {
  constructor() {
    this.storageKey = 'app_notifications';
    this.lastCleanupKey = 'notifications_last_cleanup';
    this.maxNotifications = 100; // Máximo de notificaciones a mantener
    
    // Verificar y ejecutar limpieza automática al inicializar
    this.checkAndCleanup();
  }

  // Verificar si necesita limpieza (cada mes)
  checkAndCleanup() {
    const lastCleanup = localStorage.getItem(this.lastCleanupKey);
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    if (!lastCleanup || new Date(lastCleanup) < oneMonthAgo) {
      this.cleanupOldNotifications();
      localStorage.setItem(this.lastCleanupKey, now.toISOString());
    }
  }

  // Limpiar notificaciones antiguas (más de 1 mes)
  cleanupOldNotifications() {
    const notifications = this.getAllNotifications();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentNotifications = notifications.filter(notification => {
      const notificationDate = new Date(notification.createdAt);
      return notificationDate > oneMonthAgo;
    });

    // Mantener solo las más recientes si excede el máximo
    const finalNotifications = recentNotifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, this.maxNotifications);

    localStorage.setItem(this.storageKey, JSON.stringify(finalNotifications));
    
    console.log(`🧹 Limpieza de notificaciones: ${notifications.length} -> ${finalNotifications.length}`);
    
    return finalNotifications;
  }

  // Obtener todas las notificaciones
  getAllNotifications() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error al obtener notificaciones:', error);
      return [];
    }
  }

  // Agregar nueva notificación
  addNotification(notification) {
    try {
      const notifications = this.getAllNotifications();
      
      const newNotification = {
        id: this.generateId(),
        title: notification.title || 'Notificación',
        message: notification.message || '',
        type: notification.type || 'info', // info, success, warning, error
        category: notification.category || 'system', // system, security, updates, reminders
        read: false,
        createdAt: new Date().toISOString(),
        source: notification.source || 'system', // Origen de la notificación
        metadata: notification.metadata || {} // Datos adicionales
      };

      // Agregar al inicio del array
      notifications.unshift(newNotification);

      // Mantener solo las más recientes
      const limitedNotifications = notifications.slice(0, this.maxNotifications);

      // Guardar en localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(limitedNotifications));

      console.log('✅ Notificación agregada:', newNotification.title);
      return newNotification;
    } catch (error) {
      console.error('❌ Error al agregar notificación:', error);
      return null;
    }
  }

  // Marcar notificación como leída
  markAsRead(notificationId) {
    try {
      const notifications = this.getAllNotifications();
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true, readAt: new Date().toISOString() }
          : notification
      );

      localStorage.setItem(this.storageKey, JSON.stringify(updatedNotifications));
      return true;
    } catch (error) {
      console.error('❌ Error al marcar como leída:', error);
      return false;
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    try {
      const notifications = this.getAllNotifications();
      const now = new Date().toISOString();
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: notification.readAt || now
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(updatedNotifications));
      return true;
    } catch (error) {
      console.error('❌ Error al marcar todas como leídas:', error);
      return false;
    }
  }

  // Eliminar notificación
  deleteNotification(notificationId) {
    try {
      const notifications = this.getAllNotifications();
      const filteredNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );

      localStorage.setItem(this.storageKey, JSON.stringify(filteredNotifications));
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar notificación:', error);
      return false;
    }
  }

  // Obtener notificaciones no leídas
  getUnreadNotifications() {
    return this.getAllNotifications().filter(notification => !notification.read);
  }

  // Obtener conteo de no leídas
  getUnreadCount() {
    return this.getUnreadNotifications().length;
  }

  // Obtener notificaciones por tipo
  getNotificationsByType(type) {
    return this.getAllNotifications().filter(notification => notification.type === type);
  }

  // Obtener notificaciones por categoría
  getNotificationsByCategory(category) {
    return this.getAllNotifications().filter(notification => notification.category === category);
  }

  // Obtener notificaciones recientes (últimas N)
  getRecentNotifications(limit = 10) {
    return this.getAllNotifications().slice(0, limit);
  }

  // Obtener estadísticas de notificaciones
  getNotificationStats() {
    const notifications = this.getAllNotifications();
    const unread = this.getUnreadNotifications();
    
    const stats = {
      total: notifications.length,
      unread: unread.length,
      read: notifications.length - unread.length,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length
      },
      byCategory: {
        system: notifications.filter(n => n.category === 'system').length,
        security: notifications.filter(n => n.category === 'security').length,
        updates: notifications.filter(n => n.category === 'updates').length,
        reminders: notifications.filter(n => n.category === 'reminders').length
      }
    };

    return stats;
  }

  // Generar ID único para notificación
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  // Formatear tiempo relativo
  getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'ahora mismo';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString();
  }

  // Limpiar todas las notificaciones (para testing/admin)
  clearAllNotifications() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.lastCleanupKey);
      console.log('🗑️ Todas las notificaciones han sido eliminadas');
      return true;
    } catch (error) {
      console.error('❌ Error al limpiar notificaciones:', error);
      return false;
    }
  }

  // Crear notificaciones del sistema automáticamente
  createSystemNotifications() {
    // Notificación de bienvenida del sistema
    this.addNotification({
      title: 'Sistema inicializado',
      message: 'El sistema de notificaciones está funcionando correctamente',
      type: 'success',
      category: 'system',
      source: 'system_init'
    });

    // Configurar notificaciones periódicas del sistema
    this.setupSystemNotifications();
  }

  // Configurar notificaciones automáticas del sistema
  setupSystemNotifications() {
    // Verificar el estado del sistema cada hora
    setInterval(() => {
      this.checkSystemHealth();
    }, 60 * 60 * 1000); // 1 hora

    // Recordatorio de backup diario
    setInterval(() => {
      this.addNotification({
        title: 'Backup programado',
        message: 'Recuerda verificar que el backup diario se haya ejecutado correctamente',
        type: 'info',
        category: 'reminders',
        source: 'system_scheduler'
      });
    }, 24 * 60 * 60 * 1000); // 24 horas
  }

  // Verificar salud del sistema
  checkSystemHealth() {
    // Verificar almacenamiento local
    try {
      const testKey = 'health_check_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Si llegamos aquí, el almacenamiento funciona bien
      const notifications = this.getAllNotifications();
      if (notifications.length > this.maxNotifications * 0.9) {
        this.addNotification({
          title: 'Almacenamiento de notificaciones alto',
          message: `Tienes ${notifications.length} notificaciones. Se realizará limpieza automática pronto.`,
          type: 'warning',
          category: 'system',
          source: 'health_check'
        });
      }
    } catch (error) {
      this.addNotification({
        title: 'Error en almacenamiento local',
        message: 'Se detectó un problema con el almacenamiento local del navegador',
        type: 'error',
        category: 'system',
        source: 'health_check'
      });
    }
  }

  // Exportar notificaciones (para backup)
  exportNotifications() {
    const notifications = this.getAllNotifications();
    const exportData = {
      notifications,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Importar notificaciones (desde backup)
  importNotifications(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      if (importData.notifications && Array.isArray(importData.notifications)) {
        localStorage.setItem(this.storageKey, JSON.stringify(importData.notifications));
        
        this.addNotification({
          title: 'Notificaciones importadas',
          message: `Se importaron ${importData.notifications.length} notificaciones exitosamente`,
          type: 'success',
          category: 'system',
          source: 'import'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error al importar notificaciones:', error);
      return false;
    }
  }
}

// Crear instancia singleton
const notificationService = new NotificationService();

// Inicializar notificaciones del sistema si es la primera vez
const isFirstRun = !localStorage.getItem('notifications_initialized');
if (isFirstRun) {
  notificationService.createSystemNotifications();
  localStorage.setItem('notifications_initialized', 'true');
}

export default notificationService;