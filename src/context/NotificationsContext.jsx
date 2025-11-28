import React, { createContext, useContext, useReducer, useEffect, useRef, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import notificationService from '@/services/notificationService.js';
import { enhancedNotificationService } from '@/services/enhancedNotificationService';

// Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null
};

// Tipos de acciones
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const notificationsReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_NOTIFICATIONS:
      const notifications = action.payload;
      const unreadCount = notifications.filter(n => !n.read).length;
      return { 
        ...state, 
        notifications, 
        unreadCount,
        isLoading: false,
        error: null 
      };
    
    case ActionTypes.ADD_NOTIFICATION:
      const newNotification = {
        id: Date.now(),
        ...action.payload,
        read: false,
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case ActionTypes.MARK_AS_READ:
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount
      };
    
    case ActionTypes.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      };
    
    case ActionTypes.DELETE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredUnreadCount
      };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Crear contexto
const NotificationsContext = createContext();

// Hook personalizado
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

// Provider
export const NotificationsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationsReducer, initialState);
  const loadingRef = useRef(false);

  // Cargar notificaciones reales del servicio - SIN INTERVALO AUTOMÁTICO
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Evitar múltiples cargas simultáneas
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Obtener userId del localStorage
      const userData = JSON.parse(localStorage.getItem('crm_user_data') || '{}');
      const userId = userData.id;
      
      if (userId) {
        // Cargar notificaciones reales de Strapi
        const response = await enhancedNotificationService.getUserNotifications(userId);
        const notifications = response.data?.map(userNotification => {
          return {
            id: userNotification.id,
            title: userNotification.notification?.title || 'Sin título',
            message: userNotification.notification?.message || 'Sin mensaje',
            type: userNotification.notification?.type || 'info',
            category: userNotification.notification?.category || 'general',
            priority: userNotification.notification?.priority || 'medium',
            read: !!userNotification.read_at,
            createdAt: userNotification.createdAt || new Date().toISOString(),
            isFallback: userNotification.isFallback || false
          };
        }) || [];
        
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications });
      } else {
        // Fallback al servicio local si no hay usuario
        const notifications = notificationService.getAllNotifications();
        dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback al servicio local en caso de error
      const notifications = notificationService.getAllNotifications();
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications });
    } finally {
      loadingRef.current = false;
    }
  };

  // Agregar nueva notificación
  const addNotification = (notification) => {
    const newNotification = notificationService.addNotification(notification);
    if (newNotification) {
      dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: newNotification });
      
      // Mostrar toast solo para notificaciones importantes
      if (notification.type === 'error' || notification.type === 'warning') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default'
        });
      }
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId) => {
    try {
      // Intentar marcar como leída en Strapi
      await enhancedNotificationService.markAsRead(notificationId);
      
      // Recargar notificaciones para reflejar los cambios
      await loadNotifications();
      
      toast({
        title: "Notificación marcada como leída",
        variant: "default"
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      // Fallback al servicio local
      const success = notificationService.markAsRead(notificationId);
      if (success) {
        dispatch({ type: ActionTypes.MARK_AS_READ, payload: notificationId });
      }
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      // Obtener todas las notificaciones no leídas
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Marcar cada una como leída
      await Promise.all(
        unreadNotifications.map(notification => 
          enhancedNotificationService.markAsRead(notification.id)
        )
      );
      
      // Recargar notificaciones
      await loadNotifications();
      
      toast({
        title: "Todas las notificaciones marcadas como leídas",
        variant: "default"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Fallback al servicio local
      const success = notificationService.markAllAsRead();
      if (success) {
        dispatch({ type: ActionTypes.MARK_ALL_AS_READ });
      }
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId) => {
    try {
      // Verificar si es una notificación fallback (no se puede eliminar)
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.isFallback || String(notificationId).startsWith('fallback-')) {
        toast({
          title: "No se puede eliminar",
          description: "Esta notificación no se puede eliminar",
          variant: "destructive"
        });
        return;
      }

      console.log('🗑️ Deleting notification:', notificationId);
      
      // Eliminar en Strapi
      await enhancedNotificationService.deleteUserNotification(notificationId);
      
      // Recargar notificaciones para reflejar los cambios
      await loadNotifications();
      
      toast({
        title: "Notificación eliminada",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la notificación",
        variant: "destructive"
      });
      // Fallback al servicio local
      const success = notificationService.deleteNotification(notificationId);
      if (success) {
        dispatch({ type: ActionTypes.DELETE_NOTIFICATION, payload: notificationId });
      }
    }
  };

  // Obtener notificaciones por tipo usando el servicio
  const getNotificationsByType = (type) => {
    return notificationService.getNotificationsByType(type);
  };

  // Obtener notificaciones por categoría usando el servicio
  const getNotificationsByCategory = (category) => {
    return notificationService.getNotificationsByCategory(category);
  };

  // Obtener notificaciones recientes usando el servicio
  const getRecentNotifications = (limit = 10) => {
    return notificationService.getRecentNotifications(limit);
  };

  // Formatear tiempo relativo usando el servicio
  const getRelativeTime = (dateString) => {
    return notificationService.getRelativeTime(dateString);
  };

  // Obtener estadísticas
  const getNotificationStats = () => {
    return notificationService.getNotificationStats();
  };

  // Funciones adicionales del servicio
  const clearAllNotifications = () => {
    const success = notificationService.clearAllNotifications();
    if (success) {
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: [] });
    }
    return success;
  };

  const exportNotifications = () => {
    return notificationService.exportNotifications();
  };

  const importNotifications = (jsonData) => {
    const success = notificationService.importNotifications(jsonData);
    if (success) {
      loadNotifications(); // Recargar notificaciones después de importar
    }
    return success;
  };

  // Memoizar el valor para evitar re-renders innecesarios
  const value = useMemo(() => ({
    // State
    ...state,
    
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Helpers
    getNotificationsByType,
    getNotificationsByCategory,
    getRecentNotifications,
    getRelativeTime,
    getNotificationStats,
    
    // Admin functions
    clearAllNotifications,
    exportNotifications,
    importNotifications,
    
    // Utils
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    refreshNotifications: loadNotifications
  }), [state]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;