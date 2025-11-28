import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { RoleService } from '@/services/roleService';
import { Shield, Plus, Search, Edit, Trash2, Users, MoreVertical, Crown, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface Role {
  id: number;
  name: string;
  type: string;
  description?: string;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

const RoleManagement = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleStats, setRoleStats] = useState({
    total: 0,
    system_roles: 0,
    custom_roles: 0
  });

  const [newRole, setNewRole] = useState({
    name: '',
    type: '',
    description: ''
  });

  useEffect(() => {
    loadRoles();
    loadRoleStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadRoles();
      loadRoleStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadRoles = async () => {
    try {
      const response = await RoleService.getRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async () => {
    try {
      const stats = await RoleService.getRoleStats();
      setRoleStats(stats);
    } catch (error) {
      console.error('Error loading role stats:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      await RoleService.createRole(newRole);
      
      toast({
        title: "Rol creado",
        description: "El rol ha sido creado exitosamente"
      });
      
      setIsCreateDialogOpen(false);
      setNewRole({
        name: '',
        type: '',
        description: ''
      });
      
      loadRoles();
      loadRoleStats();
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el rol",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      await RoleService.updateRole(selectedRole.id, {
        name: selectedRole.name,
        type: selectedRole.type,
        description: selectedRole.description
      });
      
      toast({
        title: "Rol actualizado",
        description: "Los cambios han sido guardados"
      });
      
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      loadRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este rol?')) return;
    
    try {
      await RoleService.deleteRole(roleId);
      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado exitosamente"
      });
      loadRoles();
      loadRoleStats();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateRole = async (roleId: number, currentName: string) => {
    const newName = prompt('Nombre para el rol duplicado:', `${currentName} (Copia)`);
    if (!newName) return;

    try {
      await RoleService.duplicateRole(roleId, newName);
      toast({
        title: "Rol duplicado",
        description: "El rol ha sido duplicado exitosamente"
      });
      loadRoles();
      loadRoleStats();
    } catch (error) {
      console.error('Error duplicating role:', error);
      toast({
        title: "Error",
        description: "No se pudo duplicar el rol",
        variant: "destructive"
      });
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleTypeIcon = (type: string) => {
    switch (type) {
      case 'authenticated':
        return <Users className="w-4 h-4" />;
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'super_admin':
        return <Shield className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getRoleTypeBadge = (type: string) => {
    const config = {
      'authenticated': { variant: 'secondary' as const, label: 'Usuario' },
      'admin': { variant: 'default' as const, label: 'Administrador' },
      'super_admin': { variant: 'destructive' as const, label: 'Super Admin' },
      'custom': { variant: 'outline' as const, label: 'Personalizado' }
    };

    const { variant, label } = config[type as keyof typeof config] || config.custom;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Gestión de Roles
          </h1>
          <p className="text-muted-foreground">
            Administra roles y permisos del sistema
          </p>
        </div>
        
        {hasPermission('api::users-permissions.roles-permissions.createRole') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Rol
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>
                Define un nuevo rol con permisos específicos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del rol</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Nombre del rol"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  value={newRole.type}
                  onChange={(e) => setNewRole({ ...newRole, type: e.target.value })}
                  placeholder="Tipo de rol (ej: custom)"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Descripción del rol..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRole}>
                Crear Rol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles del Sistema</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{roleStats.system_roles}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Personalizados</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{roleStats.custom_roles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar roles por nombre, tipo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role, index) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getRoleTypeIcon(role.type)}
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission('api::users-permissions.roles-permissions.updateRole') && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRole(role);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {hasPermission('api::users-permissions.roles-permissions.createRole') && (
                        <DropdownMenuItem
                          onClick={() => handleDuplicateRole(role.id, role.name)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                      )}
                      {(hasPermission('api::users-permissions.roles-permissions.updateRole') || hasPermission('api::users-permissions.roles-permissions.createRole')) && (
                        <DropdownMenuSeparator />
                      )}
                      {hasPermission('api::users-permissions.roles-permissions.deleteRole') && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600"
                          disabled={['authenticated', 'public'].includes(role.type)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getRoleTypeBadge(role.type)}
                  {role.users_count !== undefined && (
                    <Badge variant="outline">
                      {role.users_count} usuario{role.users_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {role.description && (
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Creado: {formatDate(role.created_at)}</div>
                  {role.updated_at && role.updated_at !== role.created_at && (
                    <div>Actualizado: {formatDate(role.updated_at)}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron roles</p>
        </div>
      )}

      {/* Edit Role Dialog */}
      {selectedRole && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
              <DialogDescription>
                Modifica la información del rol
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre del rol</Label>
                <Input
                  id="edit-name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-type">Tipo</Label>
                <Input
                  id="edit-type"
                  value={selectedRole.type}
                  onChange={(e) => setSelectedRole({ ...selectedRole, type: e.target.value })}
                  disabled={['authenticated', 'public'].includes(selectedRole.type)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={selectedRole.description || ''}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRole}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RoleManagement;