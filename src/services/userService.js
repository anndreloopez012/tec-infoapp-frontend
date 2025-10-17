// ===============================================
// SERVICIO DE GESTIÓN DE USUARIOS
// ===============================================

import axios from 'axios';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, handleApiError } from '../config/api.js';
import { createSystemNotification } from '../hooks/useSystemNotifications.js';

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

class UserService {

  // ===============================================
  // OBTENER TODOS LOS USUARIOS
  // ===============================================
  async getUsers(params = {}) {
    try {
      console.log('👥 Obteniendo usuarios...', params);
      
      const queryParams = new URLSearchParams();
      
      // Paginación
      if (params.page) queryParams.append('pagination[page]', params.page);
      if (params.pageSize) queryParams.append('pagination[pageSize]', params.pageSize);
      
      // Ordenamiento
      if (params.sort) queryParams.append('sort', params.sort);
      
      // Filtros
      if (params.search) {
        queryParams.append('filters[$or][0][username][$containsi]', params.search);
        queryParams.append('filters[$or][1][email][$containsi]', params.search);
      }
      
      if (params.role) {
        queryParams.append('filters[role][name][$eq]', params.role);
      }
      
      if (params.confirmed !== undefined) {
        queryParams.append('filters[confirmed][$eq]', params.confirmed);
      }
      
      if (params.blocked !== undefined) {
        queryParams.append('filters[blocked][$eq]', params.blocked);
      }
      
      // Populate relations
      queryParams.append('populate[0]', 'role');
      queryParams.append('populate[1]', 'type_user');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}?${queryParams.toString()}`
      );

      console.log('🔍 Respuesta completa de API:', response.data);
      console.log('✅ Usuarios obtenidos:', response.data?.length || response.data.data?.length || 0);
      
      // Handle both direct array and Strapi v4 format
      const users = Array.isArray(response.data) ? response.data : response.data.data || [];
      const meta = response.data.meta || {};
      
      console.log('📊 Usuarios procesados:', users);
      console.log('📊 Meta data:', meta);
      
      return {
        success: true,
        data: users,
        meta: meta,
        pagination: meta.pagination || {}
      };
      
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener usuarios',
        data: [],
        meta: {}
      };
    }
  }

  // ===============================================
  // OBTENER USUARIO POR ID
  // ===============================================
  async getUserById(id) {
    try {
      console.log('👤 Obteniendo usuario por ID:', id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}?populate[0]=role&populate[1]=type_user`
      );

      console.log('✅ Usuario obtenido');
      
      // Handle both direct user object and Strapi v4 format
      const user = response.data.data || response.data;
      
      return {
        success: true,
        data: user
      };
      
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener usuario'
      };
    }
  }

  // ===============================================
  // CREAR NUEVO USUARIO
  // ===============================================
  async createUser(userData) {
    try {
      console.log('➕ Creando usuario...', { email: userData.email });
      
      const payload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirmed: userData.confirmed !== undefined ? userData.confirmed : true,
        blocked: userData.blocked || false,
        role: userData.role || null
      };
      
      // Agregar campos adicionales si existen
      if (userData.firstName) payload.firstName = userData.firstName;
      if (userData.lastName) payload.lastName = userData.lastName;
      if (userData.phone) payload.phone = userData.phone;
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}`,
        payload
      );

      console.log('✅ Usuario creado exitosamente');
      
      // Crear notificación de usuario creado
      createSystemNotification(
        'success',
        'Usuario creado',
        `Nuevo usuario registrado: ${userData.username || userData.email}`,
        {
          category: 'system',
          source: 'user_management',
          metadata: {
            userId: response.data.id,
            username: userData.username,
            email: userData.email,
            action: 'create'
          }
        }
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Usuario creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      
      const errorMessage = error.response?.data?.error?.message 
        || 'Error al crear usuario';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===============================================
  // ACTUALIZAR USUARIO
  // ===============================================
  async updateUser(id, userData) {
    try {
      console.log('✏️ Actualizando usuario:', id);
      
      const payload = { ...userData };
      
      // Remover campos que no se deben enviar
      delete payload.id;
      delete payload.documentId;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.publishedAt;
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}`,
        payload
      );

      console.log('✅ Usuario actualizado exitosamente');
      
      // Crear notificación de usuario actualizado
      createSystemNotification(
        'info',
        'Usuario actualizado',
        `Se actualizó la información del usuario: ${userData.username || userData.email || 'Usuario'}`,
        {
          category: 'system',
          source: 'user_management',
          metadata: {
            userId: id,
            action: 'update',
            updatedFields: Object.keys(userData)
          }
        }
      );
      
      return {
        success: true,
        data: response.data,
        message: 'Usuario actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al actualizar usuario'
      };
    }
  }

  // ===============================================
  // ELIMINAR USUARIO
  // ===============================================
  async deleteUser(id) {
    try {
      console.log('🗑️ Eliminando usuario:', id);
      
      // Obtener información del usuario antes de eliminarlo
      const userResponse = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}`
      );
      const userToDelete = userResponse.data;
      
      const response = await apiClient.delete(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}`
      );

      console.log('✅ Usuario eliminado exitosamente');
      
      // Crear notificación de usuario eliminado
      createSystemNotification(
        'warning',
        'Usuario eliminado',
        `Se eliminó el usuario: ${userToDelete.username || userToDelete.email || 'Usuario'}`,
        {
          category: 'system',
          source: 'user_management',
          metadata: {
            userId: id,
            username: userToDelete.username,
            email: userToDelete.email,
            action: 'delete'
          }
        }
      );
      
      return {
        success: true,
        message: 'Usuario eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al eliminar usuario'
      };
    }
  }

  // ===============================================
  // OBTENER CONTEO DE USUARIOS
  // ===============================================
  async getUsersCount(filters = {}) {
    try {
      console.log('🔢 Obteniendo conteo de usuarios...');
      
      const queryParams = new URLSearchParams();
      
      // Aplicar filtros para obtener usuarios filtrados
      if (filters.confirmed !== undefined) {
        queryParams.append('filters[confirmed][$eq]', filters.confirmed);
      }
      
      if (filters.blocked !== undefined) {
        queryParams.append('filters[blocked][$eq]', filters.blocked);
      }
      
      if (filters.role) {
        queryParams.append('filters[role][name][$eq]', filters.role);
      }
      
      // Usar la API normal de usuarios y contar el JSON
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}?${queryParams.toString()}`
      );

      // Manejar ambos formatos: arreglo directo o formato Strapi v4 con { data: [] }
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const count = data.length || 0;
      
      console.log('✅ Conteo obtenido:', count);
      
      return count;
      
    } catch (error) {
      console.error('❌ Error al obtener conteo:', error);
      return 0;
    }
  }

  // ===============================================
  // OBTENER PERFIL DEL USUARIO ACTUAL
  // ===============================================
  async getMyProfile() {
    try {
      console.log('👤 Obteniendo mi perfil...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.ME}?populate[0]=role&populate[1]=type_user`
      );

      // Actualizar datos en localStorage
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
      
      console.log('✅ Perfil obtenido');
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener perfil'
      };
    }
  }

  // ===============================================
  // ACTUALIZAR PERFIL DEL USUARIO ACTUAL
  // ===============================================
  async updateMyProfile(profileData) {
    try {
      console.log('✏️ Actualizando mi perfil...');
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.ME}`,
        profileData
      );

      // Actualizar datos en localStorage
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
      
      console.log('✅ Perfil actualizado exitosamente');
      
      return {
        success: true,
        data: response.data,
        message: 'Perfil actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al actualizar perfil'
      };
    }
  }

  // ===============================================
  // CAMBIAR ESTADO DEL USUARIO (BLOQUEAR/DESBLOQUEAR)
  // ===============================================
  async toggleUserStatus(id, blocked) {
    try {
      console.log(`${blocked ? '🔒' : '🔓'} ${blocked ? 'Bloqueando' : 'Desbloqueando'} usuario:`, id);
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}`,
        { blocked }
      );

      console.log(`✅ Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} exitosamente`);
      
      return {
        success: true,
        data: response.data,
        message: `Usuario ${blocked ? 'bloqueado' : 'desbloqueado'} exitosamente`
      };
      
    } catch (error) {
      console.error(`❌ Error al ${blocked ? 'bloquear' : 'desbloquear'} usuario:`, error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || `Error al ${blocked ? 'bloquear' : 'desbloquear'} usuario`
      };
    }
  }

  // ===============================================
  // CONFIRMAR EMAIL DE USUARIO
  // ===============================================
  async confirmUser(id) {
    try {
      console.log('✅ Confirmando usuario:', id);
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.USERS.BASE}/${id}`,
        { confirmed: true }
      );

      console.log('✅ Usuario confirmado exitosamente');
      
      return {
        success: true,
        data: response.data,
        message: 'Usuario confirmado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al confirmar usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al confirmar usuario'
      };
    }
  }

  // ===============================================
  // OBTENER ESTADÍSTICAS DE USUARIOS
  // ===============================================
  async getUserStats() {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios...');
      
      const [totalCount, confirmedCount, blockedCount] = await Promise.all([
        this.getUsersCount(),
        this.getUsersCount({ confirmed: true }),
        this.getUsersCount({ blocked: true })
      ]);
      
      const stats = {
        total: totalCount,
        confirmed: confirmedCount,
        blocked: blockedCount,
        pending: totalCount - confirmedCount,
        active: confirmedCount - blockedCount
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
  // BUSCAR USUARIOS
  // ===============================================
  async searchUsers(query, limit = 10) {
    try {
      console.log('🔍 Buscando usuarios:', query);
      
      const params = {
        search: query,
        pageSize: limit,
        sort: 'username:asc'
      };
      
      const result = await this.getUsers(params);
      
      console.log('✅ Búsqueda completada:', result.data?.length || 0, 'resultados');
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      
      return {
        success: false,
        error: 'Error en la búsqueda',
        data: []
      };
    }
  }
}

// Crear instancia singleton
const userService = new UserService();

export { userService as UserService };
export default userService;