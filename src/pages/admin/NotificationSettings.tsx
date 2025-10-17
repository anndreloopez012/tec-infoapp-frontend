import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  Volume2, 
  VolumeX, 
  Smartphone,
  Eye,
  EyeOff,
  Clock,
  BarChart,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

import PushNotificationService from '@/services/pushNotificationService';

const NotificationSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [testNotification, setTestNotification] = useState({
    title: 'Notificación de Prueba',
    body: 'Esta es una notificación de prueba desde el Admin Panel CRM'
  });

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);

      // Verificar soporte
      if (!PushNotificationService.isNotificationSupported()) {
        toast({
          variant: "destructive",
          title: "No soportado",
          description: "Las notificaciones push no están soportadas en este navegador"
        });
        return;
      }

      // Verificar permisos
      const permission = PushNotificationService.getPermissionStatus();
      setHasPermission(permission === 'granted');

      // Verificar suscripción
      const subscription = await PushNotificationService.getCurrentSubscription();
      setIsSubscribed(!!subscription);

      // Cargar configuraciones
      const currentSettings = PushNotificationService.getNotificationSettings();
      setSettings(currentSettings);

      // Cargar estadísticas
      const currentStats = PushNotificationService.getNotificationStats();
      setStats(currentStats);

    } catch (error) {
      console.error('Error al inicializar notificaciones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al inicializar las notificaciones"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setIsLoading(true);

      await PushNotificationService.subscribeToPush();
      
      setHasPermission(true);
      setIsSubscribed(true);

      // Activar notificaciones en configuración
      const updatedSettings = PushNotificationService.saveNotificationSettings({
        ...settings,
        enabled: true
      });
      setSettings(updatedSettings);

      toast({
        title: "¡Notificaciones activadas!",
        description: "Las notificaciones push han sido configuradas correctamente"
      });

    } catch (error) {
      console.error('Error al activar notificaciones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al activar las notificaciones"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setIsLoading(true);

      await PushNotificationService.unsubscribeFromPush();
      
      setIsSubscribed(false);

      // Desactivar notificaciones en configuración
      const updatedSettings = PushNotificationService.saveNotificationSettings({
        ...settings,
        enabled: false
      });
      setSettings(updatedSettings);

      toast({
        title: "Notificaciones desactivadas",
        description: "Las notificaciones push han sido desactivadas"
      });

    } catch (error) {
      console.error('Error al desactivar notificaciones:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al desactivar las notificaciones"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (key, value) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    PushNotificationService.saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);

    toast({
      title: "Configuración actualizada",
      description: "Los cambios han sido guardados"
    });
  };

  const handleUpdateCategorySettings = (category, value) => {
    const updatedSettings = {
      ...settings,
      categories: {
        ...settings.categories,
        [category]: value
      }
    };
    
    PushNotificationService.saveNotificationSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const handleSendTestNotification = async () => {
    try {
      setIsLoading(true);

      if (!hasPermission || !isSubscribed) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Primero debes activar las notificaciones"
        });
        return;
      }

      await PushNotificationService.sendTestNotification(
        testNotification.title,
        testNotification.body
      );

      // Actualizar estadísticas
      const newStats = PushNotificationService.updateNotificationStats('system');
      setStats(newStats);

      toast({
        title: "¡Notificación enviada!",
        description: "La notificación de prueba ha sido enviada"
      });

    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al enviar la notificación de prueba"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración de notificaciones...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-6 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Configuración de Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Gestiona las notificaciones push del sistema
            </p>
          </div>
        </div>
      </motion.div>

      {/* Estado de soporte */}
      <motion.div variants={itemVariants}>
        <Alert className={`${
          PushNotificationService.isNotificationSupported() 
            ? 'border-success bg-success/5' 
            : 'border-destructive bg-destructive/5'
        }`}>
          {PushNotificationService.isNotificationSupported() ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertTitle>
            {PushNotificationService.isNotificationSupported() 
              ? 'Notificaciones soportadas' 
              : 'Notificaciones no soportadas'
            }
          </AlertTitle>
          <AlertDescription>
            {PushNotificationService.isNotificationSupported()
              ? 'Tu navegador soporta notificaciones push'
              : 'Tu navegador no soporta notificaciones push'
            }
          </AlertDescription>
        </Alert>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuración Principal */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Principal
              </CardTitle>
              <CardDescription>
                Activa o desactiva las notificaciones push
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estado de activación */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Notificaciones Push</Label>
                    <Badge variant={hasPermission && isSubscribed ? 'default' : 'secondary'}>
                      {hasPermission && isSubscribed ? 'Activas' : 'Inactivas'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hasPermission && isSubscribed 
                      ? 'Las notificaciones están funcionando correctamente'
                      : 'Activa las notificaciones para recibir alertas importantes'
                    }
                  </p>
                </div>
                
                {hasPermission && isSubscribed ? (
                  <Button 
                    variant="outline" 
                    onClick={handleDisableNotifications}
                    disabled={isLoading}
                  >
                    Desactivar
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="btn-glow"
                  >
                    {isLoading ? 'Activando...' : 'Activar'}
                  </Button>
                )}
              </div>

              {settings && hasPermission && isSubscribed && (
                <>
                  <Separator />
                  
                  {/* Configuraciones detalladas */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                          Sonido
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Reproducir sonido con las notificaciones
                        </p>
                      </div>
                      <Switch 
                        checked={settings.sound}
                        onCheckedChange={(value) => handleUpdateSettings('sound', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Vibración
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Vibrar el dispositivo con las notificaciones
                        </p>
                      </div>
                      <Switch 
                        checked={settings.vibration}
                        onCheckedChange={(value) => handleUpdateSettings('vibration', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          {settings.showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          Vista Previa
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Mostrar contenido de la notificación
                        </p>
                      </div>
                      <Switch 
                        checked={settings.showPreview}
                        onCheckedChange={(value) => handleUpdateSettings('showPreview', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Auto-cerrar
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Cerrar automáticamente después de 5 segundos
                        </p>
                      </div>
                      <Switch 
                        checked={settings.autoClose}
                        onCheckedChange={(value) => handleUpdateSettings('autoClose', value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Categorías de notificaciones */}
          {settings && hasPermission && isSubscribed && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Categorías</CardTitle>
                <CardDescription>
                  Selecciona qué tipos de notificaciones quieres recibir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="capitalize">{category}</Label>
                      <p className="text-sm text-muted-foreground">
                        {category === 'system' && 'Notificaciones del sistema'}
                        {category === 'security' && 'Alertas de seguridad'}
                        {category === 'updates' && 'Actualizaciones y cambios'}
                        {category === 'reminders' && 'Recordatorios y tareas'}
                      </p>
                    </div>
                    <Switch 
                      checked={Boolean(enabled)}
                      onCheckedChange={(value) => handleUpdateCategorySettings(category, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Panel de pruebas y estadísticas */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Notificación de prueba */}
          {hasPermission && isSubscribed && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Notificación de Prueba
                </CardTitle>
                <CardDescription>
                  Envía una notificación de prueba para verificar la configuración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-title">Título</Label>
                  <Input
                    id="test-title"
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Título de la notificación"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-body">Mensaje</Label>
                  <Textarea
                    id="test-body"
                    value={testNotification.body}
                    onChange={(e) => setTestNotification(prev => ({
                      ...prev,
                      body: e.target.value
                    }))}
                    placeholder="Contenido de la notificación"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleSendTestNotification}
                  disabled={isLoading}
                  className="w-full btn-glow"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Notificación de Prueba'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {stats && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
                <CardDescription>
                  Resumen de notificaciones enviadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{stats.totalSent}</div>
                    <div className="text-sm text-muted-foreground">Enviadas</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-secondary">{stats.totalReceived}</div>
                    <div className="text-sm text-muted-foreground">Recibidas</div>
                  </div>
                </div>

                {stats.lastNotification && (
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-sm font-medium">Última notificación</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(stats.lastNotification).toLocaleString()}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Por categoría</Label>
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{category}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Las notificaciones push funcionan incluso cuando la aplicación está cerrada</p>
              <p>• Puedes gestionar permisos desde la configuración de tu navegador</p>
              <p>• Las notificaciones se almacenan localmente para estadísticas</p>
              <p>• Solo los administradores y super usuarios pueden acceder a esta configuración</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotificationSettings;