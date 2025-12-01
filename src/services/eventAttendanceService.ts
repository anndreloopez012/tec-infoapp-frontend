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
