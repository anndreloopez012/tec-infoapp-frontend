// ===============================================
// CONFIGURACIÓN GLOBAL DE API PARA STRAPI
// ===============================================

export const API_CONFIG = {
  // URL base del backend Strapi
  BASE_URL: "https://tec-adm.server-softplus.plus",

  // Prefijo para todas las APIs
  API_PREFIX: "api",

  // Token de autorización permanente
  AUTH_TOKEN:
    "096f95f59a95f625a41b60475d97ce2e25a9d99cc2416c4c267e287420a6d858ee62a6af966d8e558c200800e5325cbe483428b94d5084877908384c463e8da99ccef3e36f9a5ba859235b15fef80144b3d6ea611de3abf1939eebfcebc6de2231895b7b1f1877c6c7147187dd1a01b8f5530fced8f3dbdf8fa21d645d8b71c3",

  // Configuración de timeouts
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Intervalo de auto-refresh para actualizaciones en tiempo real
  REFRESH_INTERVAL: 5000,

  // Configuraciones de funcionalidades
  FEATURES: {
    // Habilitar/deshabilitar edición de perfil (nombre y correo)
    editPerfil: false,
  },

  // Claves para localStorage
  STORAGE_KEYS: {
    AUTH_TOKEN: "crm_auth_token",
    USER_DATA: "crm_user_data",
    GLOBAL_CONFIG: "crm_global_config",
    REFRESH_TOKEN: "crm_refresh_token",
    LAST_SYNC: "crm_last_sync",
  },
};

// ===============================================
// ENDPOINTS DE LA API
// ===============================================
export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: "auth/local",
    REGISTER: "auth/local/register",
    FORGOT_PASSWORD: "auth/forgot-password",
    RESET_PASSWORD: "auth/reset-password",
    CHANGE_PASSWORD: "auth/change-password",
    ME: "users/me",
  },

  // Usuarios
  USERS: {
    BASE: "users",
    COUNT: "users/count",
    ME: "users/me",
    BULK_DELETE: "users/bulk-delete",
  },

  // Roles y permisos
  ROLES: "users-permissions/roles",
  PERMISSIONS: "users-permissions/permissions",

  // Tipos de usuario
  TYPE_USERS: "type-users",

  // Configuración global
  GLOBAL: "global?populate=*",

  // Uploads
  UPLOAD: "upload",
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Construir URL completa de API
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/${cleanEndpoint}`;
};

// Obtener headers por defecto
export const getDefaultHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
};

// Obtener headers para upload de archivos
export const getUploadHeaders = () => {
  const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
};

// Construir URL de imagen completa
export const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
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
  console.error("API Error:", error);

  if (error.response) {
    // Error de respuesta del servidor
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        // Token expirado o inválido
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
        window.location.href = "/login";
        throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");

      case 403:
        throw new Error("No tienes permisos para realizar esta acción.");

      case 404:
        throw new Error("Recurso no encontrado.");

      case 429:
        throw new Error("Demasiadas solicitudes. Por favor, intenta más tarde.");

      case 500:
        throw new Error("Error interno del servidor. Contacta al administrador.");

      default:
        throw new Error(data?.message || `Error del servidor (${status})`);
    }
  } else if (error.request) {
    // Error de red
    throw new Error("Error de conexión. Verifica tu internet e intenta nuevamente.");
  } else {
    // Otro tipo de error
    throw new Error(error.message || "Error desconocido");
  }
};

// Configuración de retry para requests
export const retryConfig = {
  retries: API_CONFIG.RETRY_ATTEMPTS,
  retryDelay: API_CONFIG.RETRY_DELAY,
  retryCondition: (error) => {
    // Retry en errores de red o 5xx
    return !error.response || error.response.status >= 500;
  },
};

// Status de conectividad
export const getConnectionStatus = () => {
  return {
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
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
  getConnectionStatus,
};
