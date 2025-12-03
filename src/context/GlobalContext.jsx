import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GlobalService } from '../services/globalService.js';
import { toast } from '@/hooks/use-toast';

// Initial state
const initialState = {
  config: null,
  isLoading: true,
  error: null,
  isOnline: navigator.onLine,
  refreshInterval: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_CONFIG: 'SET_CONFIG',
  SET_ERROR: 'SET_ERROR',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_REFRESH_INTERVAL: 'SET_REFRESH_INTERVAL'
};

// Reducer
const globalReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case ActionTypes.SET_CONFIG:
      return {
        ...state,
        config: action.payload,
        isLoading: false,
        error: null
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case ActionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ActionTypes.SET_REFRESH_INTERVAL:
      return {
        ...state,
        refreshInterval: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const GlobalContext = createContext();

// Custom hook to use global context
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

// GlobalProvider component
export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Initialize global config on mount
  useEffect(() => {
    loadGlobalConfig();
    setupOnlineStatusListener();
    
    return () => {
      // Cleanup
      if (state.refreshInterval) {
        GlobalService.stopAutoRefresh(state.refreshInterval);
      }
    };
  }, []);

  // Setup online/offline listener
  const setupOnlineStatusListener = () => {
    const handleOnline = () => {
      dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: true });
      // Reload config when coming back online
      if (!state.config) {
        loadGlobalConfig();
      }
    };
    
    const handleOffline = () => {
      dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: false });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  // Load global configuration
  const loadGlobalConfig = async (showToast = false) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      
      const config = await GlobalService.getGlobalConfig();
      
      dispatch({ type: ActionTypes.SET_CONFIG, payload: config });
      
      // Apply config to the app
      GlobalService.applyGlobalConfig(config);
      
      if (showToast) {
        toast({
          title: "Configuración actualizada",
          description: "La configuración global ha sido recargada",
        });
      }
      
      return { success: true, config };
    } catch (error) {
      // Try to load cached config
      const cachedConfig = GlobalService.getCachedGlobalConfig();
      
      if (cachedConfig) {
        dispatch({ type: ActionTypes.SET_CONFIG, payload: cachedConfig });
        GlobalService.applyGlobalConfig(cachedConfig);
        
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Usando configuración en caché",
            description: "No se pudo conectar al servidor",
          });
        }
        
        return { success: true, config: cachedConfig, fromCache: true };
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Error de configuración",
            description: error.message,
          });
        }
        
        return { success: false, error: error.message };
      }
    }
  };

  // Start auto-refresh for configuration
  const startAutoRefresh = (interval = 30000) => {
    if (state.refreshInterval) {
      GlobalService.stopAutoRefresh(state.refreshInterval);
    }
    
    const intervalId = GlobalService.startAutoRefresh((newConfig) => {
      // Only update if config has actually changed
      if (JSON.stringify(state.config) !== JSON.stringify(newConfig)) {
        dispatch({ type: ActionTypes.SET_CONFIG, payload: newConfig });
        GlobalService.applyGlobalConfig(newConfig);
        
        toast({
          title: "Configuración actualizada",
          description: "Se ha detectado una nueva configuración",
        });
      }
    }, interval);
    
    dispatch({ type: ActionTypes.SET_REFRESH_INTERVAL, payload: intervalId });
    
    return intervalId;
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (state.refreshInterval) {
      GlobalService.stopAutoRefresh(state.refreshInterval);
      dispatch({ type: ActionTypes.SET_REFRESH_INTERVAL, payload: null });
    }
  };

  // Get image URL helper
  const getImageUrl = (imageData, size = 'original') => {
    if (!imageData) return null;
    
    if (size === 'original') {
      return GlobalService.getImageUrl(imageData);
    }
    
    const responsiveUrls = GlobalService.getResponsiveImageUrls(imageData);
    return responsiveUrls ? responsiveUrls[size] || responsiveUrls.original : null;
  };

  // Get site branding
  const getBranding = () => {
    if (!state.config) return {};
    
    return {
      siteName: state.config.siteName || 'TechOffice Hub',
      tagline: state.config.tagline || 'Gestión de Espacios Tech',
      logo: state.config.logoMain ? getImageUrl(state.config.logoMain) : null,
      logoAlt: state.config.logoAlt ? getImageUrl(state.config.logoAlt) : null,
      logoMobile: state.config.logoMobile ? getImageUrl(state.config.logoMobile) : null,
      favicon: state.config.favicon ? getImageUrl(state.config.favicon) : null,
    };
  };

  // Get content menu mode ('global' or 'categories')
  const getContentMenuMode = () => {
    return state.config?.contentMenuMode || 'global';
  };

  // Get colors
  const getColors = () => {
    if (!state.config?.colors) return {};
    
    return {
      primary: state.config.colors.primaryColor || '#00D9FF',
      secondary: state.config.colors.secondaryColor || '#8B5CF6',
      accent: state.config.colors.accentColor || '#F97316',
      background: state.config.colors.backgroundColor || '#FFFFFF',
      text: state.config.colors.textColor || '#000000'
    };
  };

  // Get SEO data
  const getSEO = () => {
    if (!state.config?.seo) return {};
    
    return {
      title: state.config.seo.metaTitle || state.config.siteName || 'TechOffice Hub',
      description: state.config.seo.metaDescription || 'Plataforma de gestión integral para edificios de oficinas tech',
      keywords: state.config.seo.keywords || 'oficinas tech, coworking, gestión espacios',
      twitterHandle: state.config.seo.twitterHandle || ''
    };
  };

  // Get social links
  const getSocials = () => {
    if (!state.config?.socials) return {};
    
    return {
      facebook: state.config.socials.facebookUrl || '',
      twitter: state.config.socials.twitterUrl || '',
      instagram: state.config.socials.instagramUrl || '',
      linkedin: state.config.socials.linkedinUrl || '',
      youtube: state.config.socials.youtubeUrl || ''
    };
  };

  // Get contact info
  const getContact = () => {
    if (!state.config) return {};
    
    return {
      email: state.config.contactEmail || '',
      phone: state.config.contactPhone || '',
      address: state.config.address || ''
    };
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const value = {
    // State
    ...state,
    
    // Actions
    loadGlobalConfig,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
    
    // Helpers
    getImageUrl,
    getBranding,
    getColors,
    getSEO,
    getSocials,
    getContact,
    getContentMenuMode,
    
    // Utilities
    refreshConfig: () => loadGlobalConfig(true)
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;