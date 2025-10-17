// ===============================================
// SERVICIO DE GESTIÓN DE TIPOS DE USUARIO
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

class TypeUserService {

  // ===============================================
  // OBTENER TODOS LOS TIPOS DE USUARIO
  // ===============================================
  async getTypeUsers(params = {}) {
    try {
      console.log('📋 Obteniendo tipos de usuario...', params);
      
      const queryParams = new URLSearchParams();
      
      // Paginación
      if (params.page) queryParams.append('pagination[page]', params.page);
      if (params.pageSize) queryParams.append('pagination[pageSize]', params.pageSize);
      
      // Ordenamiento
      if (params.sort) queryParams.append('sort', params.sort);
      
      // Filtros
      if (params.search) {
        queryParams.append('filters[$or][0][Tipo][$containsi]', params.search);
        queryParams.append('filters[$or][1][Descripcion][$containsi]', params.search);
      }
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}?${queryParams.toString()}`
      );

      console.log('🔍 Respuesta completa de API:', response.data);
      console.log('✅ Tipos de usuario obtenidos:', response.data?.length || response.data.data?.length || 0);
      
      // Handle both direct array and Strapi v4 format
      const typeUsers = Array.isArray(response.data) ? response.data : response.data.data || [];
      const meta = response.data.meta || {};
      
      console.log('📊 Tipos de usuario procesados:', typeUsers);
      console.log('📊 Meta data:', meta);
      
      return {
        success: true,
        data: typeUsers,
        meta: meta,
        pagination: meta.pagination || {}
      };
      
    } catch (error) {
      console.error('❌ Error al obtener tipos de usuario:', error);
      
      return {
        success: false,
        data: [],
        meta: {},
        pagination: {},
        error: error?.response?.data?.error?.message || 'Error al obtener tipos de usuario'
      };
    }
  }

  // ===============================================
  // OBTENER TIPO DE USUARIO POR ID
  // ===============================================
  async getTypeUserById(id) {
    try {
      console.log('🔍 Obteniendo tipo de usuario por ID:', id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}/${id}`
      );
      
      console.log('✅ Tipo de usuario obtenido:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data
      };
      
    } catch (error) {
      console.error('❌ Error al obtener tipo de usuario:', error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || 'Error al obtener tipo de usuario'
      };
    }
  }

  // ===============================================
  // CREAR TIPO DE USUARIO
  // ===============================================
  async createTypeUser(typeUserData) {
    try {
      console.log('➕ Creando tipo de usuario:', typeUserData);
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}`, 
        {
          data: typeUserData
        }
      );
      
      console.log('✅ Tipo de usuario creado:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Tipo de usuario creado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al crear tipo de usuario:', error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || 'Error al crear tipo de usuario'
      };
    }
  }

  // ===============================================
  // ACTUALIZAR TIPO DE USUARIO
  // ===============================================
  async updateTypeUser(id, typeUserData) {
    try {
      console.log('✏️ Actualizando tipo de usuario:', id, typeUserData);
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}/${id}`, 
        {
          data: typeUserData
        }
      );
      
      console.log('✅ Tipo de usuario actualizado:', response.data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Tipo de usuario actualizado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar tipo de usuario:', error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || 'Error al actualizar tipo de usuario'
      };
    }
  }

  // ===============================================
  // ELIMINAR TIPO DE USUARIO
  // ===============================================
  async deleteTypeUser(id) {
    try {
      console.log('🗑️ Eliminando tipo de usuario:', id);
      
      const response = await apiClient.delete(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}/${id}`
      );
      
      console.log('✅ Tipo de usuario eliminado:', response.data);
      
      return {
        success: true,
        data: response.data,
        message: 'Tipo de usuario eliminado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al eliminar tipo de usuario:', error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || 'Error al eliminar tipo de usuario'
      };
    }
  }

  // ===============================================
  // OBTENER CONTEO DE TIPOS DE USUARIO
  // ===============================================
  async getTypeUsersCount(filters = {}) {
    try {
      console.log('🔢 Obteniendo conteo de tipos de usuario...', filters);
      
      const queryParams = new URLSearchParams();
      
      if (filters.search) {
        queryParams.append('filters[$or][0][Tipo][$containsi]', filters.search);
        queryParams.append('filters[$or][1][Descripcion][$containsi]', filters.search);
      }
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}/count?${queryParams.toString()}`
      );
      
      console.log('✅ Conteo obtenido:', response.data);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Error al obtener conteo:', error);
      
      return {
        success: false,
        data: 0,
        error: error?.response?.data?.error?.message || 'Error al obtener conteo'
      };
    }
  }

  // ===============================================
  // BUSCAR TIPOS DE USUARIO
  // ===============================================
  async searchTypeUsers(query, limit = 10) {
    try {
      console.log('🔍 Buscando tipos de usuario:', query);
      
      const queryParams = new URLSearchParams();
      queryParams.append('filters[$or][0][Tipo][$containsi]', query);
      queryParams.append('filters[$or][1][Descripcion][$containsi]', query);
      queryParams.append('pagination[pageSize]', limit.toString());
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}?${queryParams.toString()}`
      );
      
      console.log('✅ Búsqueda completada:', response.data);
      
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.data || []
      };
      
    } catch (error) {
      console.error('❌ Error en la búsqueda:', error);
      
      return {
        success: false,
        data: [],
        error: error?.response?.data?.error?.message || 'Error en la búsqueda'
      };
    }
  }
}

// Crear y exportar la instancia del servicio
const typeUserService = new TypeUserService();

export default typeUserService;