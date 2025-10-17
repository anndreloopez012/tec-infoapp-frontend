// ===============================================
// CONFIGURACIÓN GLOBAL DE API PARA STRAPI
// ===============================================

export const API_CONFIG = {
  // URL base del backend Strapi
  BASE_URL: 'https://crm-gc-adm.server-softplus.plus',
  
  // Prefijo para todas las APIs
  API_PREFIX: 'api',
  
  // Token de autorización permanente
  AUTH_TOKEN: '830e38f569a05a838b9473618c91ec9473c5d633ffe353b8a2ee194891b213c50c60fb7dd223a9a717cc0d14e8b814baf5e5189bc40ad6719519a86b288363c2947d3ede83eecc45a13f7598246d8f1f7be9ec4427cd420caf350781f9dd5331528c03861d4ef52a94132aa72d48b13469b0622720332c7317f9150085c42da9',
  
  // Configuración de timeouts
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Intervalo de auto-refresh para actualizaciones en tiempo real
  REFRESH_INTERVAL: 5000,
  
  // Configuraciones de funcionalidades
  FEATURES: {
    // Habilitar/deshabilitar edición de perfil (nombre y correo)
    editPerfil: false
  },
  
  // Claves para localStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: 'crm_auth_token',
    USER_DATA: 'crm_user_data',
    GLOBAL_CONFIG: 'crm_global_config',
    REFRESH_TOKEN: 'crm_refresh_token',
    LAST_SYNC: 'crm_last_sync'
  }
};

// ===============================================
// ENDPOINTS DE LA API
// ===============================================
export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: 'auth/local',
    REGISTER: 'auth/local/register',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    CHANGE_PASSWORD: 'auth/change-password',
    ME: 'users/me'
  },
  
  // Usuarios
  USERS: {
    BASE: 'users',
    COUNT: 'users/count',
    ME: 'users/me',
    BULK_DELETE: 'users/bulk-delete'
  },
  
  // Roles y permisos
  ROLES: 'users-permissions/roles',
  PERMISSIONS: 'users-permissions/permissions',
  
  // Tipos de usuario
  TYPE_USERS: 'type-users',
  
  // Configuración global
  GLOBAL: 'global?populate=*',
  
  // Uploads
  UPLOAD: 'upload'
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Construir URL completa de API
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/${cleanEndpoint}`;
};

// Obtener headers por defecto
export const getDefaultHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
};

// Obtener headers para upload de archivos
export const getUploadHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };
};

// Construir URL de imagen completa
export const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_CONFIG.BASE_URL}${imagePath}`;
};

// Validar respuesta de API
export const validateApiResponse = (response) => {
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
  }
  return response;
};

// Manejar errores de API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Error de respuesta del servidor
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        // Token expirado o inválido
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        
      case 403:
        throw new Error('No tienes permisos para realizar esta acción.');
        
      case 404:
        throw new Error('Recurso no encontrado.');
        
      case 429:
        throw new Error('Demasiadas solicitudes. Por favor, intenta más tarde.');
        
      case 500:
        throw new Error('Error interno del servidor. Contacta al administrador.');
        
      default:
        throw new Error(data?.message || `Error del servidor (${status})`);
    }
  } else if (error.request) {
    // Error de red
    throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
  } else {
    // Otro tipo de error
    throw new Error(error.message || 'Error desconocido');
  }
};

// Configuración de retry para requests
export const retryConfig = {
  retries: API_CONFIG.RETRY_ATTEMPTS,
  retryDelay: API_CONFIG.RETRY_DELAY,
  retryCondition: (error) => {
    // Retry en errores de red o 5xx
    return !error.response || (error.response.status >= 500);
  }
};

// Status de conectividad
export const getConnectionStatus = () => {
  return {
    online: navigator.onLine,
    timestamp: new Date().toISOString()
  };
};

export default {
  API_CONFIG,
  ENDPOINTS,
  buildApiUrl,
  getDefaultHeaders,
  getUploadHeaders,
  buildImageUrl,
  validateApiResponse,
  handleApiError,
  retryConfig,
  getConnectionStatus
};