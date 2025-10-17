import React, { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Settings, 
  User,
  LogOut,
  Home,
  Eye,
  UserCog,
  ChevronDown,
  ChevronRight,
  FileText,
  ScrollText,
  Send,
  Calendar,
  CalendarDays
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRoles } from '@/hooks/useRoles';
import { useSearch } from '@/context/SearchContext';
import DynamicNavigation from './DynamicNavigation';

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  children?: NavigationItem[];
}

const ModernSidebar = () => {
  const { user, logout, hasPermission, hasRole } = useAuth();
  const { navigationMenus } = useAuthPermissions();
  const { getBranding } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();
  const branding = getBranding();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { getRoleLabelForUser, getUserType, getRoleType } = useRoles();
  const { searchQuery, isSearching } = useSearch();

  // Check if user has admin role for certain menu items
  const roleType = getRoleType();
  const isAdmin = roleType === 'super' || roleType === 'admin';
  const isSuper = roleType === 'super';

  const navigation: NavigationItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Administración',
      href: '/admin',
      icon: Shield,
      requiredRoles: ['super', 'admin'],
      children: [
        {
          title: 'Página de Inicio',
          href: '/admin/homepage',
          icon: Home,
          requiredRoles: ['super', 'admin'],
        },
        {
          title: 'Gestión de Usuarios',
          href: '/admin/users',
          icon: Users,
          requiredRoles: ['super', 'admin'],
        },
        {
          title: 'Gestión de Roles',
          href: '/admin/roles',
          icon: Shield,
          requiredRoles: ['super', 'admin'],
        },
        {
          title: 'Gestión de Permisos',
          href: '/admin/permissions',
          icon: UserCog,
          requiredRoles: ['super', 'admin'],
        },
        {
          title: 'Tipos de Usuario',
          href: '/admin/type-users',
          icon: FileText,
          requiredRoles: ['super', 'admin'],
        },
        {
          title: 'Envio Notificacion',
          href: '/admin/notifications',
          icon: Send,
          requiredRoles: ['super', 'admin'],
        },
      ],
    },
    {
      title: 'Eventos',
      href: '/event',
      icon: Calendar,
    },
    {
      title: 'Calendario',
      href: '/calendar',
      icon: CalendarDays,
    },
    {
      title: 'Configuración',
      href: '/settings',
      icon: Settings,
      requiredRoles: ['super', 'admin'],
    },
    {
      title: 'BITÁCORA',
      href: '/admin/bitacora',
      icon: ScrollText,
      requiredRoles: ['super', 'admin'],
    },
  ];

  // Filter navigation based on permissions, roles, and search query
  const filteredNavigation = useMemo(() => {
    let items = navigation.filter(item => {
      // Check permissions first
      if (item.requiredPermissions) {
        const hasRequiredPermission = item.requiredPermissions.some(permission => 
          hasPermission(permission)
        );
        if (!hasRequiredPermission) return false;
      }
      
      // Check roles using new structure
      if (item.requiredRoles) {
        const hasRequiredRole = item.requiredRoles.includes(roleType) || isSuper;
        if (!hasRequiredRole) return false;
      }
      
      // Filter children if they exist
      if (item.children) {
        item.children = item.children.filter(child => {
          if (child.requiredPermissions) {
            const hasRequiredPermission = child.requiredPermissions.some(permission => 
              hasPermission(permission)
            );
            if (!hasRequiredPermission) return false;
          }
          
          if (child.requiredRoles) {
            const hasRequiredRole = child.requiredRoles.includes(roleType) || isSuper;
            if (!hasRequiredRole) return false;
          }
          
          return true;
        });
      }
      
      return true;
    });

    // Apply search filter if there's a search query
    if (isSearching && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      items = items.filter(item => {
        // Check if parent item matches
        const parentMatches = item.title.toLowerCase().includes(query);
        
        // Check if any child matches
        const childMatches = item.children?.some(child => 
          child.title.toLowerCase().includes(query)
        ) || false;
        
        // If parent matches, keep all children
        if (parentMatches) {
          return true;
        }
        
        // If only children match, filter to show only matching children
        if (childMatches && item.children) {
          item.children = item.children.filter(child =>
            child.title.toLowerCase().includes(query)
          );
          // Auto-expand parent if children match
          if (!expandedItems.includes(item.href)) {
            setExpandedItems(prev => [...prev, item.href]);
          }
          return true;
        }
        
        return false;
      });
    }

    return items;
  }, [navigation, hasPermission, hasRole, roleType, isSuper, searchQuery, isSearching]);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  // Auto-expand parent items if child is active
  React.useEffect(() => {
    filteredNavigation.forEach(item => {
      if (item.children && item.children.some(child => isActive(child.href))) {
        if (!expandedItems.includes(item.href)) {
          setExpandedItems(prev => [...prev, item.href]);
        }
      }
    });
  }, [location.pathname]);

  const getUserInitials = () => {
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const getUserRole = () => {
    return getRoleLabelForUser() || 'Usuario';
  };

  const getUserTypeLabel = () => {
    return getUserType() || 'Sin tipo';
  };

  return (
    <div className="w-64 sm:w-72 h-screen bg-gradient-to-b from-card/95 to-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col shadow-2xl relative z-40 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border/50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 sm:space-x-3"
        >
          {branding.logo ? (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md animate-pulse"></div>
              <img
                src={branding.logo}
                alt={branding.siteName}
                className="relative w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-md opacity-30 animate-pulse"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate bg-gradient-primary bg-clip-text text-transparent">
              {branding.siteName || 'TechOffice Hub'}
            </h2>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Gestión de Espacios Tech
            </p>
          </div>
        </motion.div>
      </div>

      {/* Información del usuario */}
      <div className="p-4 sm:p-6 border-b border-border/50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-2 sm:space-x-3"
        >
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-primary/30 shadow-lg flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm sm:text-lg">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.username || user?.email}
            </p>
            <div className="flex flex-col space-y-1">
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary px-2 py-0.5 w-fit">
                <Shield className="w-3 h-3 mr-1" />
                <span className="truncate">{getUserRole()}</span>
              </Badge>
              <Badge variant="outline" className="text-xs bg-secondary/10 border-secondary/30 text-secondary px-2 py-0.5 w-fit hidden sm:flex">
                <User className="w-3 h-3 mr-1" />
                <span className="truncate">{getUserTypeLabel()}</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">En línea</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 truncate">
            Navegación Principal
          </h3>
          
          {filteredNavigation.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const parentActive = isParentActive(item);
            const isExpanded = expandedItems.includes(item.href);
            
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
                className="space-y-1"
              >
                {/* Elemento padre */}
                <div
                  className={`
                    group flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer
                    ${parentActive 
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary/30' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                  onClick={() => {
                    if (item.children && item.children.length > 0) {
                      toggleExpanded(item.href);
                    } else {
                      // Navegar directamente para elementos sin hijos
                      navigate(item.href);
                    }
                  }}
                >
                  {parentActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-primary rounded-xl"
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0 ${
                      parentActive ? 'scale-110 text-white' : 'group-hover:scale-105'
                    }`} />
                    <span className="font-medium text-sm sm:text-base truncate">{item.title}</span>
                    
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 hidden sm:flex ${
                          parentActive ? 'bg-white/20 text-white border-white/30' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    
                    {item.children && item.children.length > 0 && (
                      <div className="ml-auto flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className={`w-4 h-4 transition-transform ${
                            parentActive ? 'text-white' : 'text-muted-foreground'
                          }`} />
                        ) : (
                          <ChevronRight className={`w-4 h-4 transition-transform ${
                            parentActive ? 'text-white' : 'text-muted-foreground'
                          }`} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Elementos hijos */}
                {item.children && item.children.length > 0 && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 sm:ml-6 space-y-1 border-l border-border/50 pl-2 sm:pl-4"
                  >
                    {item.children.map((child, childIndex) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.href);
                      
                      return (
                        <motion.div
                          key={child.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: childIndex * 0.05 }}
                        >
                          <NavLink
                            to={child.href}
                            className={`
                              group flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-300 relative
                              ${childActive 
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                              }
                            `}
                          >
                            <ChildIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300 flex-shrink-0 ${
                              childActive ? 'text-primary' : 'group-hover:scale-105'
                            }`} />
                            <span className="text-xs sm:text-sm font-medium truncate">{child.title}</span>
                            
                            {child.badge && (
                              <Badge 
                                variant="outline" 
                                className={`text-[9px] px-1.5 py-0.5 ml-auto flex-shrink-0 hidden sm:flex ${
                                  childActive ? 'border-primary/30 text-primary' : 'text-muted-foreground'
                                }`}
                              >
                                {child.badge}
                              </Badge>
                            )}
                          </NavLink>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            );
           })}
        </div>
        
        {/* Módulos dinámicos basados en permisos */}
        {navigationMenus && navigationMenus.length > 0 && (
          <>
            <Separator className="opacity-30 my-4" />
            <DynamicNavigation searchQuery={searchQuery} />
          </>
        )}
      </nav>

      <Separator className="opacity-50" />

      {/* Profile & Logout */}
      <div className="p-4 space-y-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <NavLink
            to="/profile"
            className={`
              group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300
              ${isActive('/profile')
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-md' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Mi Perfil</span>
            {isActive('/profile') && (
              <Eye className="w-4 h-4 ml-auto opacity-60" />
            )}
          </NavLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start space-x-3 px-4 py-3.5 h-auto text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernSidebar;