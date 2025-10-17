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

class UserTypeService {

  // ===============================================
  // OBTENER TODOS LOS TIPOS DE USUARIO
  // ===============================================
  async getUserTypes() {
    try {
      console.log('📋 Obteniendo tipos de usuario...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}`
      );

      console.log('✅ Tipos de usuario obtenidos:', response.data.data?.length || 0);
      
      return {
        success: true,
        data: response.data.data || []
      };
      
    } catch (error) {
      console.error('❌ Error al obtener tipos de usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener tipos de usuario',
        data: []
      };
    }
  }

  // ===============================================
  // OBTENER TIPO DE USUARIO POR ID
  // ===============================================
  async getUserTypeById(id) {
    try {
      console.log('📋 Obteniendo tipo de usuario por ID:', id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.TYPE_USERS}/${id}`
      );

      console.log('✅ Tipo de usuario obtenido');
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Error al obtener tipo de usuario:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener tipo de usuario'
      };
    }
  }
}

// Crear instancia singleton
const userTypeService = new UserTypeService();

export { userTypeService as UserTypeService };
export default userTypeService;