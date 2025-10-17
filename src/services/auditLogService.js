import axios from 'axios';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, handleApiError } from '@/config/api.js';

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

// Service for audit logs
export const auditLogService = {
  // Get all audit logs with pagination and filters
  getAuditLogs: async (page = 1, pageSize = 25, filters = {}) => {
    try {
      const params = new URLSearchParams({
        'pagination[page]': page.toString(),
        'pagination[pageSize]': pageSize.toString(),
      });

      // Add filters if provided
      if (filters.model) {
        params.append('filters[model][$eq]', filters.model);
      }
      if (filters.action) {
        params.append('filters[action][$eq]', filters.action);
      }

      const response = await apiClient.get(`/${API_CONFIG.API_PREFIX}/audit-logs?${params}`);
      
      console.log('🚀 AUDIT LOGS RESPONSE:', response.data);
      
      // Extract only the required fields - NO ATTRIBUTES ACCESS
      const processedData = response.data.data.map(log => {
        console.log('📋 Processing log item:', log);
        return {
          id: log.id,
          action: log.action || '',
          model: log.model || '',
          entry: log.entry || 0,
          after: log.after ? JSON.stringify(log.after, null, 2) : '',
          createdAt: log.createdAt
        };
      });

      return {
        data: processedData,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
};

export default auditLogService;