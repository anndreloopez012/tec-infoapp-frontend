import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { PermissionService } from '../services/permissionService.js';

// Initial state
const initialState = {
  permissions: [],
  navigationMenus: [],
  isLoading: false,
  error: null,
  userPermissions: {}
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_NAVIGATION: 'SET_NAVIGATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_PERMISSIONS: 'CLEAR_PERMISSIONS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const permissionsReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case ActionTypes.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions,
        userPermissions: action.payload.userPermissions,
        isLoading: false,
        error: null
      };
    
    case ActionTypes.SET_NAVIGATION:
      return {
        ...state,
        navigationMenus: action.payload
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case ActionTypes.CLEAR_PERMISSIONS:
      return {
        ...initialState
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
const PermissionsContext = createContext();

// Custom hook to use permissions context
export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

// PermissionsProvider component
export const PermissionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(permissionsReducer, initialState);

  // Load user permissions based on role
  const loadUserPermissions = useCallback(async (roleId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      console.log('🔐 Cargando permisos para rol:', roleId);
      
      const result = await PermissionService.getRolePermissions(roleId);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar permisos del usuario');
      }
      
      const permissions = result.permissions || [];
      console.log('✅ Permisos del usuario cargados:', permissions.length);
      
      // Crear objeto de permisos para acceso rápido
      const userPermissions = {};
      permissions.forEach(permission => {
        if (permission.enabled) {
          const key = `${permission.controller}.${permission.action}`;
          userPermissions[key] = true;
          
          // También agregar las variantes comunes
          userPermissions[permission.action] = true;
          userPermissions[permission.controller] = true;
        }
      });
      
      // Generar menús de navegación basados en los permisos
      // Usar directamente result.role.permissions que tiene la estructura correcta de Strapi
      const permissionsObj = result.role?.permissions || {};
      console.log('🔍 Estructura de permisos recibida:', permissionsObj);
      
      const navigationMenus = generateNavigationMenus(permissionsObj);
      
      dispatch({
        type: ActionTypes.SET_PERMISSIONS,
        payload: {
          permissions,
          userPermissions
        }
      });
      
      dispatch({
        type: ActionTypes.SET_NAVIGATION,
        payload: navigationMenus
      });
      
      console.log('📋 Menús de navegación generados:', navigationMenus.length);
      console.log('📋 Menús:', navigationMenus);
      
      return {
        success: true,
        permissions,
        userPermissions,
        navigationMenus
      };
      
    } catch (error) {
      console.error('❌ Error al cargar permisos del usuario:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [dispatch]);

  // Generate navigation menus based on permissions
  const generateNavigationMenus = useCallback((permissionsObj) => {
    console.log('🔍 Generando menús desde permisos:', permissionsObj);
    const menus = [];
    
    // API endpoints que queremos mostrar como menús principales
    // Excluimos endpoints internos que no deben aparecer en el menú de usuarios
    const apiEndpoints = Object.keys(permissionsObj).filter(key => {
      const isApiEndpoint = key.startsWith('api::');
      const isExcluded = [
        'api::global',
        'api::type-user',
        'api::audit-log',
        'api::global-notification',
        'api::push-token',
        'api::user-notification'
      ].includes(key);
      
      console.log(`🔍 Endpoint ${key}: isApi=${isApiEndpoint}, isExcluded=${isExcluded}`);
      return isApiEndpoint && !isExcluded;
    });
    
    console.log('🔍 Endpoints de API encontrados:', apiEndpoints);
    
    apiEndpoints.forEach(endpoint => {
      const endpointData = permissionsObj[endpoint];
      console.log(`🔍 Procesando endpoint ${endpoint}:`, endpointData);
      
      const controllers = endpointData?.controllers || {};
      const controllerNames = Object.keys(controllers);
      
      console.log(`🔍 Controladores en ${endpoint}:`, controllerNames);
      
      if (controllerNames.length > 0) {
        const mainController = controllerNames[0];
        const actions = controllers[mainController];
        
        console.log(`🔍 Acciones en ${mainController}:`, actions);
        
        // Solo agregar al menú si tiene permisos habilitados
        const hasEnabledPermissions = Object.values(actions).some(action => action?.enabled);
        
        console.log(`🔍 ${endpoint} tiene permisos habilitados:`, hasEnabledPermissions);
        
        if (hasEnabledPermissions) {
          const menu = {
            id: endpoint,
            title: getDisplayName(endpoint),
            controller: mainController,
            endpoint: endpoint,
            permissions: {
              canView: actions.find?.enabled || actions.findOne?.enabled || false,
              canCreate: actions.create?.enabled || false,
              canEdit: actions.update?.enabled || false,
              canDelete: actions.delete?.enabled || false
            },
            route: generateRoute(endpoint)
          };
          
          console.log('✅ Menú agregado:', menu);
          menus.push(menu);
        }
      }
    });
    
    // Ordenar menús alfabéticamente
    menus.sort((a, b) => a.title.localeCompare(b.title));
    
    console.log('✅ Total de menús generados:', menus.length);
    
    return menus;
  }, []);

  // Generate route based on endpoint
  const generateRoute = (endpoint) => {
    const cleanName = endpoint.replace('api::', '').replace(/-/g, '');
    return `/${cleanName}`;
  };

  // Get display name for endpoint
  const getDisplayName = (endpoint) => {
    const displayNames = {
      'api::company': 'Empresas',
      'api::customer': 'Clientes', 
      'api::digital-form': 'Formularios Digitales',
      'api::global': 'Configuración Global',
      'api::project': 'Proyectos',
      'api::project-stage': 'Etapas de Proyecto',
      'api::sale': 'Ventas',
      'api::sale-stage': 'Etapas de Venta',
      'api::solution': 'Soluciones',
      'api::ticket-status': 'Estados de Tickets',
      'api::type-user': 'Tipos de Usuario'
    };
    
    return displayNames[endpoint] || endpoint.replace('api::', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    // Verificar diferentes formatos de permisos
    if (state.userPermissions[permission]) return true;
    
    // Verificar si es super admin
    if (state.userPermissions['plugin::users-permissions.role.find']) {
      return true; // Super admin tiene todos los permisos
    }
    
    return false;
  }, [state.userPermissions]);

  // Check if user can access a specific menu/module
  const canAccessModule = useCallback((moduleName) => {
    const menu = state.navigationMenus.find(m => 
      m.id === moduleName || 
      m.controller === moduleName ||
      m.route.includes(moduleName)
    );
    
    return menu ? menu.permissions.canView : false;
  }, [state.navigationMenus]);

  // Clear all permissions
  const clearPermissions = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_PERMISSIONS });
  }, [dispatch]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, [dispatch]);

  const value = {
    // State
    ...state,
    
    // Actions
    loadUserPermissions,
    clearPermissions,
    clearError,
    
    // Helpers
    hasPermission,
    canAccessModule,
    generateNavigationMenus,
    getDisplayName
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export default PermissionsContext;