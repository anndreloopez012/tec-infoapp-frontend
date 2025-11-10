import axios from 'axios';
import { API_CONFIG } from '@/config/api.js';

// Cliente API público que usa el token público
const publicApiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Siempre usar el token público
publicApiClient.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${API_CONFIG.AUTH_TOKEN}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export class PublicApiService {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.pageSize) queryParams.append('pagination[pageSize]', params.pageSize);
      if (params.page) queryParams.append('pagination[page]', params.page);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.populate) queryParams.append('populate', params.populate);
      
      if (params.additionalFilters) {
        Object.entries(params.additionalFilters).forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
      }

      const response = await publicApiClient.get(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}?${queryParams.toString()}`
      );

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.meta?.pagination,
      };
    } catch (error: any) {
      console.error(`Error fetching ${this.endpoint}:`, error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  async getById(id: string | number) {
    try {
      const response = await publicApiClient.get(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}/${id}?populate=*`
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`Error fetching ${this.endpoint}/${id}:`, error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }
}

// Servicios públicos pre-instanciados
export const publicEventService = new PublicApiService('events');
export const publicContentService = new PublicApiService('content-infos');
export const publicCategoryService = new PublicApiService('content-categories');
