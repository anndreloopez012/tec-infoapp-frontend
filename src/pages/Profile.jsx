import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Crown, 
  Edit,
  Save,
  X,
  Check,
  UserCheck,
  Clock,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const { getRoleLabelForUser, getUserType } = useRoles();
  
  // Estados separados para cada sección
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay datos del usuario disponibles</p>
        </div>
      </div>
    );
  }

  // Función para validar email único
  const validateEmailUnique = async (email) => {
    try {
      const response = await fetch(buildApiUrl(`users?filters[email][$eq]=${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      const data = await response.json();
      return data.length === 0; // true si no existe, false si ya existe
    } catch (error) {
      console.error('Error validando email:', error);
      return true; // Permitir continuar si hay error en la validación
    }
  };

  // Función para guardar perfil (nombre y email)
  const handleSaveProfile = async () => {
    setIsLoadingProfile(true);
    try {
      // Validar email único si cambió
      if (editData.email !== user.email) {
        const isEmailUnique = await validateEmailUnique(editData.email);
        if (!isEmailUnique) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Este correo electrónico ya está en uso por otro usuario",
          });
          setIsLoadingProfile(false);
          return;
        }
      }

      // Llamar API para actualizar perfil
      const response = await fetch(buildApiUrl('users/me'), {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          username: editData.username,
          email: editData.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al actualizar perfil');
      }

      const updatedUser = await response.json();
      
      // Actualizar localStorage y contexto
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      setIsEditingProfile(false);
      toast({
        title: "Perfil actualizado",
        description: "Nombre de usuario y correo actualizados exitosamente",
      });

      // Actualizar datos en el estado local
      Object.assign(user, updatedUser);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Función para cambiar contraseña
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    setIsLoadingPassword(true);
    try {
      // Llamar API para cambiar contraseña
      const response = await fetch(buildApiUrl('auth/change-password'), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          password: passwordData.newPassword,
          currentPassword: passwordData.currentPassword,
          passwordConfirmation: passwordData.confirmPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al cambiar contraseña');
      }

      const result = await response.json();
      
      // Limpiar campos
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al cambiar contraseña",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      username: user.username || '',
      email: user.email || ''
    });
    setIsEditingProfile(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-lg">
                  <AvatarImage src="" alt={user.username} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* User Info */}
              <div className="text-center md:text-left flex-1 space-y-3 text-gray-900 dark:text-gray-100">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="bg-green-500 h-3 w-3 rounded-full"></div>
                  <h2 className="text-3xl font-bold">
                    {user.username}
                  </h2>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-200 flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-300" />
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    Información Personal
                  </CardTitle>
                  <CardDescription className="text-base">
                    Gestiona tu información básica de perfil
                  </CardDescription>
                </div>
                {API_CONFIG.FEATURES.editPerfil && !isEditingProfile && (
                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Nombre de Usuario
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={editData.username}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                      className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ingresa tu nombre de usuario"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Correo Electrónico
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ingresa tu correo electrónico"
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Perfil - Condicionalmente visibles */}
              {API_CONFIG.FEATURES.editPerfil && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  {!isEditingProfile ? (
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      variant="default"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleCancelEdit}
                        variant="secondary"
                        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoadingProfile}
                        variant="default"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                      >
                        {isLoadingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar Perfil
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                Detalles de la Cuenta
              </CardTitle>
              <CardDescription className="text-base">
                Información sobre tu rol y estado de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Role and Type Badges */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    Permisos y Estado
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-sm font-medium shadow-lg">
                      <Crown className="h-4 w-4 mr-2" />
                      {getRoleLabelForUser()}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 text-sm font-medium shadow-lg">
                      <Shield className="h-4 w-4 mr-2" />
                      {getUserType()}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-medium shadow-lg">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verificado
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Miembro desde
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Última actualización
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {formatDate(user.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-lg border-0 lg:col-span-2">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-base">
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Contraseña Actual
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500 pr-12"
                        placeholder="Contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Nueva Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500 pr-12"
                        placeholder="Nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Confirmar Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="h-12 text-base border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500 pr-12"
                        placeholder="Confirmar contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón de Contraseña */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoadingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground min-w-[180px]"
                  >
                    {isLoadingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Actualizar Contraseña
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
