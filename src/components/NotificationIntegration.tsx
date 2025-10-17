import React from 'react';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useNotificationIntegration } from '@/hooks/useNotificationIntegration';

/**
 * Componente para integrar automáticamente las notificaciones del sistema
 * y registrar push tokens del usuario autenticado (web/nativo)
 * Este componente se monta una sola vez y maneja las notificaciones automáticas
 */
const NotificationIntegration: React.FC = () => {
  // Notificaciones internas existentes (no tocar)
  useSystemNotifications();
  // Inicializa push (guarda push-token en backend cuando hay usuario autenticado)
  useNotificationIntegration();
  
  // Este componente no renderiza nada visualmente
  return null;
};

export default NotificationIntegration;