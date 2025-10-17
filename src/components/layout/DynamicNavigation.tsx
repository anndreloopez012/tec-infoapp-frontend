import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building, 
  Users, 
  FileText, 
  Settings, 
  Package, 
  FolderOpen, 
  TrendingUp, 
  BarChart3, 
  Wrench, 
  Ticket,
  UserCheck,
  Bell
} from 'lucide-react';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';

// Mapeo de iconos para los módulos
const moduleIcons = {
  'api::company': Building,
  'api::customer': Users,
  'api::digital-form': FileText,
  'api::global': Settings,
  'api::project': FolderOpen,
  'api::project-stage': FolderOpen,
  'api::sale': Package,
  'api::sale-stage': BarChart3,
  'api::solution': Wrench,
  'api::ticket-status': Ticket,
  'api::type-user': UserCheck
};

interface DynamicNavigationProps {
  onNavigate?: () => void;
  searchQuery?: string;
}

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ onNavigate, searchQuery = '' }) => {
  const { navigationMenus, isLoading } = useAuthPermissions();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Definir qué módulos van en cada categoría
  // Módulos del Sistema: Los principales módulos de gestión
  const systemModules = ['api::project', 'api::customer', 'api::sale'];
  
  // Módulos Catálogos: Incluye api::project-stage, api::sale-stage y otros catálogos
  // Estos se determinan automáticamente (todos los que NO están en systemModules)
  
  // Filter and categorize menus
  const { catalogModules, systemMenus, filteredCatalogMenus, filteredSystemMenus } = React.useMemo(() => {
    if (!navigationMenus) {
      return { catalogModules: [], systemMenus: [], filteredCatalogMenus: [], filteredSystemMenus: [] };
    }

    // Separar módulos por categoría
    const catalogModules = navigationMenus.filter(menu => !systemModules.includes(menu.id));
    const systemMenus = navigationMenus.filter(menu => systemModules.includes(menu.id));

    // Aplicar filtro de búsqueda si existe
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const filteredCatalogMenus = catalogModules.filter(menu => 
        menu.title.toLowerCase().includes(query) ||
        menu.id.toLowerCase().includes(query)
      );
      const filteredSystemMenus = systemMenus.filter(menu => 
        menu.title.toLowerCase().includes(query) ||
        menu.id.toLowerCase().includes(query)
      );
      
      return { catalogModules, systemMenus, filteredCatalogMenus, filteredSystemMenus };
    }

    return { 
      catalogModules, 
      systemMenus, 
      filteredCatalogMenus: catalogModules, 
      filteredSystemMenus: systemMenus 
    };
  }, [navigationMenus, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6 px-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/70 px-2 mb-3">
            Módulos Catálogos
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 bg-muted/30 rounded-md animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/70 px-2 mb-3">
            Módulos del Sistema
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-10 bg-muted/30 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalMenus = filteredCatalogMenus.length + filteredSystemMenus.length;
  
  if (totalMenus === 0) {
    const message = searchQuery.trim() 
      ? `No se encontraron módulos que coincidan con "${searchQuery}"`
      : 'No tienes permisos para acceder a ningún módulo';
      
    return (
      <div className="px-3">
        <div className="text-sm text-muted-foreground/60 px-2 py-4 text-center">
          {message}
        </div>
      </div>
    );
  }

  const renderMenuSection = (menus: any[], title: string) => {
    if (menus.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground/70 px-2 mb-3">
          {title}
        </div>
        
        {menus.map((menu) => {
          const IconComponent = moduleIcons[menu.id] || Package;
          const active = isActive(menu.route);
          
          return (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NavLink
                to={menu.route}
                onClick={onNavigate}
                className={`
                  group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 hover:bg-accent/50 relative overflow-hidden
                  ${active 
                    ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary font-semibold border-l-2 border-primary' 
                    : 'text-foreground/70 hover:text-foreground'
                  }
                `}
              >
                {/* Efecto de hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.2 }}
                />
                
                <IconComponent className={`
                  h-4 w-4 transition-colors relative z-10
                  ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                `} />
                
                <span className="relative z-10 flex-1">{menu.title}</span>
                
                {/* Indicador de permisos */}
                <div className="relative z-10 flex items-center gap-1">
                  {menu.permissions.canCreate && (
                    <div className="w-1 h-1 bg-green-500 rounded-full" title="Puede crear" />
                  )}
                  {menu.permissions.canEdit && (
                    <div className="w-1 h-1 bg-blue-500 rounded-full" title="Puede editar" />
                  )}
                  {menu.permissions.canDelete && (
                    <div className="w-1 h-1 bg-red-500 rounded-full" title="Puede eliminar" />
                  )}
                </div>
                
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-full"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-3">
      {/* Módulos Catálogos - Arriba */}
      {renderMenuSection(filteredCatalogMenus, 'Módulos Catálogos')}
      
      {/* Módulos del Sistema - Abajo */}
      {renderMenuSection(filteredSystemMenus, 'Módulos del Sistema')}
    </div>
  );
};

export default DynamicNavigation;