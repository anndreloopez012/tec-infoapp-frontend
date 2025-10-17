import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Check, X, Plus, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';

const ModulePage: React.FC = () => {
  const { module } = useParams<{ module: string }>();
  const navigate = useNavigate();
  const { navigationMenus, canAccessModule, hasPermission } = useAuthPermissions();

  // Buscar el módulo en la navegación
  const currentModule = navigationMenus?.find(m => 
    m.route.includes(module || '') || 
    m.controller === module ||
    m.id.includes(module || '')
  );

  if (!module || !canAccessModule(module)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a este módulo</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {currentModule?.title || module}
          </h1>
          <p className="text-muted-foreground">
            Gestión del módulo {currentModule?.title || module}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Módulo Activo
          </Badge>
        </div>
      </motion.div>

      {/* Información del módulo */}
      {currentModule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Información del Módulo</span>
              </CardTitle>
              <CardDescription>
                Detalles y permisos del módulo {currentModule.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Controlador</label>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded">{currentModule.controller}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded">{currentModule.endpoint}</p>
                </div>
              </div>

              {/* Permisos */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Permisos Disponibles</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`
                    flex items-center space-x-2 p-3 rounded-lg border 
                    ${currentModule.permissions.canView 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }
                  `}>
                    {currentModule.permissions.canView ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentModule.permissions.canView ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Ver
                    </span>
                  </div>

                  <div className={`
                    flex items-center space-x-2 p-3 rounded-lg border 
                    ${currentModule.permissions.canCreate 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }
                  `}>
                    {currentModule.permissions.canCreate ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentModule.permissions.canCreate ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Crear
                    </span>
                  </div>

                  <div className={`
                    flex items-center space-x-2 p-3 rounded-lg border 
                    ${currentModule.permissions.canEdit 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }
                  `}>
                    {currentModule.permissions.canEdit ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentModule.permissions.canEdit ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Editar
                    </span>
                  </div>

                  <div className={`
                    flex items-center space-x-2 p-3 rounded-lg border 
                    ${currentModule.permissions.canDelete 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }
                  `}>
                    {currentModule.permissions.canDelete ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      currentModule.permissions.canDelete ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      Eliminar
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Acciones disponibles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Acciones Disponibles</CardTitle>
            <CardDescription>
              Funcionalidades que puedes realizar en este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {currentModule?.permissions.canView && (
                <Button variant="outline" disabled>
                  <Check className="w-4 h-4 mr-2" />
                  Ver Registros
                </Button>
              )}
              {currentModule?.permissions.canCreate && (
                <Button variant="outline" disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo
                </Button>
              )}
              {currentModule?.permissions.canEdit && (
                <Button variant="outline" disabled>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {currentModule?.permissions.canDelete && (
                <Button variant="outline" disabled>
                  <Trash className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Los botones están deshabilitados porque este es un módulo de demostración. 
              En una implementación real, estas acciones estarían conectadas a las funcionalidades específicas del módulo.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ModulePage;