// ===============================================
// SERVICIO DE CONFIGURACIÓN GLOBAL
// ===============================================

import axios from 'axios';
import { API_CONFIG, ENDPOINTS, buildApiUrl, buildImageUrl, getDefaultHeaders, handleApiError } from '../config/api.js';

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

class GlobalService {

  // ===============================================
  // OBTENER CONFIGURACIÓN GLOBAL
  // ===============================================
  async getGlobalConfig() {
    try {
      console.log('🌐 Obteniendo configuración global...');
      
      const response = await apiClient.get(
        `/${API_CONFIG.API_PREFIX}/${ENDPOINTS.GLOBAL}`
      );

      const globalData = response.data.data || response.data;
      
      // Guardar en cache
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.GLOBAL_CONFIG, JSON.stringify(globalData));
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      console.log('✅ Configuración global obtenida:', {
        siteName: globalData.siteName,
        hasLogo: !!globalData.logoMain,
        hasColors: !!globalData.colors
      });
      
      return globalData;
      
    } catch (error) {
      console.error('❌ Error al obtener configuración global:', error);
      
      // Intentar cargar desde cache
      const cachedConfig = this.getCachedGlobalConfig();
      if (cachedConfig) {
        console.log('📄 Usando configuración desde cache');
        return cachedConfig;
      }
      
      throw new Error(error.response?.data?.error?.message || 'Error al obtener configuración global');
    }
  }

  // ===============================================
  // OBTENER CONFIGURACIÓN DESDE CACHE
  // ===============================================
  getCachedGlobalConfig() {
    try {
      const cachedData = localStorage.getItem(API_CONFIG.STORAGE_KEYS.GLOBAL_CONFIG);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('❌ Error al obtener cache:', error);
      return null;
    }
  }

  // ===============================================
  // APLICAR CONFIGURACIÓN GLOBAL A LA UI Y PWA
  // ===============================================
  applyGlobalConfig(config) {
    try {
      console.log('🎨 Aplicando configuración global a la UI y PWA...');
      
      // Aplicar título del sitio
      if (config.siteName) {
        this.updateMetaTag('dynamic-title', config.siteName, 'title');
        this.updateMetaTag('dynamic-app-title', config.siteName, 'content');
        this.updateMetaTag('dynamic-og-title', config.siteName, 'content');
        this.updateMetaTag('dynamic-twitter-title', config.siteName, 'content');
      }
      
      // Aplicar descripción
      if (config.description) {
        this.updateMetaTag('dynamic-description', config.description, 'content');
        this.updateMetaTag('dynamic-og-description', config.description, 'content');
        this.updateMetaTag('dynamic-twitter-description', config.description, 'content');
      }
      
      // Aplicar favicon y logos
      if (config.favicon) {
        this.updateFavicon(config.favicon);
      }
      
      if (config.logoMain) {
        this.updateAppIcons(config.logoMain);
      }
      
      // Aplicar colores del tema y PWA
      if (config.colors) {
        this.applyThemeColors(config.colors);
        this.updatePWAThemeColor(config.colors.primaryColor);
      }
      
      // Actualizar manifest dinámicamente
      this.updatePWAManifest(config);
      
      console.log('✅ Configuración aplicada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al aplicar configuración:', error);
    }
  }

  // ===============================================
  // ACTUALIZAR META TAG DINÁMICO
  // ===============================================
  updateMetaTag(id, value, attribute = 'content') {
    try {
      const element = document.getElementById(id);
      if (element) {
        if (attribute === 'title') {
          element.textContent = value;
          document.title = value;
        } else {
          element.setAttribute(attribute, value);
        }
      }
    } catch (error) {
      console.error(`❌ Error al actualizar meta tag ${id}:`, error);
    }
  }

  // ===============================================
  // ACTUALIZAR FAVICON
  // ===============================================
  updateFavicon(faviconData) {
    try {
      if (!faviconData || !faviconData.url) return;
      
      const faviconUrl = buildImageUrl(faviconData.url);
      
      // Actualizar favicon dinámico
      const favicon = document.getElementById('dynamic-favicon');
      if (favicon) {
        favicon.href = faviconUrl;
      }
      
      // Actualizar favicon tradicional
      let traditionFavicon = document.querySelector('link[rel="icon"]:not([id])');
      if (!traditionFavicon) {
        traditionFavicon = document.createElement('link');
        traditionFavicon.rel = 'icon';
        document.head.appendChild(traditionFavicon);
      }
      traditionFavicon.href = faviconUrl;
      
      console.log('✅ Favicon actualizado:', faviconUrl);
      
    } catch (error) {
      console.error('❌ Error al actualizar favicon:', error);
    }
  }

  // ===============================================
  // ACTUALIZAR ICONOS DE APP
  // ===============================================
  updateAppIcons(logoData) {
    try {
      if (!logoData || !logoData.url) return;
      
      const logoUrl = buildImageUrl(logoData.url);
      
      // Actualizar iconos PWA
      this.updateMetaTag('dynamic-apple-touch-icon', logoUrl, 'href');
      this.updateMetaTag('dynamic-icon-192', logoUrl, 'href');
      this.updateMetaTag('dynamic-icon-512', logoUrl, 'href');
      this.updateMetaTag('dynamic-og-image', logoUrl, 'content');
      this.updateMetaTag('dynamic-twitter-image', logoUrl, 'content');
      
      console.log('✅ Iconos de app actualizados:', logoUrl);
      
    } catch (error) {
      console.error('❌ Error al actualizar iconos de app:', error);
    }
  }

  // ===============================================
  // ACTUALIZAR COLOR DE TEMA PWA
  // ===============================================
  updatePWAThemeColor(primaryColor) {
    try {
      if (!primaryColor) return;
      
      this.updateMetaTag('dynamic-theme-color', primaryColor, 'content');
      
      // También actualizar meta tags adicionales para PWA
      const msNavButtonColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
      if (msNavButtonColor) {
        msNavButtonColor.content = primaryColor;
      } else {
        const meta = document.createElement('meta');
        meta.name = 'msapplication-navbutton-color';
        meta.content = primaryColor;
        document.head.appendChild(meta);
      }
      
      console.log('✅ Color de tema PWA actualizado:', primaryColor);
      
    } catch (error) {
      console.error('❌ Error al actualizar color de tema PWA:', error);
    }
  }

  // ===============================================
  // ACTUALIZAR MANIFEST PWA DINÁMICAMENTE
  // ===============================================
  updatePWAManifest(config) {
    try {
      // Crear manifest dinámico
      const manifest = {
        name: config.siteName || "CRM Admin Panel",
        short_name: config.shortName || config.siteName?.substring(0, 12) || "CRM Admin",
        description: config.description || "Admin Panel CRUD conectado a Strapi - Gestión de usuarios, roles y permisos",
        start_url: "/",
        display: "standalone",
        background_color: config.colors?.primaryColor || "#2881E7",
        theme_color: config.colors?.primaryColor || "#2881E7",
        orientation: "portrait-primary",
        scope: "/",
        lang: "es-ES",
        categories: ["business", "productivity"],
        icons: [
          {
            src: config.logoMain ? buildImageUrl(config.logoMain.url) : "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: config.logoMain ? buildImageUrl(config.logoMain.url) : "/icon-512x512.png", 
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Ir al dashboard principal",
            url: "/dashboard",
            icons: [{ src: config.logoMain ? buildImageUrl(config.logoMain.url) : "/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Usuarios",
            short_name: "Usuarios", 
            description: "Gestionar usuarios",
            url: "/users",
            icons: [{ src: config.logoMain ? buildImageUrl(config.logoMain.url) : "/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Mi Perfil",
            short_name: "Perfil",
            description: "Ver mi perfil",
            url: "/profile", 
            icons: [{ src: config.logoMain ? buildImageUrl(config.logoMain.url) : "/icon-192x192.png", sizes: "192x192" }]
          }
        ],
        prefer_related_applications: false
      };

      // Crear blob con el manifest y actualizar link
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Revocar URL anterior si existe  
        if (manifestLink.href.startsWith('blob:')) {
          URL.revokeObjectURL(manifestLink.href);
        }
        manifestLink.href = manifestUrl;
      }

      console.log('✅ Manifest PWA actualizado dinámicamente');
      
    } catch (error) {
      console.error('❌ Error al actualizar manifest PWA:', error);
    }
  }

  // ===============================================
  // APLICAR COLORES DEL TEMA
  // ===============================================
  applyThemeColors(colors) {
    try {
      if (!colors) return;
      
      const root = document.documentElement;
      
      // Convertir colores HEX a HSL y aplicar con variantes
      if (colors.primaryColor) {
        const primaryHSL = this.hexToHSL(colors.primaryColor);
        if (primaryHSL) {
          // Color principal
          root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
          
          // Variantes light y dark
          const lightL = Math.min(primaryHSL.l + 15, 90);
          const darkL = Math.max(primaryHSL.l - 15, 20);
          root.style.setProperty('--primary-light', `${primaryHSL.h} ${primaryHSL.s}% ${lightL}%`);
          root.style.setProperty('--primary-dark', `${primaryHSL.h} ${primaryHSL.s}% ${darkL}%`);
          
          // Actualizar color del ring (usado en focus)
          root.style.setProperty('--ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
          
          // Actualizar sidebar primary
          root.style.setProperty('--sidebar-primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
          root.style.setProperty('--sidebar-ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
        }
      }
      
      if (colors.secondaryColor) {
        const secondaryHSL = this.hexToHSL(colors.secondaryColor);
        if (secondaryHSL) {
          // Color secundario
          root.style.setProperty('--secondary', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
          
          // Variantes light y dark
          const lightL = Math.min(secondaryHSL.l + 15, 90);
          const darkL = Math.max(secondaryHSL.l - 15, 20);
          root.style.setProperty('--secondary-light', `${secondaryHSL.h} ${secondaryHSL.s}% ${lightL}%`);
          root.style.setProperty('--secondary-dark', `${secondaryHSL.h} ${secondaryHSL.s}% ${darkL}%`);
        }
      }
      
      if (colors.accentColor) {
        const accentHSL = this.hexToHSL(colors.accentColor);
        if (accentHSL) {
          // Color de acento
          root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
          
          // Variantes light y dark
          const lightL = Math.min(accentHSL.l + 15, 90);
          const darkL = Math.max(accentHSL.l - 15, 20);
          root.style.setProperty('--accent-light', `${accentHSL.h} ${accentHSL.s}% ${lightL}%`);
          root.style.setProperty('--accent-dark', `${accentHSL.h} ${accentHSL.s}% ${darkL}%`);
        }
      }
      
      // Actualizar gradientes dinámicamente
      if (colors.primaryColor && colors.accentColor) {
        const primaryHSL = this.hexToHSL(colors.primaryColor);
        const accentHSL = this.hexToHSL(colors.accentColor);
        
        if (primaryHSL && accentHSL) {
          root.style.setProperty(
            '--gradient-primary', 
            `linear-gradient(135deg, hsl(${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%) 0%, hsl(${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%) 100%)`
          );
        }
      }
      
      if (colors.secondaryColor && colors.primaryColor) {
        const secondaryHSL = this.hexToHSL(colors.secondaryColor);
        const primaryHSL = this.hexToHSL(colors.primaryColor);
        
        if (secondaryHSL && primaryHSL) {
          root.style.setProperty(
            '--gradient-secondary', 
            `linear-gradient(135deg, hsl(${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%) 0%, hsl(${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%) 100%)`
          );
        }
      }
      
      if (colors.accentColor && colors.secondaryColor) {
        const accentHSL = this.hexToHSL(colors.accentColor);
        const secondaryHSL = this.hexToHSL(colors.secondaryColor);
        
        if (accentHSL && secondaryHSL) {
          root.style.setProperty(
            '--gradient-accent', 
            `linear-gradient(135deg, hsl(${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%) 0%, hsl(${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%) 100%)`
          );
        }
      }
      
      // Actualizar sombras con glow usando el color primario
      if (colors.primaryColor) {
        const primaryHSL = this.hexToHSL(colors.primaryColor);
        if (primaryHSL) {
          root.style.setProperty('--shadow-glow', `0 0 20px hsl(${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}% / 0.3)`);
          root.style.setProperty('--shadow-glow-lg', `0 0 40px hsl(${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}% / 0.4)`);
        }
      }
      
      console.log('✅ Colores del tema aplicados con variantes y gradientes');
      
    } catch (error) {
      console.error('❌ Error al aplicar colores:', error);
    }
  }

  // ===============================================
  // OBTENER URL DE IMAGEN
  // ===============================================
  getImageUrl(imageData) {
    if (!imageData) return null;
    
    if (typeof imageData === 'string') {
      return buildImageUrl(imageData);
    }
    
    if (imageData.url) {
      return buildImageUrl(imageData.url);
    }
    
    return null;
  }

  // ===============================================
  // OBTENER URLs DE IMAGEN RESPONSIVE
  // ===============================================
  getResponsiveImageUrls(imageData) {
    if (!imageData) return null;
    
    const urls = {
      original: this.getImageUrl(imageData)
    };
    
    if (imageData.formats) {
      Object.keys(imageData.formats).forEach(format => {
        urls[format] = buildImageUrl(imageData.formats[format].url);
      });
    }
    
    return urls;
  }

  // ===============================================
  // CONVERTIR HEX A HSL
  // ===============================================
  hexToHSL(hex) {
    try {
      hex = hex.replace('#', '');
      
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
      }
      
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      };
      
    } catch (error) {
      console.error('❌ Error al convertir HEX a HSL:', error);
      return null;
    }
  }

  // ===============================================
  // AUTO-REFRESH
  // ===============================================
  startAutoRefresh(callback, interval = API_CONFIG.REFRESH_INTERVAL) {
    console.log('🔄 Iniciando auto-refresh...');
    
    return setInterval(async () => {
      try {
        const newConfig = await this.getGlobalConfig();
        callback(newConfig);
      } catch (error) {
        console.error('❌ Error en auto-refresh:', error);
      }
    }, interval);
  }

  stopAutoRefresh(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('🛑 Auto-refresh detenido');
    }
  }
}

// Crear instancia singleton
const globalService = new GlobalService();

export { globalService as GlobalService };
export default globalService;