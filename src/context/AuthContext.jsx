import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/authService.js';
import { toast } from '@/hooks/use-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const isAuthenticated = AuthService.isAuthenticated();
      
      if (isAuthenticated) {
        const token = AuthService.getStoredToken();
        const storedUser = AuthService.getStoredUser();
        
        if (storedUser && token) {
          // Try to refresh user data from server
          try {
            const result = await AuthService.getCurrentUser();
            const currentUser = result.user;
            dispatch({
              type: ActionTypes.SET_USER,
              payload: { user: currentUser, token }
            });
          } catch (error) {
            // If refresh fails, use stored data
            dispatch({
              type: ActionTypes.SET_USER,
              payload: { user: storedUser, token }
            });
          }
        } else {
          // Invalid stored data, logout
          AuthService.logout();
          dispatch({ type: ActionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Login function
  const login = async (identifier, password) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const result = await AuthService.login({ identifier, password });
      
      if (!result.success) {
        throw new Error(result.error || 'Error de login');
      }
      
      let { user, token } = result;
      
      console.log('👤 Login successful, obteniendo datos completos del usuario...');
      
      // Después del login exitoso, obtener datos completos del usuario
      try {
        const userResult = await AuthService.getCurrentUser();
        if (userResult.success && userResult.user) {
          user = userResult.user;
          console.log('✅ Datos completos del usuario obtenidos:', { 
            role: user.role?.name, 
            type: user.type_user?.Tipo 
          });
        }
      } catch (userError) {
        console.warn('⚠️ No se pudieron obtener datos completos del usuario:', userError);
        // Continuar con los datos del login inicial
      }
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, token }
      });
      
      toast({
        title: "Login exitoso",
        description: `Bienvenido ${user.username || user.email}`,
      });
      
      return { success: true, user, token };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error de login",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const result = await AuthService.register({ username, email, password });
      
      if (!result.success) {
        throw new Error(result.error || 'Error de registro');
      }
      
      const { user, token } = result;
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, token }
      });
      
      toast({
        title: "Registro exitoso",
        description: `Bienvenido ${user.username || user.email}`,
      });
      
      return { success: true, user, token };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const result = await AuthService.forgotPassword(email);
      
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      
      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña",
      });
      
      return { success: true, result };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Reset password function
  const resetPassword = async (code, password, passwordConfirmation) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const { user, token } = await AuthService.resetPassword(code, password, passwordConfirmation);
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, token }
      });
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });
      
      return { success: true, user, token };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword, passwordConfirmation) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const { user, token } = await AuthService.changePassword(currentPassword, newPassword, passwordConfirmation);
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user, token }
      });
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente",
      });
      
      return { success: true, user, token };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const updatedUser = await AuthService.getCurrentUser();
      
      dispatch({
        type: ActionTypes.SET_USER,
        payload: { user: updatedUser, token: state.token }
      });
      
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente",
      });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    dispatch({ type: ActionTypes.LOGOUT });
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Check permissions
  const hasPermission = (permission) => {
    if (!state.user || !state.user.role) return false;
    
    // Super admin has all permissions - check both 'super' and 'super_admin'
    const roleType = state.user.role.type;
    const roleName = state.user.role.name;
    if (roleType === 'super' || roleType === 'super_admin' || roleName === 'super' || roleName === 'super_admin') {
      console.log('✅ Super user - all permissions granted');
      return true;
    }
    
    // Check specific permission in different possible structures
    const permissions = state.user.role.permissions;
    if (Array.isArray(permissions)) {
      return permissions.some(p => 
        p.action === permission || 
        p.controller === permission ||
        `${p.controller}.${p.action}` === permission ||
        p.name === permission
      );
    }
    
    // If permissions is an object
    if (permissions && typeof permissions === 'object') {
      return permissions[permission] === true;
    }
    
    return false;
  };

  // Check if user has any of the specified roles
  const hasRole = (roles) => {
    if (!state.user) {
      console.log('🔍 hasRole: No user found');
      return false;
    }
    
    console.log('🔍 Checking roles:', { 
      user: state.user, 
      userRole: state.user.role, 
      requestedRoles: roles 
    });
    
    // Check role.type from the new API structure
    const roleType = state.user.role?.type;
    const roleName = state.user.role?.name;
    const typeUser = state.user.type_user?.Tipo;
    
    // For super users, allow access regardless
    if (roleType === 'super' || roleType === 'super_admin' || roleName === 'super' || roleName === 'super_admin' || typeUser === 'administrador') {
      console.log('✅ Super user access granted', { roleType, roleName, typeUser });
      return true;
    }
    
    // Check against role.type or role.name for admin
    const hasAccess = Array.isArray(roles) 
      ? roles.some(r => r === roleType || r === roleName)
      : (roles === roleType || roles === roleName);
    
    console.log('🔍 Role check result:', { 
      roleType, 
      roleName,
      typeUser, 
      requestedRoles: roles, 
      hasAccess 
    });
    
    return hasAccess;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    logout,
    clearError,
    
    // Helpers
    hasPermission,
    hasRole,
    
    // Utilities
    refreshUser: initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;