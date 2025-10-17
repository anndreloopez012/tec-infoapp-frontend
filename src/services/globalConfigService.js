import axios from 'axios';
import { API_CONFIG, buildApiUrl, getDefaultHeaders, handleApiError } from '../config/api.js';

/**
 * Servicio para manejar la configuración global de la aplicación
 */
export class GlobalConfigService {
  
  /**
   * Obtener la configuración global completa
   */
  static async getGlobalConfig() {
    try {
      const response = await axios.get(
        buildApiUrl('global?populate=*'),
        {
          headers: getDefaultHeaders(),
          timeout: API_CONFIG.TIMEOUT
        }
      );

      console.log('✅ Configuración global obtenida:', response.data);
      
      return {
        success: true,
        data: response.data?.data || null
      };

    } catch (error) {
      console.error('❌ Error al obtener configuración global:', error);
      handleApiError(error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Error al obtener configuración global'
      };
    }
  }

  /**
   * Actualizar la configuración global
   */
  static async updateGlobalConfig(data) {
    try {
      console.log('📤 Enviando datos a actualizar:', data);
      
      const response = await axios.put(
        buildApiUrl('global'),
        { data }, // Strapi espera el payload bajo { data }
        {
          headers: getDefaultHeaders(),
          timeout: API_CONFIG.TIMEOUT
        }
      );

      console.log('✅ Configuración global actualizada:', response.data);
      
      return {
        success: true,
        data: response.data?.data || null
      };

    } catch (error) {
      console.error('❌ Error al actualizar configuración global:', error);
      handleApiError(error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Error al actualizar configuración global'
      };
    }
  }

  /**
   * Subir archivo de imagen para logos o favicon
   */
  static async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await axios.post(
        buildApiUrl('upload'),
        formData,
        {
          headers: {
            ...getDefaultHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 segundos para uploads
        }
      );

      console.log('✅ Imagen subida exitosamente:', response.data);
      
      return {
        success: true,
        data: response.data?.[0] || null
      };

    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      handleApiError(error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Error al subir imagen'
      };
    }
  }

  /**
   * Construir URL completa para imágenes
   */
  static buildImageUrl(imagePath) {
    if (!imagePath) return null;
    
    // Si ya es una URL completa, retornarla tal como está
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Si es una ruta relativa, construir URL completa
    return `${API_CONFIG.BASE_URL}${imagePath}`;
  }

  /**
   * Validar formato de color hexadecimal
   */
  static isValidHexColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Validar email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export default GlobalConfigService;