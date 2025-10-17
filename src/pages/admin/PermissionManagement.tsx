import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { PermissionService } from '@/services/permissionService';
import { RoleService } from '@/services/roleService';
import { Shield, Save, ChevronDown, ChevronRight, Users, Database, Building2, FileText, Globe, List, FolderOpen, ShoppingCart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface Permission {
  id: number | string;
  action: string;
  subject: string;
  controller?: string;
  conditions: any;
  inverted: boolean;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: number;
  name: string;
  type: string;
  permissions?: Permission[];
}

interface PermissionGroup {
  category: string;
  displayName: string;
  icon: React.ReactNode;
  permissions: Permission[];
  expanded: boolean;
}

const PermissionManagement = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const loadPermissions = async () => {
    try {
      console.log('🔄 Cargando todos los permisos disponibles...');
      const response = await PermissionService.getPermissions();
      
      if (response.success) {
        // Usar los permisos que vienen del servicio
        const allPermissions = response.data || response.permissions || [];
        console.log('✅ Permisos disponibles cargados:', allPermissions.length);
        console.log('📋 DEBUG - Permisos disponibles:', allPermissions);
        
        // Asegurar que todos los permisos tengan la propiedad enabled
        const permissionsWithEnabled = allPermissions.map(p => ({
          ...p,
          enabled: p.enabled || false
        }));
        
        setPermissions(permissionsWithEnabled);
      } else {
        throw new Error(response.error || 'Error al cargar permisos');
      }
    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos disponibles",
        variant: "destructive"
      });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      console.log('🔄 Cargando roles...');
      const response = await RoleService.getRoles();
      
      if (response.success) {
        setRoles(response.data || []);
        console.log('✅ Roles cargados:', response.data?.length || 0);
      } else {
        throw new Error(response.error || 'Error al cargar roles');
      }
    } catch (error) {
      console.error('❌ Error loading roles:', error);
      setRoles([]);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      console.log('🔄 Cargando permisos del rol:', roleId);
      const response = await PermissionService.getRolePermissions(roleId);
      
      if (response.success) {
        // Los datos ya vienen transformados del servicio
        const rolePermissions = response.data || [];
        console.log('✅ Permisos del rol cargados:', rolePermissions.length);
        console.log('📋 DEBUG - Permisos del rol:', rolePermissions);
        
        setRolePermissions(rolePermissions);
      } else {
        throw new Error(response.error || 'Error al cargar permisos del rol');
      }
    } catch (error) {
      console.error('❌ Error loading role permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos del rol",
        variant: "destructive"
      });
      setRolePermissions([]);
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    
    setSaving(true);
    try {
      console.log('💾 Guardando permisos del rol:', selectedRole.id);
      
      // Filtrar solo los permisos habilitados para enviar sus IDs
      const enabledPermissionIds = rolePermissions
        .filter(p => p.enabled)
        .map(p => p.id);
      
      console.log('📝 IDs de permisos habilitados a guardar:', enabledPermissionIds);
      
      const response = await PermissionService.updateRolePermissions(selectedRole.id, enabledPermissionIds);
      
      if (response.success) {
        toast({
          title: "Permisos actualizados",
          description: "Los permisos del rol han sido guardados exitosamente"
        });
      } else {
        throw new Error(response.error || 'Error al guardar permisos');
      }
    } catch (error) {
      console.error('❌ Error saving role permissions:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permission: Permission) => {
    setRolePermissions(prev => {
      const exists = prev.find(p => p.id === permission.id);
      if (exists) {
        // Si existe, lo removemos o cambiamos su estado
        return prev.map(p => 
          p.id === permission.id 
            ? { ...p, enabled: !p.enabled }
            : p
        );
      } else {
        // Si no existe, lo agregamos como habilitado
        return [...prev, { ...permission, enabled: true }];
      }
    });
  };

  const toggleGroupPermissions = (groupPermissions: Permission[]) => {
    const allEnabled = groupPermissions.every(p => {
      const existing = rolePermissions.find(rp => rp.id === p.id);
      return existing && existing.enabled;
    });
    
    setRolePermissions(prev => {
      let newPermissions = [...prev];
      
      groupPermissions.forEach(gp => {
        const existingIndex = newPermissions.findIndex(rp => rp.id === gp.id);
        
        if (existingIndex >= 0) {
          // Actualizar existente
          newPermissions[existingIndex] = { ...newPermissions[existingIndex], enabled: !allEnabled };
        } else if (!allEnabled) {
          // Agregar nuevo como habilitado
          newPermissions.push({ ...gp, enabled: true });
        }
      });
      
      return newPermissions;
    });
  };

  const isPermissionGranted = (permission: Permission) => {
    const existingPermission = rolePermissions.find(p => p.id === permission.id);
    return existingPermission?.enabled || false;
  };

  const toggleGroupExpansion = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('company')) return <Building2 className="w-4 h-4" />;
    if (categoryLower.includes('customer')) return <Users className="w-4 h-4" />;
    if (categoryLower.includes('digital-form')) return <FileText className="w-4 h-4" />;
    if (categoryLower.includes('global')) return <Globe className="w-4 h-4" />;
    if (categoryLower.includes('sale-stage')) return <List className="w-4 h-4" />;
    if (categoryLower.includes('project-stage')) return <FolderOpen className="w-4 h-4" />;
    if (categoryLower.includes('project')) return <FolderOpen className="w-4 h-4" />;
    if (categoryLower.includes('sale')) return <ShoppingCart className="w-4 h-4" />;
    if (categoryLower.includes('user')) return <Users className="w-4 h-4" />;
    if (categoryLower.includes('role')) return <Shield className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  };

  const getPermissionGroups = (): PermissionGroup[] => {
    const groups: { [key: string]: Permission[] } = {};
    
    permissions.forEach(permission => {
      // Extraer el nombre de la API del subject
      let category = permission.subject || 'Otros';
      
      // Limpiar el formato de la API para mostrar solo el nombre
      if (category.includes('api::')) {
        const parts = category.split('.');
        if (parts.length >= 2) {
          category = parts[1]; // Tomar la parte del medio (ej: "company" de "api::company.company")
        }
      }
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });

    return Object.entries(groups).map(([category, perms]) => ({
      category,
      displayName: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
      icon: getCategoryIcon(category),
      permissions: perms.sort((a, b) => a.action?.localeCompare(b.action || '') || 0),
      expanded: expandedGroups[category] || false
    }));
  };

  const formatActionName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'find': 'Ver todo',
      'findOne': 'Ver propio',
      'create': 'Crear',
      'update': 'Actualizar',
      'delete': 'Eliminar',
      'count': 'Contar'
    };
    return actionMap[action] || action;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Gestión de Permisos
          </h1>
          <p className="text-muted-foreground">
            Administra permisos granulares para cada rol del sistema
          </p>
        </div>
        
        {selectedRole && (
          <Button 
            onClick={handleSaveRolePermissions}
            disabled={saving}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        )}
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Detalles del Rol</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre del Rol</Label>
                <Select 
                  value={selectedRole?.id.toString() || ''} 
                  onValueChange={(value) => {
                    if (value) {
                      const role = roles.find(r => r.id.toString() === value);
                      setSelectedRole(role || null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol para gestionar permisos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {roles && roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>{role.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {role.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-muted-foreground text-sm">
                        No hay roles disponibles
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedRole && (
                <div>
                  <Label>Descripción</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground">
                      Rol de tipo {selectedRole.type} con {rolePermissions.length} permisos
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Permisos</CardTitle>
            <CardDescription>
              Solo se muestran las acciones relacionadas con rutas disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getPermissionGroups().map((group, groupIndex) => (
              <Collapsible
                key={group.category}
                open={expandedGroups[group.category] || false}
                onOpenChange={() => toggleGroupExpansion(group.category)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      {group.icon}
                      <div>
                        <h3 className="font-medium text-primary">
                          {group.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Define todas las acciones permitidas para el plugin api::{group.category}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupPermissions(group.permissions);
                        }}
                        className="text-xs"
                      >
                        {group.permissions.every(p => isPermissionGranted(p)) ? (
                          <span className="text-blue-600">Desmarcar todos</span>
                        ) : (
                          <span className="text-blue-600">Seleccionar todos</span>
                        )}
                      </Button>
                      {expandedGroups[group.category] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="bg-background border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-sm font-medium uppercase text-muted-foreground">
                        {group.category.toUpperCase()}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={group.permissions.every(p => isPermissionGranted(p))}
                          onCheckedChange={() => toggleGroupPermissions(group.permissions)}
                          id={`select-all-${group.category}`}
                        />
                        <Label 
                          htmlFor={`select-all-${group.category}`}
                          className="text-sm cursor-pointer"
                        >
                          Seleccionar todos
                        </Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {group.permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isPermissionGranted(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                            id={`permission-${permission.id}`}
                          />
                          <Label 
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {formatActionName(permission.action)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {getPermissionGroups().length === 0 && (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron permisos disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Selecciona un rol para comenzar a gestionar sus permisos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PermissionManagement;