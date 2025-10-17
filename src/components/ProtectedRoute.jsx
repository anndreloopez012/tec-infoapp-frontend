import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  permissions = [], 
  fallbackPath = '/login' 
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles.length > 0 && !roles.some(role => hasRole(role))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 p-8"
        >
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          <p className="text-sm text-muted-foreground">
            Roles requeridos: {roles.join(', ')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Check permission requirements
  if (permissions.length > 0 && !permissions.some(permission => hasPermission(permission))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 p-8"
        >
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-foreground">Permisos Insuficientes</h1>
          <p className="text-muted-foreground">
            No tienes los permisos específicos necesarios para esta acción.
          </p>
          <p className="text-sm text-muted-foreground">
            Permisos requeridos: {permissions.join(', ')}
          </p>
        </motion.div>
      </div>
    );
  }

  // All checks passed, render the protected component
  return children;
};

export default ProtectedRoute;