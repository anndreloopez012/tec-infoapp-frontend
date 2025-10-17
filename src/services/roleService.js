// ===============================================
// SERVICIO DE GESTIÓN DE ROLES
// ===============================================

import axios from 'axios';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, handleApiError } from '../config/api.js';

// Configurar axios
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para agregar auth headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);

class RoleService {

  // ===============================================
  // OBTENER TODOS LOS ROLES
  // ===============================================
  async getRoles() {
    try {
      console.log('🛡️ Obteniendo roles...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}`
      );

      console.log('✅ Roles obtenidos:', response.data.roles?.length || 0);
      
      return {
        success: true,
        roles: response.data.roles || [],
        data: response.data.roles || []
      };
      
    } catch (error) {
      console.error('❌ Error al obtener roles:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener roles',
        roles: [],
        data: []
      };
    }
  }

  // ===============================================
  // OBTENER ROL POR ID
  // ===============================================
  async getRoleById(id) {
    try {
      console.log('🛡️ Obteniendo rol por ID:', id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${id}`
      );

      console.log('✅ Rol obtenido');
      
      return {
        success: true,
        data: response.data.role || response.data
      };
      
    } catch (error) {
      console.error('❌ Error al obtener rol:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener rol'
      };
    }
  }

  // ===============================================
  // CREAR NUEVO ROL
  // ===============================================
  async createRole(roleData) {
    try {
      console.log('➕ Creando rol...', { name: roleData.name });
      
      const payload = {
        name: roleData.name,
        description: roleData.description || '',
        type: roleData.type || roleData.name.toLowerCase().replace(/\s+/g, '_'),
        permissions: roleData.permissions || []
      };
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}`,
        payload
      );

      console.log('✅ Rol creado exitosamente');
      
      return {
        success: true,
        data: response.data.role || response.data,
        message: 'Rol creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al crear rol:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al crear rol'
      };
    }
  }

  // ===============================================
  // ACTUALIZAR ROL
  // ===============================================
  async updateRole(id, roleData) {
    try {
      console.log('✏️ Actualizando rol:', id);
      
      const payload = {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions
      };
      
      // Remover campos que no se deben enviar
      delete payload.id;
      delete payload.type; // El type no se puede cambiar
      delete payload.createdAt;
      delete payload.updatedAt;
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${id}`,
        payload
      );

      console.log('✅ Rol actualizado exitosamente');
      
      return {
        success: true,
        data: response.data.role || response.data,
        message: 'Rol actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar rol:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al actualizar rol'
      };
    }
  }

  // ===============================================
  // ELIMINAR ROL
  // ===============================================
  async deleteRole(id) {
    try {
      console.log('🗑️ Eliminando rol:', id);
      
      const response = await apiClient.delete(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${id}`
      );

      console.log('✅ Rol eliminado exitosamente');
      
      return {
        success: true,
        message: 'Rol eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al eliminar rol:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al eliminar rol'
      };
    }
  }

  // ===============================================
  // OBTENER PERMISOS DE UN ROL
  // ===============================================
  async getRolePermissions(id) {
    try {
      console.log('🔑 Obteniendo permisos del rol:', id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${id}`
      );

      const role = response.data.role || response.data;
      const permissions = role.permissions || [];
      
      console.log('✅ Permisos obtenidos:', permissions.length);
      
      return {
        success: true,
        data: permissions,
        role: role
      };
      
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener permisos',
        data: []
      };
    }
  }

  // ===============================================
  // ACTUALIZAR PERMISOS DE UN ROL
  // ===============================================
  async updateRolePermissions(id, permissions) {
    try {
      console.log('🔑 Actualizando permisos del rol:', id);
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${id}`,
        { permissions }
      );

      console.log('✅ Permisos actualizados exitosamente');
      
      return {
        success: true,
        data: response.data.role || response.data,
        message: 'Permisos actualizados exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar permisos:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al actualizar permisos'
      };
    }
  }

  // ===============================================
  // OBTENER ESTADÍSTICAS DE ROLES
  // ===============================================
  async getRoleStats() {
    try {
      console.log('📊 Obteniendo estadísticas de roles...');
      
      const result = await this.getRoles();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const roles = result.roles;
      const stats = {
        total: roles.length,
        system: roles.filter(role => ['authenticated', 'public'].includes(role.type)).length,
        custom: roles.filter(role => !['authenticated', 'public'].includes(role.type)).length,
        withUsers: roles.filter(role => role.users && role.users.length > 0).length
      };
      
      console.log('✅ Estadísticas obtenidas:', stats);
      
      return {
        success: true,
        data: stats
      };
      
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      
      return {
        success: false,
        error: 'Error al obtener estadísticas'
      };
    }
  }

  // ===============================================
  // BUSCAR ROLES
  // ===============================================
  async searchRoles(query) {
    try {
      console.log('🔍 Buscando roles:', query);
      
      const result = await this.getRoles();
      
      if (!result.success) {
        return result;
      }
      
      const filteredRoles = result.roles.filter(role => 
        role.name.toLowerCase().includes(query.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(query.toLowerCase()))
      );
      
      console.log('✅ Búsqueda completada:', filteredRoles.length, 'resultados');
      
      return {
        success: true,
        roles: filteredRoles,
        data: filteredRoles
      };
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      
      return {
        success: false,
        error: 'Error en la búsqueda',
        roles: [],
        data: []
      };
    }
  }

  // ===============================================
  // OBTENER ROLES DISPONIBLES PARA ASIGNAR
  // ===============================================
  async getAssignableRoles() {
    try {
      console.log('👥 Obteniendo roles asignables...');
      
      const result = await this.getRoles();
      
      if (!result.success) {
        return result;
      }
      
      // Filtrar roles que se pueden asignar (excluir 'public' generalmente)
      const assignableRoles = result.roles.filter(role => 
        role.type !== 'public'
      );
      
      console.log('✅ Roles asignables obtenidos:', assignableRoles.length);
      
      return {
        success: true,
        roles: assignableRoles,
        data: assignableRoles
      };
      
    } catch (error) {
      console.error('❌ Error al obtener roles asignables:', error);
      
      return {
        success: false,
        error: 'Error al obtener roles asignables',
        roles: [],
        data: []
      };
    }
  }

  // ===============================================
  // DUPLICAR ROL
  // ===============================================
  async duplicateRole(id, newName) {
    try {
      console.log('📋 Duplicando rol:', id);
      
      // Obtener rol original
      const originalResult = await this.getRoleById(id);
      
      if (!originalResult.success) {
        return originalResult;
      }
      
      const originalRole = originalResult.data;
      
      // Crear nuevo rol con los mismos permisos
      const newRoleData = {
        name: newName,
        description: `Copia de ${originalRole.name}`,
        permissions: originalRole.permissions || []
      };
      
      const result = await this.createRole(newRoleData);
      
      if (result.success) {
        console.log('✅ Rol duplicado exitosamente');
        result.message = 'Rol duplicado exitosamente';
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error al duplicar rol:', error);
      
      return {
        success: false,
        error: 'Error al duplicar rol'
      };
    }
  }
}

// Crear instancia singleton
const roleService = new RoleService();

export { roleService as RoleService };
export default roleService;