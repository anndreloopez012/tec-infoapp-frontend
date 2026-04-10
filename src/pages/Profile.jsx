import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../hooks/useRoles';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '../config/api';
import userService from '../services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Crown, 
  Edit,
  Save,
  X,
  UserCheck,
  Clock,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, isLoading, logout } = useAuth();
  const { getRoleLabelForUser, getUserType } = useRoles();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
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

  const validateEmailUnique = async (email) => {
    try {
      const response = await fetch(buildApiUrl(`users?filters[email][$eq]=${encodeURIComponent(email)}`), {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      const data = await response.json();
      return data.length === 0;
    } catch (error) {
      console.error('Error validando email:', error);
      return true;
    }
  };

  const handleSaveProfile = async () => {
    setIsLoadingProfile(true);
    try {
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
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      setIsEditingProfile(false);
      toast({
        title: "Perfil actualizado",
        description: "Nombre de usuario y correo actualizados exitosamente",
      });

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

      await response.json();
      
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

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    if (deleteConfirmation.trim().toUpperCase() !== 'ELIMINAR') {
      toast({
        variant: 'destructive',
        title: 'Confirmación incompleta',
        description: 'Escribe ELIMINAR para confirmar la eliminación definitiva de tu cuenta.',
      });
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await userService.deleteUser(user.id);

      if (!result.success) {
        throw new Error(result.error || 'No se pudo eliminar la cuenta');
      }

      setDeleteDialogOpen(false);
      logout();
      navigate('/eliminar-cuenta');

      toast({
        title: 'Cuenta eliminada',
        description: 'Tu cuenta fue eliminada correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la cuenta',
        description: error.message || 'Intenta nuevamente o contacta al administrador.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            Mi Perfil
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="border border-border shadow-xl bg-card">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-lg">
                  <AvatarImage src="" alt={user.username} />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* User Info */}
              <div className="text-center md:text-left flex-1 space-y-3">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="bg-success h-3 w-3 rounded-full"></div>
                  <h2 className="text-3xl font-bold text-foreground">
                    {user.username}
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="h-5 w-5 text-primary" />
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="shadow-lg border border-border bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl text-card-foreground">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-6 w-6 text-primary" />
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
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    Nombre de Usuario
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={editData.username}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                      className="h-12 text-base"
                      placeholder="Ingresa tu nombre de usuario"
                    />
                  ) : (
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <span className="text-base font-medium text-foreground">
                        {user.username}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    Correo Electrónico
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      className="h-12 text-base"
                      placeholder="Ingresa tu correo electrónico"
                    />
                  ) : (
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <span className="text-base font-medium text-foreground">
                        {user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Perfil */}
              {API_CONFIG.FEATURES.editPerfil && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  {!isEditingProfile ? (
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      variant="default"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleCancelEdit}
                        variant="secondary"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoadingProfile}
                        variant="default"
                        className="min-w-[140px]"
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
          <Card className="shadow-lg border border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl text-card-foreground">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                Detalles de la Cuenta
              </CardTitle>
              <CardDescription className="text-base">
                Información sobre tu rol y estado de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                    Permisos y Estado
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium shadow-lg">
                      <Crown className="h-4 w-4 mr-2" />
                      {getRoleLabelForUser()}
                    </Badge>
                    <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg">
                      <Shield className="h-4 w-4 mr-2" />
                      {getUserType()}
                    </Badge>
                    <Badge className="bg-success text-success-foreground px-4 py-2 text-sm font-medium shadow-lg">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Verificado
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Miembro desde
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-base font-medium text-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Última actualización
                    </Label>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-base font-medium text-foreground">
                        {formatDate(user.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-lg border border-border bg-card lg:col-span-2">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl text-card-foreground">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Lock className="h-6 w-6 text-destructive" />
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
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Contraseña Actual
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="h-12 text-base pr-12"
                        placeholder="Contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Nueva Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="h-12 text-base pr-12"
                        placeholder="Nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
                      Confirmar Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="h-12 text-base pr-12"
                        placeholder="Confirmar contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoadingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    variant="destructive"
                    className="min-w-[180px]"
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

          <Card className="shadow-lg border border-destructive/30 bg-card lg:col-span-2">
            <CardHeader className="border-b border-destructive/20">
              <CardTitle className="flex items-center gap-3 text-xl text-card-foreground">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                Zona de Peligro
              </CardTitle>
              <CardDescription className="text-base">
                La eliminación de cuenta es definitiva y removerá tu acceso a Tec Community.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  Si eliminas tu cuenta perderás el acceso a tu perfil, preferencias y recursos asociados. Parte de la
                  información técnica o de auditoría podría conservarse temporalmente por motivos legales, de seguridad
                  u operativos.
                </p>
                <Button
                  variant="destructive"
                  className="min-w-[220px]"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Cuenta
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                También puedes consultar las instrucciones públicas en{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => navigate('/eliminar-cuenta')}
                >
                  Cómo Eliminar Mi Cuenta
                </button>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta de forma definitiva</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Esta acción no se puede deshacer. Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo.
              </span>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="mt-3"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmation('');
                setDeleteDialogOpen(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteAccount();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? 'Eliminando...' : 'Confirmar Eliminación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
