// ===============================================
// SERVICIO DE GESTIÓN DE PERMISOS
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

class PermissionService {

  // ===============================================
  // OBTENER TODOS LOS PERMISOS
  // ===============================================
  async getPermissions() {
    try {
      console.log('🔑 Obteniendo permisos...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.PERMISSIONS}`
      );

      console.log('📋 Respuesta completa de permisos:', response.data);

      // Strapi users-permissions devuelve los permisos en formato diferente
      let permissions = [];
      
      if (response.data.permissions) {
        // Si viene en formato {permissions: {...}}
        const permissionsObj = response.data.permissions;
        permissions = Object.keys(permissionsObj).flatMap(controllerName => {
          const controllerPerms = permissionsObj[controllerName].controllers;
          return Object.keys(controllerPerms).flatMap(actionName => {
            const actionData = controllerPerms[actionName];
            return {
              id: `${controllerName}.${actionName}`,
              action: actionName,
              subject: controllerName,
              controller: controllerName,
              conditions: null,
              inverted: false,
              enabled: actionData.enabled || false,
              policy: actionData.policy || ''
            };
          });
        });
      } else if (Array.isArray(response.data)) {
        permissions = response.data;
      } else {
        permissions = [];
      }
      
      console.log('✅ Permisos procesados:', permissions.length);
      
      return {
        success: true,
        permissions: permissions,
        data: permissions
      };
      
    } catch (error) {
      console.error('❌ Error al obtener permisos:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener permisos',
        permissions: [],
        data: []
      };
    }
  }

  // ===============================================
  // OBTENER PERMISOS ORGANIZADOS POR CONTROLADOR
  // ===============================================
  async getPermissionsByController() {
    try {
      console.log('📋 Obteniendo permisos por controlador...');
      
      const result = await this.getPermissions();
      
      if (!result.success) {
        return result;
      }
      
      const permissions = result.permissions;
      const organized = {};
      
      permissions.forEach(permission => {
        const controller = permission.controller || 'general';
        
        if (!organized[controller]) {
          organized[controller] = {
            name: controller,
            displayName: this.getControllerDisplayName(controller),
            permissions: []
          };
        }
        
        organized[controller].permissions.push({
          ...permission,
          displayName: this.getPermissionDisplayName(permission)
        });
      });
      
      // Ordenar controladores y permisos
      const sortedControllers = Object.keys(organized).sort().map(key => ({
        ...organized[key],
        permissions: organized[key].permissions.sort((a, b) => a.action.localeCompare(b.action))
      }));
      
      console.log('✅ Permisos organizados:', sortedControllers.length, 'controladores');
      
      return {
        success: true,
        data: sortedControllers,
        controllers: sortedControllers
      };
      
    } catch (error) {
      console.error('❌ Error al organizar permisos:', error);
      
      return {
        success: false,
        error: 'Error al organizar permisos',
        data: [],
        controllers: []
      };
    }
  }

  // ===============================================
  // OBTENER PERMISOS DE UN ROL ESPECÍFICO
  // ===============================================
  async getRolePermissions(roleId) {
    try {
      console.log('🛡️ Obteniendo permisos del rol:', roleId);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${roleId}`
      );

      console.log('📋 Respuesta del rol:', response.data);

      const role = response.data.role || response.data;
      
      // En Strapi users-permissions, los permisos están en formato objeto
      let permissions = [];
      
      if (role.permissions) {
        // Convertir el objeto de permisos a array
        const permissionsObj = role.permissions;
        permissions = Object.keys(permissionsObj).flatMap(controllerName => {
          const controllerPerms = permissionsObj[controllerName].controllers || {};
          return Object.keys(controllerPerms).map(actionName => {
            const actionData = controllerPerms[actionName];
            return {
              id: `${controllerName}.${actionName}`,
              action: actionName,
              subject: controllerName,
              controller: controllerName,
              conditions: null,
              inverted: false,
              enabled: actionData.enabled || false,
              policy: actionData.policy || ''
            };
          });
        });
      }
      
      console.log('✅ Permisos del rol procesados:', permissions.length);
      
      return {
        success: true,
        data: permissions,
        permissions: permissions,
        role: role
      };
      
    } catch (error) {
      console.error('❌ Error al obtener permisos del rol:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener permisos del rol',
        data: [],
        permissions: []
      };
    }
  }

  // ===============================================
  // ACTUALIZAR PERMISOS DE UN ROL
  // ===============================================
  async updateRolePermissions(roleId, permissionIds) {
    try {
      console.log('🔄 Actualizando permisos del rol:', roleId, 'con permisos:', permissionIds);
      
      // Primero obtenemos el rol actual para mantener su estructura
      const currentRoleResponse = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${roleId}`
      );
      
      const currentRole = currentRoleResponse.data.role || currentRoleResponse.data;
      
      // Convertir los IDs de permisos a estructura de Strapi
      const permissionsObj = {};
      
      permissionIds.forEach(permId => {
        if (typeof permId === 'string' && permId.includes('.')) {
          const [controller, action] = permId.split('.');
          
          if (!permissionsObj[controller]) {
            permissionsObj[controller] = {
              controllers: {}
            };
          }
          
          permissionsObj[controller].controllers[action] = {
            enabled: true,
            policy: ''
          };
        }
      });
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.ROLES}/${roleId}`,
        {
          permissions: permissionsObj
        }
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
  // VERIFICAR SI UN ROL TIENE UN PERMISO ESPECÍFICO
  // ===============================================
  async hasRolePermission(roleId, permissionAction, permissionController = null) {
    try {
      const result = await this.getRolePermissions(roleId);
      
      if (!result.success) {
        return false;
      }
      
      const permissions = result.permissions;
      
      return permissions.some(permission => {
        if (permissionController) {
          return permission.action === permissionAction && 
                 permission.controller === permissionController;
        }
        return permission.action === permissionAction;
      });
      
    } catch (error) {
      console.error('❌ Error al verificar permiso:', error);
      return false;
    }
  }

  // ===============================================
  // OBTENER MATRIZ DE PERMISOS (ROLES VS PERMISOS)
  // ===============================================
  async getPermissionMatrix() {
    try {
      console.log('📊 Generando matriz de permisos...');
      
      // Importar RoleService para evitar dependencias circulares
      const { RoleService } = await import('./roleService.js');
      
      const [permissionsResult, rolesResult] = await Promise.all([
        this.getPermissions(),
        RoleService.getRoles()
      ]);
      
      if (!permissionsResult.success || !rolesResult.success) {
        throw new Error('Error al obtener datos');
      }
      
      const permissions = permissionsResult.permissions;
      const roles = rolesResult.roles;
      
      // Crear matriz
      const matrix = roles.map(role => ({
        role: role,
        permissions: permissions.map(permission => ({
          permission: permission,
          hasPermission: role.permissions?.some(rp => 
            rp.id === permission.id ||
            (rp.action === permission.action && rp.controller === permission.controller)
          ) || false
        }))
      }));
      
      console.log('✅ Matriz generada exitosamente');
      
      return {
        success: true,
        data: {
          matrix: matrix,
          roles: roles,
          permissions: permissions
        }
      };
      
    } catch (error) {
      console.error('❌ Error al generar matriz:', error);
      
      return {
        success: false,
        error: 'Error al generar matriz de permisos'
      };
    }
  }

  // ===============================================
  // BUSCAR PERMISOS
  // ===============================================
  async searchPermissions(query) {
    try {
      console.log('🔍 Buscando permisos:', query);
      
      const result = await this.getPermissions();
      
      if (!result.success) {
        return result;
      }
      
      const filteredPermissions = result.permissions.filter(permission => 
        permission.action.toLowerCase().includes(query.toLowerCase()) ||
        permission.controller.toLowerCase().includes(query.toLowerCase()) ||
        this.getPermissionDisplayName(permission).toLowerCase().includes(query.toLowerCase())
      );
      
      console.log('✅ Búsqueda completada:', filteredPermissions.length, 'resultados');
      
      return {
        success: true,
        permissions: filteredPermissions,
        data: filteredPermissions
      };
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      
      return {
        success: false,
        error: 'Error en la búsqueda',
        permissions: [],
        data: []
      };
    }
  }

  // ===============================================
  // UTILS - OBTENER NOMBRE AMIGABLE DEL CONTROLADOR
  // ===============================================
  getControllerDisplayName(controller) {
    const controllerNames = {
      'api::user.user': 'Usuarios',
      'api::role.role': 'Roles',
      'api::permission.permission': 'Permisos',
      'api::global.global': 'Configuración Global',
      'plugin::users-permissions.user': 'Gestión de Usuarios',
      'plugin::users-permissions.role': 'Gestión de Roles',
      'plugin::users-permissions.auth': 'Autenticación',
      'plugin::upload.upload': 'Archivos y Medios',
      'application': 'Aplicación',
      'admin': 'Administración'
    };
    
    return controllerNames[controller] || this.capitalizeFirst(controller);
  }

  // ===============================================
  // UTILS - OBTENER NOMBRE AMIGABLE DEL PERMISO
  // ===============================================
  getPermissionDisplayName(permission) {
    const actionNames = {
      'find': 'Ver/Listar',
      'findOne': 'Ver Detalles',
      'create': 'Crear',
      'update': 'Editar',
      'delete': 'Eliminar',
      'count': 'Contar',
      'me': 'Ver Perfil',
      'changePassword': 'Cambiar Contraseña',
      'forgotPassword': 'Recuperar Contraseña',
      'resetPassword': 'Restablecer Contraseña',
      'emailConfirmation': 'Confirmar Email',
      'sendEmailConfirmation': 'Enviar Confirmación'
    };
    
    const actionName = actionNames[permission.action] || this.capitalizeFirst(permission.action);
    const controllerName = this.getControllerDisplayName(permission.controller);
    
    return `${actionName} - ${controllerName}`;
  }

  // ===============================================
  // UTILS - CAPITALIZAR PRIMERA LETRA
  // ===============================================
  capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_]/g, ' ');
  }

  // ===============================================
  // OBTENER ESTADÍSTICAS DE PERMISOS
  // ===============================================
  async getPermissionStats() {
    try {
      console.log('📊 Obteniendo estadísticas de permisos...');
      
      const result = await this.getPermissions();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const permissions = result.permissions;
      
      // Agrupar por controlador
      const byController = {};
      const byAction = {};
      
      permissions.forEach(permission => {
        // Por controlador
        const controller = permission.controller;
        if (!byController[controller]) {
          byController[controller] = 0;
        }
        byController[controller]++;
        
        // Por acción
        const action = permission.action;
        if (!byAction[action]) {
          byAction[action] = 0;
        }
        byAction[action]++;
      });
      
      const stats = {
        total: permissions.length,
        controllers: Object.keys(byController).length,
        actions: Object.keys(byAction).length,
        byController: byController,
        byAction: byAction,
        mostCommonAction: Object.keys(byAction).reduce((a, b) => 
          byAction[a] > byAction[b] ? a : b
        )
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
}

// Crear instancia singleton
const permissionService = new PermissionService();

export { permissionService as PermissionService };
export default permissionService;