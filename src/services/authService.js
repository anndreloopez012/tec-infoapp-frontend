// ===============================================
// SERVICIO DE AUTENTICACIÓN
// ===============================================

import axios from 'axios';
import { API_CONFIG, ENDPOINTS, buildApiUrl, getDefaultHeaders, handleApiError } from '../config/api.js';
import { createSystemNotification } from '../hooks/useSystemNotifications.js';

// Configurar axios con interceptors
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para requests
apiClient.interceptors.request.use(
  (config) => {
    // Añadir token correcto según el tipo de endpoint
    const authEndpoints = [
      `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.LOGIN}`,
      `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.REGISTER}`,
      `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
      `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.RESET_PASSWORD}`
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) => (config.url || '').includes(endpoint));

    // Asegurar headers y flags base
    config.headers = config.headers || {};
    config.withCredentials = false;

    console.log('🌐 Request:', {
      url: config.url,
      isAuthEndpoint,
      method: config.method,
      data: config.data
    });

    if (isAuthEndpoint) {
      // Para login/registro, el backend requiere el token global (como en Postman)
      config.headers.Authorization = `Bearer ${API_CONFIG.AUTH_TOKEN}`;
      config.headers['Content-Type'] = 'application/json';
      config.headers.Accept = 'application/json';
      console.log('🔐 Usando AUTH_TOKEN global para endpoint de autenticación');
    } else {
      // Para el resto, usar el JWT del usuario si existe; si no, usar el token global como respaldo
      const storedToken = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const tokenToUse = storedToken || API_CONFIG.AUTH_TOKEN;
      if (tokenToUse) {
        config.headers.Authorization = `Bearer ${tokenToUse}`;
        console.log(storedToken ? '🔑 Token de usuario añadido a la petición' : '🗝️ Usando AUTH_TOKEN global como respaldo');
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para responses
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response exitoso:', { 
      status: response.status, 
      url: response.config.url 
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isLoginEndpoint = url.includes(`/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.LOGIN}`);

    console.error('❌ Response error:', { 
      status,
      statusText: error.response?.statusText,
      url,
      data: error.response?.data
    });

    if (isLoginEndpoint) {
      const strapiMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message?.[0]?.messages?.[0]?.message ||
        error.response?.data?.message;

      const normalizedMessage =
        status === 400 || status === 401
          ? 'Usuario o contraseña incorrectos. Verifica tus credenciales.'
          : strapiMessage || 'No se pudo iniciar sesión. Intenta nuevamente.';

      const normalizedError = new Error(normalizedMessage);
      normalizedError.response = error.response;
      normalizedError.request = error.request;
      normalizedError.status = status;

      return Promise.reject(normalizedError);
    }

    return Promise.reject(handleApiError(error));
  }
);

class AuthService {
  
  // ===============================================
  // LOGIN
  // ===============================================
  async login(credentials) {
    try {
      console.log('🔐 Iniciando login...', { email: credentials.identifier });
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.LOGIN}`,
        {
          identifier: credentials.identifier,
          password: credentials.password
        }
      );

      const { jwt, user } = response.data;
      
      if (!jwt || !user) {
        throw new Error('Respuesta de login inválida');
      }

      // Guardar datos en localStorage
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, jwt);
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log('✅ Login exitoso:', { user: user.username || user.email });
      
      // Crear notificación de login exitoso
      createSystemNotification(
        'success',
        `Bienvenido, ${user.name || user.username || user.email}`,
        'Has iniciado sesión exitosamente',
        {
          category: 'system',
          source: 'auth_login',
          metadata: {
            userId: user.id,
            userRole: user.role?.name || user.role?.type
          }
        }
      );
      
      return {
        success: true,
        user,
        token: jwt,
        message: 'Login exitoso'
      };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      const errorMessage =
        error.response?.data?.message?.[0]?.messages?.[0]?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Error de autenticación';

      // Registrar intento de login fallido
      const currentFailedAttempts = parseInt(localStorage.getItem('failed_login_attempts') || '0');
      localStorage.setItem('failed_login_attempts', (currentFailedAttempts + 1).toString());

      // Crear notificación de error de login
      createSystemNotification(
        'warning',
        'Error de autenticación',
        `Intento de login fallido: ${errorMessage}`,
        {
          category: 'security',
          source: 'auth_login_failed',
          metadata: {
            identifier: credentials.identifier,
            error: errorMessage,
            attemptCount: currentFailedAttempts + 1
          }
        }
      );
        
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  }

  // ===============================================
  // REGISTRO
  // ===============================================
  async register(userData) {
    try {
      console.log('📝 Registrando usuario...', { email: userData.email });
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.REGISTER}`,
        {
          username: userData.username,
          email: userData.email,
          password: userData.password
        }
      );

      const { jwt, user } = response.data;
      
      if (jwt && user) {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, jwt);
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }

      console.log('✅ Registro exitoso');
      
      // Crear notificación de registro exitoso
      createSystemNotification(
        'success',
        'Usuario registrado',
        `Nuevo usuario registrado: ${user.username || user.email}`,
        {
          category: 'system',
          source: 'auth_register',
          metadata: {
            userId: user.id,
            username: user.username,
            email: user.email
          }
        }
      );
      
      return {
        success: true,
        user,
        token: jwt,
        message: 'Usuario registrado exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      const errorMessage = error.response?.data?.message?.[0]?.messages?.[0]?.message 
        || error.response?.data?.error?.message
        || 'Error en el registro';
        
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===============================================
  // OLVIDÉ MI CONTRASEÑA
  // ===============================================
  async forgotPassword(email) {
    try {
      console.log('📧 Enviando email de recuperación...', { email });
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
        { email }
      );

      console.log('✅ Email de recuperación enviado');
      
      return {
        success: true,
        message: 'Se ha enviado un email con las instrucciones para restablecer tu contraseña'
      };
      
    } catch (error) {
      console.error('❌ Error al enviar email de recuperación:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al enviar email de recuperación'
      };
    }
  }

  // ===============================================
  // RESTABLECER CONTRASEÑA
  // ===============================================
  async resetPassword(code, password, passwordConfirmation) {
    try {
      console.log('🔐 Restableciendo contraseña...');
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.RESET_PASSWORD}`,
        {
          code,
          password,
          passwordConfirmation
        }
      );

      const { jwt, user } = response.data;
      
      if (jwt && user) {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, jwt);
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }

      console.log('✅ Contraseña restablecida exitosamente');
      
      return {
        success: true,
        user,
        token: jwt,
        message: 'Contraseña restablecida exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al restablecer contraseña:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al restablecer contraseña'
      };
    }
  }

  // ===============================================
  // CAMBIAR CONTRASEÑA
  // ===============================================
  async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
    try {
      console.log('🔐 Cambiando contraseña...');
      
      const response = await apiClient.post(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.AUTH.CHANGE_PASSWORD}`,
        {
          currentPassword,
          password: newPassword,
          passwordConfirmation: newPasswordConfirmation
        }
      );

      const { jwt, user } = response.data;
      
      if (jwt && user) {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, jwt);
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }

      console.log('✅ Contraseña cambiada exitosamente');
      
      // Crear notificación de cambio de contraseña
      createSystemNotification(
        'success',
        'Contraseña actualizada',
        'Tu contraseña ha sido cambiada exitosamente',
        {
          category: 'security',
          source: 'auth_password_change',
          metadata: {
            userId: user.id
          }
        }
      );
      
      return {
        success: true,
        user,
        token: jwt,
        message: 'Contraseña cambiada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al cambiar contraseña'
      };
    }
  }

  // ===============================================
  // OBTENER USUARIO ACTUAL
  // ===============================================
  async getCurrentUser() {
    try {
      console.log('👤 Obteniendo usuario actual...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/users/me?populate=*`
      );

      const user = response.data;
      
      // Actualizar datos en localStorage
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log('✅ Usuario obtenido:', { user: user.username || user.email, role: user.role });
      
      return {
        success: true,
        user
      };
      
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      
      // Si el token es inválido, limpiar localStorage
      if (error.response?.status === 401) {
        createSystemNotification(
          'warning',
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          {
            category: 'security',
            source: 'auth_session_expired'
          }
        );
        this.logout();
      }
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener datos del usuario'
      };
    }
  }

  // ===============================================
  // LOGOUT
  // ===============================================
  logout() {
    console.log('🚪 Cerrando sesión...');
    
    const user = this.getStoredUser();
    
    // Crear notificación de logout
    if (user) {
      createSystemNotification(
        'info',
        'Sesión cerrada',
        `${user.name || user.username || user.email} ha cerrado sesión`,
        {
          category: 'system',
          source: 'auth_logout',
          metadata: {
            userId: user.id
          }
        }
      );
    }
    
    // Limpiar localStorage
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.GLOBAL_CONFIG);
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.LAST_SYNC);
    
    console.log('✅ Sesión cerrada');
    
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };
  }

  // ===============================================
  // VERIFICAR SI ESTÁ AUTENTICADO
  // ===============================================
  isAuthenticated() {
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const userData = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
    
    return !!(token && userData);
  }

  // ===============================================
  // OBTENER TOKEN
  // ===============================================
  getStoredToken() {
    return localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  }

  // ===============================================
  // OBTENER USUARIO DESDE LOCALSTORAGE
  // ===============================================
  getStoredUser() {
    const userData = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  // ===============================================
  // VERIFICAR PERMISOS
  // ===============================================
  hasPermission(permission) {
    const user = this.getStoredUser();
    if (!user || !user.role || !user.role.permissions) return false;
    
    return user.role.permissions.some(p => 
      p.action === permission || 
      p.controller === permission ||
      `${p.controller}.${p.action}` === permission
    );
  }

  // ===============================================
  // VERIFICAR ROL
  // ===============================================
  hasRole(roleName) {
    const user = this.getStoredUser();
    if (!user || !user.role) return false;
    
    return user.role.name === roleName || user.role.type === roleName;
  }
}

// Crear instancia singleton
const authService = new AuthService();

export { authService as AuthService };
export default authService;
