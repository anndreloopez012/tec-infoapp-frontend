// Hook para obtener información del usuario desde la nueva API
import { useAuth } from '@/context/AuthContext';

export function useRoles() {
  const { user } = useAuth();

  // Obtiene el nombre del rol del usuario
  const getRoleLabelForUser = (targetUser: any = user): string => {
    if (!targetUser?.role) return 'Sin rol';
    return targetUser.role.name || 'Sin rol';
  };

  // Obtiene el tipo de usuario
  const getUserType = (targetUser: any = user): string => {
    if (!targetUser?.type_user?.Tipo) return 'Sin tipo';
    return targetUser.type_user.Tipo;
  };

  // Obtiene el tipo de rol para comparaciones
  const getRoleType = (targetUser: any = user): string => {
    if (!targetUser?.role?.type) return '';
    return targetUser.role.type;
  };

  return { 
    getRoleLabelForUser, 
    getUserType, 
    getRoleType,
    loading: false,
    error: null 
  };
}
