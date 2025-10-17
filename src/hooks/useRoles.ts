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

  // Obtiene el tipo de rol para comparaciones (normalizado)
  const getRoleType = (targetUser: any = user): string => {
    const rawType = targetUser?.role?.type || targetUser?.role?.name || '';
    const t = String(rawType).toLowerCase().replace(/-/g, '_');
    if (t === 'super_admin' || t === 'superadmin' || t === 'super') return 'super';
    if (t === 'administrator' || t === 'admin') return 'admin';
    return rawType || '';
  };
  return { 
    getRoleLabelForUser, 
    getUserType, 
    getRoleType,
    loading: false,
    error: null 
  };
}
