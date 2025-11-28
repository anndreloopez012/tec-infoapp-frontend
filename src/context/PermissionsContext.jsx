import React, { createContext, useContext, useReducer, useCallback } from "react";
import { PermissionService } from "../services/permissionService.js";

// Initial state
const initialState = {
  permissions: [],
  navigationMenus: [],
  isLoading: false,
  error: null,
  userPermissions: {},
};

// Action types
const ActionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_PERMISSIONS: "SET_PERMISSIONS",
  SET_NAVIGATION: "SET_NAVIGATION",
  SET_ERROR: "SET_ERROR",
  CLEAR_PERMISSIONS: "CLEAR_PERMISSIONS",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Reducer
const permissionsReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions,
        userPermissions: action.payload.userPermissions,
        isLoading: false,
        error: null,
      };

    case ActionTypes.SET_NAVIGATION:
      return {
        ...state,
        navigationMenus: action.payload,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case ActionTypes.CLEAR_PERMISSIONS:
      return {
        ...initialState,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
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
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

// PermissionsProvider component
export const PermissionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(permissionsReducer, initialState);

  // Load user permissions based on role
  const loadUserPermissions = useCallback(
    async (roleId) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR });

        console.log("🔐 Cargando permisos para rol:", roleId);

        const result = await PermissionService.getRolePermissions(roleId);

        if (!result.success) {
          throw new Error(result.error || "Error al cargar permisos del usuario");
        }

        const permissions = result.permissions || [];
        console.log("✅ Permisos del usuario cargados:", permissions.length);

        // Crear objeto de permisos para acceso rápido
        const userPermissions = {};
        permissions.forEach((permission) => {
          if (permission.enabled) {
            const key = `${permission.controller}.${permission.action}`;
            userPermissions[key] = true;

            // También agregar las variantes comunes
            userPermissions[permission.action] = true;
            userPermissions[permission.controller] = true;
          }
        });

        // Generar menús de navegación basados en los permisos
        const navigationMenus = generateNavigationMenus(result.role?.permissions || {});

        dispatch({
          type: ActionTypes.SET_PERMISSIONS,
          payload: {
            permissions,
            userPermissions,
          },
        });

        dispatch({
          type: ActionTypes.SET_NAVIGATION,
          payload: navigationMenus,
        });

        console.log("📋 Menús de navegación generados:", navigationMenus.length);

        return {
          success: true,
          permissions,
          userPermissions,
          navigationMenus,
        };
      } catch (error) {
        console.error("❌ Error al cargar permisos del usuario:", error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });

        return {
          success: false,
          error: error.message,
        };
      }
    },
    [dispatch],
  );

  // Generate navigation menus based on permissions
  const generateNavigationMenus = useCallback((permissionsObj) => {
    const menus = [];

    // API endpoints que queremos mostrar como menús principales
    // Excluimos endpoints internos que no deben aparecer en el menú de usuarios
    const apiEndpoints = Object.keys(permissionsObj).filter(
      (key) =>
        key.startsWith("api::") &&
        key !== "api::global" &&
        key !== "api::type-user" &&
        key !== "api::audit-log" &&
        key !== "api::global-notification" &&
        key !== "api::push-token" &&
        key !== "api::user-notification" &&
        key !== "api::comment" &&
        key !== "api::home-page" &&
        key !== "api::system",
    );

    apiEndpoints.forEach((endpoint) => {
      const controllers = permissionsObj[endpoint]?.controllers || {};
      const controllerNames = Object.keys(controllers);

      if (controllerNames.length > 0) {
        const mainController = controllerNames[0];
        const actions = controllers[mainController];

        // Solo agregar al menú si tiene permisos habilitados
        const hasEnabledPermissions = Object.values(actions).some((action) => action.enabled);

        if (hasEnabledPermissions) {
          menus.push({
            id: endpoint,
            title: getDisplayName(endpoint),
            controller: mainController,
            endpoint: endpoint,
            permissions: {
              canView: actions.find?.enabled || actions.findOne?.enabled || false,
              canCreate: actions.create?.enabled || false,
              canEdit: actions.update?.enabled || false,
              canDelete: actions.delete?.enabled || false,
            },
            route: generateRoute(endpoint),
          });
        }
      }
    });

    // Ordenar menús alfabéticamente
    menus.sort((a, b) => a.title.localeCompare(b.title));

    return menus;
  }, []);

  // Generate route based on endpoint
  const generateRoute = (endpoint) => {
    // Mapeo específico para módulos de catálogos
    const catalogRoutes = {
      "api::event-attendance": "/catalog/event-attendance",
      "api::content-category": "/catalog/content-category",
      "api::company": "/catalog/company",
      "api::event-location": "/catalog/event-location",
      "api::content-tag": "/catalog/content-tag",
      "api::event-type": "/catalog/event-type",
    };

    // Mapeo específico para módulos de tickets
    const ticketRoutes = {
      "api::ticket": "/ticket",
      "api::ticket-status": "/ticket-status",
      "api::ticket-priority": "/ticket-priority",
      "api::ticket-type": "/ticket-type",
    };

    // Si es un catálogo, usar la ruta específica
    if (catalogRoutes[endpoint]) {
      return catalogRoutes[endpoint];
    }

    // Si es un módulo de tickets, usar la ruta específica
    if (ticketRoutes[endpoint]) {
      return ticketRoutes[endpoint];
    }

    // Para otros módulos, usar la conversión estándar
    const cleanName = endpoint.replace("api::", "").replace(/-/g, "");
    return `/${cleanName}`;
  };

  // Get display name for endpoint
  const getDisplayName = (endpoint) => {
    const displayNames = {
      "api::company": "Empresas",
      "api::customer": "Clientes",
      "api::digital-form": "Formularios Digitales",
      "api::global": "Configuración Global",
      "api::project": "Proyectos",
      "api::project-stage": "Etapas de Proyecto",
      "api::sale": "Ventas",
      "api::sale-stage": "Etapas de Venta",
      "api::solution": "Soluciones",
      "api::ticket": "Tickets",
      "api::ticket-status": "Estados de Ticket",
      "api::ticket-priority": "Prioridades de Ticket",
      "api::ticket-type": "Tipos de Ticket",
      "api::type-user": "Tipos de Usuario",
      "api::gallery": "Galería",
      "api::event": "Eventos",
      "api::content-category": "Categorias de Contenido",
      "api::content-tag": "Tags de Contenido",
      "api::event-attendance": "Asistencia de Eventos",
      "api::event-location": "Lugares para Eventos",
      "api::event-type": "Tipos de Evento",
      "api::content-info": "Información de Contenido",
      "api::home-page": "Página de Inicio",
    };

    return (
      displayNames[endpoint] ||
      endpoint
        .replace("api::", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission) => {
      console.log('🔍 Checking permission:', permission, 'Available:', state.userPermissions);
      
      // Verificar diferentes formatos de permisos
      if (state.userPermissions[permission]) return true;

      // Verificar si es super admin
      if (state.userPermissions["plugin::users-permissions.role.find"]) {
        return true; // Super admin tiene todos los permisos
      }

      return false;
    },
    [state.userPermissions],
  );

  // Check if user can access a specific menu/module
  const canAccessModule = useCallback(
    (moduleName) => {
      const menu = state.navigationMenus.find(
        (m) => m.id === moduleName || m.controller === moduleName || m.route.includes(moduleName),
      );

      return menu ? menu.permissions.canView : false;
    },
    [state.navigationMenus],
  );

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
    getDisplayName,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export default PermissionsContext;
