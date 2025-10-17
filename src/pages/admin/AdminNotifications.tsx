import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCapacitorNotifications } from '@/hooks/useCapacitorNotifications';
import { enhancedNotificationService } from '@/services/enhancedNotificationService';
import { 
  Bell, 
  Send, 
  Users, 
  Shield, 
  AlertTriangle,
  Smartphone,
  Monitor,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { buildApiUrl, getDefaultHeaders } from '@/config/api';
import { Capacitor } from '@capacitor/core';

const AdminNotifications: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const { permissions, registrationToken, initializePushNotifications, initializeWebPushNotifications } = useCapacitorNotifications();
  
  // Estados para notificaciones administrativas
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'system'>('info');
  const [category, setCategory] = useState<'general' | 'maintenance' | 'update' | 'security' | 'promotion'>('general');
  const [recipientType, setRecipientType] = useState<'all' | 'role_based' | 'specific'>('all');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Estados para push notifications
  const [pushTokens, setPushTokens] = useState<any[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Verificar permisos
  const canSendNotifications = hasRole(['admin', 'super_admin']);
  const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';

  useEffect(() => {
    if (canSendNotifications) {
      loadRolesAndUsers();
      loadPushTokens();
    }
  }, [canSendNotifications]);

  const loadRolesAndUsers = async () => {
    setIsLoading(true);
    try {
      // Cargar roles
      const rolesResponse = await fetch(buildApiUrl('/users-permissions/roles'), {
        headers: getDefaultHeaders()
      });
      
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }

      // Cargar usuarios
      const usersResponse = await fetch(buildApiUrl('/users?populate=role'), {
        headers: getDefaultHeaders()
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error loading roles and users:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'El título y mensaje son obligatorios',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      await enhancedNotificationService.sendAdminNotification({
        title: title.trim(),
        message: message.trim(),
        type, // info | success | warning | error | system
        category, // general | maintenance | update | security | promotion
        target_users: recipientType, // all | role_based | specific
        target_user_ids: recipientType === 'specific' ? selectedUsers : undefined,
        target_roles: recipientType === 'role_based' ? selectedRoles : undefined,
        priority
      });

      toast({
        title: 'Notificación enviada',
        description: 'La notificación se ha enviado a la aplicación y como push notification del sistema',
      });

      // Limpiar formulario
      setTitle('');
      setMessage('');
      setRecipientType('all');
      setPriority('medium');
      setSelectedRoles([]);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Funciones para push notifications
  const loadPushTokens = async () => {
    setTokensLoading(true);
    try {
      const response = await fetch(buildApiUrl('/push-tokens?populate=user'), {
        headers: getDefaultHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPushTokens(data.data || data || []);
      }
    } catch (error) {
      console.error('Error loading push tokens:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tokens push',
        variant: 'destructive'
      });
    } finally {
      setTokensLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.id) return;
    
    setTestLoading(true);
    try {
      await enhancedNotificationService.sendAdminNotification({
        title: 'Notificación de Sistema (Prueba)',
        message: `Esta es una notificación de prueba enviada desde la plataforma ${platform}`,
        type: 'system',
        category: 'general',
        priority: 'low',
        recipient_type: 'specific_users',
        recipient_ids: [user.id],
        target_users: 'specific',
        target_user_ids: [user.id],
        is_active: true
      });
      
      toast({
        title: 'Notificación creada y enviada',
        description: 'Se generó una notificación de sistema y se envió push (si hay token)'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación de prueba',
        variant: 'destructive'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const reinitializeNotifications = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await initializePushNotifications();
      } else {
        await initializeWebPushNotifications();
      }
      await loadPushTokens();
    } catch (error) {
      console.error('Error reinitializing notifications:', error);
    }
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'granted': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Monitor className="h-4 w-4" />;
      case 'ios':
      case 'android': return <Smartphone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Notificaciones</h1>
          <p className="text-muted-foreground">
            Envía notificaciones y gestiona las configuraciones push del sistema
          </p>
        </div>
      </div>

      {canSendNotifications ? (
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Notificaciones
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración Push
            </TabsTrigger>
          </TabsList>

          {/* Tab: Enviar Notificaciones */}
          <TabsContent value="send" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nueva Notificación</CardTitle>
                <CardDescription>
                  Crea y envía notificaciones a todos los usuarios o grupos específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información de notificaciones push */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Notificaciones Push Activadas
                    </h4>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Las notificaciones se enviarán tanto dentro de la aplicación como notificaciones push del sistema operativo, 
                    permitiendo que los usuarios las reciban aunque no estén usando la aplicación.
                  </p>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de la notificación"
                    maxLength={100}
                  />
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Contenido del mensaje..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/500 caracteres
                  </p>
                </div>

                {/* Destinatarios */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinatarios</label>
                  <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Todos los usuarios
                        </div>
                      </SelectItem>
                      <SelectItem value="role_based">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Por rol
                        </div>
                      </SelectItem>
                      <SelectItem value="specific">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Usuarios específicos
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selección de roles */}
                {recipientType === 'role_based' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Roles</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={selectedRoles.includes(role.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRoles([...selectedRoles, role.id]);
                              } else {
                                setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                              }
                            }}
                          />
                          <label htmlFor={`role-${role.id}`} className="text-sm">
                            {role.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selección de usuarios específicos */}
                {recipientType === 'specific' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuarios</label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <label htmlFor={`user-${user.id}`} className="text-sm flex items-center gap-2">
                            {user.username} ({user.email})
                            {user.role && (
                              <Badge variant="outline" className="text-xs">
                                {user.role.name}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prioridad */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridad</label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon('low')}
                          Baja
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon('medium')}
                          Media
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon('high')}
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon('urgent')}
                          Urgente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón enviar */}
                <Button 
                  onClick={handleSendNotification}
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configuración Push */}
          <TabsContent value="config" className="space-y-6">
            {/* Estado actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPlatformIcon(platform)}
                  Estado actual - Plataforma: {platform}
                </CardTitle>
                <CardDescription>
                  Información sobre el estado de las notificaciones en este dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPermissionIcon(permissions.receive)}
                    <div>
                      <p className="font-medium">Permisos de notificaciones</p>
                      <p className="text-sm text-muted-foreground">
                        Estado: {permissions.receive}
                      </p>
                    </div>
                  </div>
                  <Badge variant={permissions.receive === 'granted' ? 'default' : 'destructive'}>
                    {permissions.receive === 'granted' ? 'Activas' : 'Inactivas'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Token de registro</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {registrationToken ? 
                          `${registrationToken.substring(0, 30)}...` : 
                          'No registrado'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={registrationToken ? 'default' : 'secondary'}>
                    {registrationToken ? 'Registrado' : 'Pendiente'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button onClick={reinitializeNotifications} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reinicializar
                  </Button>
                  <Button 
                    onClick={sendTestNotification} 
                    disabled={!registrationToken || testLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {testLoading ? 'Enviando...' : 'Probar Notificación'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tokens registrados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tokens Push Registrados
                </CardTitle>
                <CardDescription>
                  Lista de todos los dispositivos registrados para recibir notificaciones push
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokensLoading ? (
                  <div className="text-center py-4">Cargando tokens...</div>
                ) : pushTokens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay tokens registrados</p>
                    <p className="text-sm">Los usuarios deben permitir notificaciones para aparecer aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pushTokens.map((token, index) => (
                      <div key={token.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getPlatformIcon(token.device_type)}
                          <div>
                            <p className="font-medium">
                              {token.user?.username || token.user?.email || `Usuario ${token.user || 'Anónimo'}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Plataforma: {token.device_type} | Registrado: {new Date(token.createdAt || token.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={token.is_active ? 'default' : 'secondary'}>
                          {token.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <Button onClick={loadPushTokens} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar lista
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información sobre el API Push Token */}
            <Card>
              <CardHeader>
                <CardTitle>¿Para qué se usa el API Push Token?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">El API Push Token permite:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Notificaciones offline:</strong> Enviar notificaciones aunque el usuario no esté logueado en la aplicación</li>
                    <li><strong>Notificaciones inmediatas:</strong> Recibir alertas importantes del sistema operativo</li>
                    <li><strong>Múltiples dispositivos:</strong> Un usuario puede recibir notificaciones en varios dispositivos</li>
                    <li><strong>Mejor experiencia:</strong> Las notificaciones aparecen como notificaciones nativas del SO</li>
                    <li><strong>Persistencia:</strong> Las notificaciones quedan guardadas en el centro de notificaciones</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Flujo de funcionamiento:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>El usuario permite notificaciones</li>
                    <li>Se genera un token único para el dispositivo</li>
                    <li>El token se guarda en la base de datos vinculado al usuario</li>
                    <li>Cuando se envía una notificación administrativa, también se envía como push notification</li>
                    <li>El usuario recibe la notificación aunque la app esté cerrada</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>Solo administradores pueden acceder a esta funcionalidad.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Puedes ver esta página, pero no tienes permisos para enviar notificaciones.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminNotifications;