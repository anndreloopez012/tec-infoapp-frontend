import axios from 'axios';
import { API_CONFIG } from '@/config/api.js';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

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

export const eventAttendanceService = {
  // Obtener todas las asistencias con filtros
  async getAll(params: any = {}) {
    try {
      const { page = 1, pageSize = 10, eventId, userId, status, startDate, endDate } = params;
      
      let url = `/${API_CONFIG.API_PREFIX}/event-attendances?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate[event]=true&populate[user]=true`;
      
      // Filtros
      if (eventId) {
        url += `&filters[event][documentId][$eq]=${eventId}`;
      }
      if (userId) {
        url += `&filters[user][documentId][$eq]=${userId}`;
      }
      if (status) {
        url += `&filters[status_attendance][$eq]=${status}`;
      }
      if (startDate) {
        url += `&filters[createdAt][$gte]=${startDate}`;
      }
      if (endDate) {
        url += `&filters[createdAt][$lte]=${endDate}`;
      }
      
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.meta?.pagination || null,
      };
    } catch (error: any) {
      console.error('Error fetching attendances:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Exportar datos de asistencias
  async exportData(params: any = {}) {
    try {
      const { eventId, userId, status, startDate, endDate } = params;
      
      // Obtener todos los datos sin paginación
      let url = `/${API_CONFIG.API_PREFIX}/event-attendances?pagination[pageSize]=1000&populate[event]=true&populate[user]=true`;
      
      if (eventId) {
        url += `&filters[event][documentId][$eq]=${eventId}`;
      }
      if (userId) {
        url += `&filters[user][documentId][$eq]=${userId}`;
      }
      if (status) {
        url += `&filters[status_attendance][$eq]=${status}`;
      }
      if (startDate) {
        url += `&filters[createdAt][$gte]=${startDate}`;
      }
      if (endDate) {
        url += `&filters[createdAt][$lte]=${endDate}`;
      }
      
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error('Error exporting attendances:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Verificar si el usuario ya está registrado en un evento
  async checkAttendance(eventId: string, userId: string) {
    try {
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/event-attendances?filters[event][documentId][$eq]=${eventId}&filters[user][documentId][$eq]=${userId}&populate=*`
      );
      
      const attendances = response.data.data || [];
      return {
        success: true,
        data: attendances.length > 0 ? attendances[0] : null,
      };
    } catch (error: any) {
      console.error('Error checking attendance:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Crear una nueva asistencia
  async createAttendance(eventId: string, userId: string, comment?: string) {
    try {
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/event-attendances`,
        {
          data: {
            event: eventId,
            user: userId,
            status_attendance: 'confirmed',
            comment: comment || '',
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('Error creating attendance:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Cancelar asistencia (eliminar el registro)
  async cancelAttendance(attendanceDocumentId: string) {
    try {
      await apiClient.delete(
        `/${API_CONFIG.API_PREFIX}/event-attendances/${attendanceDocumentId}`
      );

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error canceling attendance:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
