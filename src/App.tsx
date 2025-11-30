import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Context Providers  
import { AuthProvider } from '@/context/AuthContext';
import { GlobalProvider } from '@/context/GlobalContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

// System notifications setup
import { setupErrorNotifications } from '@/hooks/useSystemNotifications';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages
import ModernLogin from '@/pages/ModernLogin';
import ForgotPassword from '@/pages/ForgotPassword';
import ModernDashboard from '@/pages/ModernDashboard.tsx';
import Users from '@/pages/admin/Users';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import ModulePage from '@/pages/ModulePage';
import NotificationsPage from '@/pages/NotificationsPage';

// Public Pages
import PublicLanding from '@/pages/PublicLanding';
import PublicCalendar from '@/pages/public/PublicCalendar';
import PublicEvents from '@/pages/public/PublicEvents';
import CategoryContent from '@/pages/public/CategoryContent';
import PublicContentDetail from '@/pages/public/PublicContentDetail';

// Admin Pages
import RoleManagement from '@/pages/admin/RoleManagement';
import PermissionManagement from '@/pages/admin/PermissionManagement';
import TypeUser from '@/pages/TypeUser';
import GlobalSettings from '@/pages/GlobalSettings';
import NotificationSettings from '@/pages/admin/NotificationSettings';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import Bitacora from '@/pages/admin/Bitacora';

// Catalog Pages
import EventAttendance from '@/pages/catalog/EventAttendance';
import ContentCategory from '@/pages/catalog/ContentCategory';
import Company from '@/pages/catalog/Company';
import EventLocation from '@/pages/catalog/EventLocation';
import ContentTag from '@/pages/catalog/ContentTag';
import EventType from '@/pages/catalog/EventType';
import ContentInfo from '@/pages/catalog/ContentInfo';
import ContentInfoForm from '@/pages/catalog/ContentInfoForm';
import Gallery from '@/pages/catalog/Gallery';
import Event from '@/pages/Event';
import EventCalendar from '@/pages/EventCalendar';
import EventList from '@/pages/EventList';
import EventDetail from '@/pages/EventDetail';
import ContentGlobal from '@/pages/ContentGlobal';
import ContentDetail from '@/pages/ContentDetail';

// Ticket Pages
import TicketStatus from '@/pages/catalog/TicketStatus';
import TicketPriority from '@/pages/catalog/TicketPriority';
import TicketType from '@/pages/catalog/TicketType';
import TicketList from '@/pages/catalog/TicketList';
import TicketDetail from '@/pages/catalog/TicketDetail';

// Layout
import ModernLayout from '@/components/layout/ModernLayout';
import NotificationIntegration from '@/components/NotificationIntegration';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* Public Landing */}
      <Route path="/" element={<PublicLanding />} />
      <Route path="/public/calendar" element={<PublicCalendar />} />
      <Route path="/public/events" element={<PublicEvents />} />
      <Route path="/public/category/:categoryId" element={<CategoryContent />} />
      <Route path="/public/content/:contentId" element={<PublicContentDetail />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<ModernLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes with Modern Layout */}
        <Route element={
          <ProtectedRoute>
            <ModernLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<ModernDashboard />} />
          <Route path="/content-global" element={<ContentGlobal />} />
          <Route path="/content-global/:slug" element={<ContentDetail />} />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/admin/roles" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <RoleManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/permissions" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <PermissionManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/type-users" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <TypeUser />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <GlobalSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications/settings" element={<NotificationSettings />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin/bitacora" element={
            <ProtectedRoute roles={['super', 'admin', 'super_admin']}>
              <Bitacora />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={<Profile />} />
          
          {/* Catalog Routes */}
          <Route path="/catalog/event-attendance" element={<EventAttendance />} />
          <Route path="/catalog/content-category" element={<ContentCategory />} />
          <Route path="/catalog/company" element={<Company />} />
          <Route path="/catalog/event-location" element={<EventLocation />} />
          <Route path="/catalog/content-tag" element={<ContentTag />} />
          <Route path="/catalog/event-type" element={<EventType />} />
          
          {/* System Module Routes */}
          <Route path="/contentinfo" element={<ContentInfo />} />
          <Route path="/contentinfo/new" element={<ContentInfoForm />} />
          <Route path="/contentinfo/edit" element={<ContentInfoForm />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/event" element={<Event />} />
          <Route path="/calendar" element={<EventCalendar />} />
          <Route path="/event-list" element={<EventList />} />
          <Route path="/event-detail/:eventId" element={<EventDetail />} />
          
          {/* Ticket Routes */}
          <Route path="/ticket-status" element={<TicketStatus />} />
          <Route path="/ticket-priority" element={<TicketPriority />} />
          <Route path="/ticket-type" element={<TicketType />} />
          <Route path="/ticket" element={<TicketList />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          
          {/* Rutas dinámicas para módulos */}
          <Route path="/:module" element={<ModulePage />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
};

const App = () => {
  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Setup error notifications
    setupErrorNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <GlobalProvider>
            <AuthProvider>
              <PermissionsProvider>
                <NotificationsProvider>
                  <NotificationIntegration />
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </NotificationsProvider>
              </PermissionsProvider>
            </AuthProvider>
          </GlobalProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
