/**
 * Tipos de notificaciones del sistema
 */
export enum NotificationType {
  // Autenticación
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  
  // Módulos y cambios
  MODULE_UPDATED = 'module_updated',
  DATA_CHANGED = 'data_changed',
  APPROVAL_NEEDED = 'approval_needed',
  
  // Administrativas
  ADMIN_ANNOUNCEMENT = 'admin_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  POLICY_UPDATE = 'policy_update',
  
  // Generales
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export interface NotificationData {
  id?: number;
  title: string;
  message: string;
  type: NotificationType;
  recipient_type: 'all' | 'role' | 'specific_users';
  recipient_ids?: number[];
  role_ids?: number[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_at?: string;
  expires_at?: string;
  metadata?: {
    module_name?: string;
    action?: string;
    related_id?: number;
    [key: string]: any;
  };
}

export interface NotificationTemplate {
  [NotificationType.LOGIN_SUCCESS]: {
    title: 'Inicio de sesión exitoso';
    message: 'Has iniciado sesión correctamente en {app_name}';
  };
  [NotificationType.LOGIN_FAILED]: {
    title: 'Error de inicio de sesión';
    message: 'Intento de inicio de sesión fallido desde {device} a las {time}';
  };
  [NotificationType.MODULE_UPDATED]: {
    title: 'Módulo actualizado';
    message: 'El módulo {module_name} ha sido actualizado. Revisa los cambios.';
  };
}