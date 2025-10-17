import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';

/**
 * Hook que integra autenticación con permisos
 * Carga automáticamente los permisos cuando el usuario se autentica
 */
export function useAuthPermissions() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    loadUserPermissions, 
    clearPermissions, 
    permissions,
    navigationMenus,
    userPermissions,
    isLoading: permissionsLoading,
    hasPermission,
    canAccessModule 
  } = usePermissions();

  // Cargar permisos cuando el usuario esté autenticado y tenga rol
  useEffect(() => {
    const loadPermissions = async () => {
      if (isAuthenticated && user?.role?.id && !permissionsLoading && !permissions.length) {
        console.log('🔐 Usuario autenticado, cargando permisos para rol:', user.role.id);
        try {
          await loadUserPermissions(user.role.id);
        } catch (error) {
          console.error('❌ Error al cargar permisos del usuario:', error);
        }
      } else if (!isAuthenticated) {
        // Limpiar permisos si el usuario no está autenticado
        clearPermissions();
      }
    };

    // Solo ejecutar si no está cargando la autenticación
    if (!authLoading) {
      loadPermissions();
    }
  }, [isAuthenticated, user?.role?.id, authLoading, loadUserPermissions, clearPermissions]);

  return {
    // Estado
    isAuthenticated,
    user,
    permissions,
    navigationMenus,
    userPermissions,
    isLoading: authLoading || permissionsLoading,
    
    // Funciones de permisos
    hasPermission,
    canAccessModule,
    
    // Funciones de utilidad
    loadUserPermissions,
    clearPermissions
  };
}