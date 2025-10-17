import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  TrendingUp, 
  Home, 
  Users, 
  User
} from 'lucide-react';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'projects',
    title: 'Proyectos',
    icon: FolderOpen,
    href: '/project',
    color: 'primary'
  },
  {
    id: 'sales',
    title: 'Ventas',
    icon: TrendingUp,
    href: '/sale',
    color: 'secondary'
  },
  {
    id: 'home',
    title: 'Home',
    icon: Home,
    href: '/dashboard',
    color: 'accent'
  },
  {
    id: 'clients',
    title: 'Clientes',
    icon: Users,
    href: '/customer',
    color: 'primary'
  },
  {
    id: 'profile',
    title: 'Perfil',
    icon: User,
    href: '/profile',
    color: 'secondary'
  }
];

interface MobileFloatingMenuProps {
  sidebarOpen?: boolean;
}

const MobileFloatingMenu: React.FC<MobileFloatingMenuProps> = ({ sidebarOpen = false }) => {
  const location = useLocation();
  const { canAccessModule } = useAuthPermissions();

  const isActive = (path: string) => location.pathname === path;

  // Filter menu items based on permissions (except home and profile)
  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'home' || item.id === 'profile') return true;
    
    // Map menu items to module permissions
    const moduleMap = {
      'projects': 'api::project',
      'sales': 'api::sale',
      'clients': 'api::customer'
    };
    
    const moduleId = moduleMap[item.id as keyof typeof moduleMap];
    return moduleId ? canAccessModule(moduleId) : true;
  });

  return (
    <>
      {/* Mobile Floating Menu - Only visible on mobile when sidebar is closed */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: sidebarOpen ? 100 : 0, 
          opacity: sidebarOpen ? 0 : 1,
          scale: sidebarOpen ? 0.8 : 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          delay: sidebarOpen ? 0 : 0.2 
        }}
        className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 md:hidden flex justify-center px-4"
      >
        {/* Glassmorphism Container */}
        <div className="relative max-w-fit">
          {/* Glow Effect Background */}
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 20px hsl(var(--primary) / 0.3)',
                '0 0 40px hsl(var(--primary) / 0.6)',
                '0 0 20px hsl(var(--primary) / 0.3)'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-30 blur-lg"
          />
          
          {/* Main Menu Container */}
          <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-2xl">
            {/* Menu Items */}
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  >
                    <NavLink
                      to={item.href}
                      className="group relative block"
                    >
                      {/* Active Indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 bg-gradient-primary rounded-xl opacity-90"
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 30 
                          }}
                        />
                      )}
                      
                      {/* Menu Button */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          relative flex flex-col items-center justify-center
                          w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl transition-all duration-300
                          ${active 
                            ? 'text-white shadow-lg' 
                            : 'text-foreground/70 hover:text-foreground hover:bg-white/10 dark:hover:bg-black/20'
                          }
                        `}
                      >
                        {/* Icon */}
                        <Icon className={`
                          w-4 h-4 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 transition-all duration-300
                          ${active ? 'text-white drop-shadow-lg' : 'group-hover:scale-110'}
                        `} />
                        
                        {/* Label */}
                        <span className={`
                          text-[8px] sm:text-[10px] font-medium leading-none transition-all duration-300 text-center
                          ${active ? 'text-white/90 drop-shadow-lg' : 'text-muted-foreground group-hover:text-foreground'}
                        `}>
                          {item.title}
                        </span>
                        
                        {/* Hover Glow Effect */}
                        {!active && (
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                            whileHover={{ opacity: 0.3 }}
                          />
                        )}
                      </motion.div>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Floating Dots Indicator */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-1 h-1 bg-primary rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backdrop for better visibility - Only when sidebar is closed */}
      <motion.div 
        animate={{ opacity: sidebarOpen ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-t from-background/50 to-transparent pointer-events-none z-40 md:hidden" 
      />
    </>
  );
};

export default MobileFloatingMenu;