// ===============================================
// SERVICIO GENÉRICO PARA CATÁLOGOS DE STRAPI
// ===============================================

import axios from 'axios';
import { API_CONFIG, buildApiUrl, getDefaultHeaders, handleApiError } from '../config/api.js';

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

// ===============================================
// CLASE GENÉRICA PARA SERVICIOS DE CATÁLOGOS
// ===============================================
class CatalogService {
  endpoint: string;
  entityName: string;
  private schemaKeys: string[] = [];

  constructor(endpoint: string, entityName: string) {
    this.endpoint = endpoint;
    this.entityName = entityName;
  }

  // Sanitiza los datos basándose en las llaves del esquema detectado
  private sanitizeData(input: any) {
    if (!input || typeof input !== 'object') return input;
    if (!this.schemaKeys || this.schemaKeys.length === 0) return input;

    const clean: any = {};
    Object.entries(input).forEach(([key, value]) => {
      if (this.schemaKeys.includes(key)) {
        // Relaciones: si viene objeto, tomar su id si existe
        if (value && typeof value === 'object') {
          const maybeId = (value as any).id || (value as any).documentId || (value as any).data?.id;
          clean[key] = maybeId ?? value;
        } else {
          clean[key] = value;
        }
      }
    });

    return clean;
  }
  // ===============================================
  // OBTENER TODOS LOS REGISTROS
  // ===============================================
  async getAll(params: any = {}) {
    try {
      console.log(`📋 Obteniendo ${this.entityName}...`, params);
      
      const queryParams = new URLSearchParams();
      
      // Paginación
      if (params.page) queryParams.append('pagination[page]', params.page);
      if (params.pageSize) queryParams.append('pagination[pageSize]', params.pageSize);
      
      // Ordenamiento
      if (params.sort) queryParams.append('sort', params.sort);
      
      // Filtros de búsqueda
      if (params.search && params.searchFields) {
        params.searchFields.forEach((field: string, index: number) => {
          queryParams.append(`filters[$or][${index}][${field}][$containsi]`, params.search);
        });
      }
      
      // Filtro por creador (mis registros vs todos)
      if (params.createdBy) {
        // Intentar con varios campos comunes: user, owner, createdBy, author
        queryParams.append('filters[$or][0][user][id][$eq]', params.createdBy);
        queryParams.append('filters[$or][1][owner][id][$eq]', params.createdBy);
        queryParams.append('filters[$or][2][createdBy][id][$eq]', params.createdBy);
        queryParams.append('filters[$or][3][author][id][$eq]', params.createdBy);
      }
      
      // Filtros adicionales personalizados
      if (params.additionalFilters) {
        Object.entries(params.additionalFilters).forEach(([key, value]) => {
          queryParams.append(key, value as string);
        });
      }
      
      // Populate relations
      queryParams.append('populate', '*');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}?${queryParams.toString()}`
      );

      console.log(`✅ ${this.entityName} obtenidos:`, response.data?.data?.length || 0);
      
      // Normalizar datos para que siempre tengamos { id, documentId, attributes, ...attributes }
      const rawData = Array.isArray(response.data) ? response.data : response.data.data || [];
      const normalized = (rawData || []).map((item: any) => {
        const attrs = item?.attributes || item || {};
        return {
          id: item?.id ?? attrs?.id,
          documentId: item?.documentId ?? attrs?.documentId ?? item?.id,
          attributes: attrs,
          // también exponemos los atributos a nivel raíz para facilitar rendering
          ...attrs,
        };
      });
      const meta = response.data.meta || {};

      // Cachear las llaves del esquema para sanitizar envíos (crear/actualizar)
      if (normalized.length > 0) {
        this.schemaKeys = Object.keys(normalized[0].attributes || normalized[0] || {});
      }
      
      return {
        success: true,
        data: normalized,
        meta: meta,
        pagination: meta.pagination || {}
      };
    } catch (error: any) {
      console.error(`❌ Error al obtener ${this.entityName}:`, error);
      
      return {
        success: false,
        data: [],
        meta: {},
        pagination: {},
        error: error?.response?.data?.error?.message || `Error al obtener ${this.entityName}`
      };
    }
  }

  // ===============================================
  // OBTENER POR ID
  // ===============================================
  async getById(id: string | number) {
    try {
      console.log(`🔍 Obteniendo ${this.entityName} por ID:`, id);
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}/${id}?populate=*`
      );
      
      console.log(`✅ ${this.entityName} obtenido`);
      
      const raw = response.data?.data ?? response.data;
      const attrs = raw?.attributes || raw || {};
      const normalized = {
        id: raw?.id ?? attrs?.id,
        documentId: raw?.documentId ?? attrs?.documentId ?? raw?.id,
        attributes: attrs,
        ...attrs,
      };
      
      return {
        success: true,
        data: normalized
      };
    } catch (error: any) {
      console.error(`❌ Error al obtener ${this.entityName}:`, error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || `Error al obtener ${this.entityName}`
      };
    }
  }

  // ===============================================
  // CREAR REGISTRO
  // ===============================================
  async create(data: any) {
    try {
      console.log(`➕ Creando ${this.entityName}:`, data);
      const payload = this.sanitizeData(data);
      console.log('📦 Payload enviado:', payload);
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}`, 
        { data: payload }
      );
      
      console.log(`✅ ${this.entityName} creado`);
      
      const raw = response.data?.data ?? response.data;
      const attrs = raw?.attributes || raw || {};
      const normalized = {
        id: raw?.id ?? attrs?.id,
        documentId: raw?.documentId ?? attrs?.documentId ?? raw?.id,
        attributes: attrs,
        ...attrs,
      };
      
      return {
        success: true,
        data: normalized,
        message: `${this.entityName} creado exitosamente`
      };
    } catch (error: any) {
      console.error(`❌ Error al crear ${this.entityName}:`, error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || `Error al crear ${this.entityName}`
      };
    }
  }

  // ===============================================
  // ACTUALIZAR REGISTRO (usa documentId)
  // ===============================================
  async update(documentId: string | number, data: any) {
    try {
      console.log(`✏️ Actualizando ${this.entityName}:`, documentId);
      const payload = this.sanitizeData(data);
      console.log('📦 Payload enviado (update):', payload);
      
      const response = await apiClient.put(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}/${documentId}`, 
        { data: payload }
      );
      
      console.log(`✅ ${this.entityName} actualizado`);
      
      const raw = response.data?.data ?? response.data;
      const attrs = raw?.attributes || raw || {};
      const normalized = {
        id: raw?.id ?? attrs?.id,
        documentId: raw?.documentId ?? attrs?.documentId ?? raw?.id,
        attributes: attrs,
        ...attrs,
      };
      
      return {
        success: true,
        data: normalized,
        message: `${this.entityName} actualizado exitosamente`
      };
    } catch (error: any) {
      console.error(`❌ Error al actualizar ${this.entityName}:`, error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || `Error al actualizar ${this.entityName}`
      };
    }
  }

  // ===============================================
  // ELIMINAR REGISTRO (usa documentId)
  // ===============================================
  async delete(documentId: string | number) {
    try {
      console.log(`🗑️ Eliminando ${this.entityName}:`, documentId);
      
      const response = await apiClient.delete(
        `/${API_CONFIG.API_PREFIX}/${this.endpoint}/${documentId}`
      );
      
      console.log(`✅ ${this.entityName} eliminado`);
      
      return {
        success: true,
        data: response.data,
        message: `${this.entityName} eliminado exitosamente`
      };
      
    } catch (error: any) {
      console.error(`❌ Error al eliminar ${this.entityName}:`, error);
      
      return {
        success: false,
        data: null,
        error: error?.response?.data?.error?.message || `Error al eliminar ${this.entityName}`
      };
    }
  }

  // ===============================================
  // OBTENER ESTRUCTURA DE LA COLECCIÓN
  // ===============================================
  async getSchema() {
    try {
      console.log(`📐 Obteniendo esquema de ${this.entityName}...`);
      
      // Obtener un registro para inferir la estructura
      const response = await this.getAll({ pageSize: 1 });
      
      if (response.success && response.data.length > 0) {
        const sampleRecord = response.data[0];
        const attributes = sampleRecord.attributes || sampleRecord;
        
        console.log(`✅ Esquema inferido de ${this.entityName}:`, Object.keys(attributes));
        
        return {
          success: true,
          schema: attributes,
          fields: Object.keys(attributes)
        };
      }
      
      return {
        success: false,
        error: 'No se pudo inferir el esquema',
        schema: {},
        fields: []
      };
      
    } catch (error: any) {
      console.error(`❌ Error al obtener esquema:`, error);
      
      return {
        success: false,
        error: error?.message || 'Error al obtener esquema',
        schema: {},
        fields: []
      };
    }
  }
}

// ===============================================
// INSTANCIAS DE SERVICIOS PARA CADA CATÁLOGO
// ===============================================
export const eventAttendanceService = new CatalogService('event-attendances', 'Asistencia de Eventos');
export const contentCategoryService = new CatalogService('content-categories', 'Categorías de Contenido');
export const companyService = new CatalogService('companies', 'Empresas');
export const eventLocationService = new CatalogService('event-locations', 'Lugares de Eventos');
export const contentTagService = new CatalogService('content-tags', 'Tags de Contenido');
export const eventTypeService = new CatalogService('event-types', 'Tipos de Evento');

export default CatalogService;
