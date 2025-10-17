import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Settings, Sun, Moon, X, Smartphone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useNotifications } from '@/context/NotificationsContext';
import { useSearch } from '@/context/SearchContext';

interface ModernHeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

const ModernHeader = ({ onMenuClick, sidebarOpen }: ModernHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRoleType } = useRoles();
  const { notifications, unreadCount, getRelativeTime, markAsRead } = useNotifications();
  const { searchQuery, updateSearch, clearSearch, isSearching } = useSearch();
  
  const roleType = getRoleType();
  const isAdmin = roleType === 'super' || roleType === 'admin';

  // Obtener las últimas 5 notificaciones para mostrar en el dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
        {/* Sección izquierda */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Botón de menú móvil */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Barra de búsqueda - Responsive */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            className="relative hidden sm:block"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar opciones del menú..."
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
              className="pl-10 pr-10 w-60 sm:w-72 md:w-80 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
            />
            {isSearching && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>

        {/* Sección derecha */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Toggle de tema */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-muted/50"
          >
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 sm:w-5 sm:h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2 hover:bg-muted/50">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs bg-destructive text-white border-0 p-0 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm sm:text-base">Notificaciones</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {unreadCount > 0 
                    ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
                    : 'No hay notificaciones sin leer'
                  }
                </p>
              </div>
              
              {recentNotifications.length > 0 ? (
                <>
                  {recentNotifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs sm:text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-center text-primary cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  >
                    Ver todas las notificaciones
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">No hay notificaciones</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Configuración */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted/50">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56 max-w-[calc(100vw-2rem)]">
              <DropdownMenuItem onClick={() => navigate('/admin/notifications/settings')}>
                <Bell className="w-4 h-4 mr-2" />
                <span className="text-sm">Configurar Notificaciones</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    <span className="text-sm">Configuración General</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;