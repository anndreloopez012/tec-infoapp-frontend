import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';
import MobileFloatingMenu from './MobileFloatingMenu';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { SearchProvider } from '@/context/SearchContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NotificationIntegration from '@/components/NotificationIntegration';

const ModernLayout = () => {
  const { isLoading: authLoading } = useAuth();
  const { isLoading: globalLoading } = useGlobal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mostrar pantalla de carga mientras se inicializa
  if (authLoading || globalLoading) {
    return <LoadingSpinner fullScreen text="Cargando aplicación..." />;
  }

  return (
    <SearchProvider>
      <NotificationIntegration />
      <div className="pwa-safe-area min-h-screen min-h-dvh bg-gradient-to-br from-background via-background/95 to-primary/5 overflow-x-hidden">
        {/* Efectos de fondo optimizados para PWA */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 flex min-h-screen min-h-dvh">
          {/* Sidebar de escritorio */}
          <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
            <ModernSidebar />
          </div>
          
          {/* Overlay del sidebar móvil */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
                >
                  <ModernSidebar />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Contenido principal */}
          <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:ml-72">
            {/* Header */}
            <ModernHeader 
              onMenuClick={() => setSidebarOpen(true)}
              sidebarOpen={sidebarOpen}
            />
            
            {/* Contenido de la página */}
            <main className="flex-1 overflow-auto pb-28 md:pb-0">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </main>
          </div>
        </div>

        {/* Menú flotante móvil */}
        <MobileFloatingMenu sidebarOpen={sidebarOpen} />
      </div>
    </SearchProvider>
  );
};

export default ModernLayout;