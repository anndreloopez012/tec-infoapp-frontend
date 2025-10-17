import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';

import { UserService } from '@/services/userService.js';
import { RoleService } from '@/services/roleService.js';
import { UserTypeService } from '@/services/userTypeService.js';
import { useAuth } from '@/context/AuthContext';

const columnHelper = createColumnHelper();

const Users = () => {
  const { hasPermission } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    type_user: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-refresh users every 10 seconds for real-time updates
  useEffect(() => {
    if (!loading && roles.length > 0 && userTypes.length > 0) {
      const interval = setInterval(() => {
        loadUsers();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [loading, roles.length, userTypes.length]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load roles and user types in parallel
      const [rolesResult, userTypesResult] = await Promise.all([
        RoleService.getRoles(),
        UserTypeService.getUserTypes()
      ]);
      
      console.log('🔧 Roles result:', rolesResult);
      console.log('🔧 UserTypes result:', userTypesResult);
      
      if (rolesResult.success) {
        console.log('🔧 Setting roles:', rolesResult.data);
        setRoles(rolesResult.data);
      }
      
      if (userTypesResult.success) {
        console.log('🔧 Setting userTypes:', userTypesResult.data);
        setUserTypes(userTypesResult.data);
      }
      
      // Load users after roles and types are loaded
      if (rolesResult.success && userTypesResult.success) {
        await loadUsers();
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = {
        page: 1,
        pageSize: 1000, // Load all users for client-side pagination
        sort: 'createdAt:desc'
      };
      
      const response = await UserService.getUsers(params);
      
      console.log('🔧 Response from UserService:', response);
      
      if (response.success) {
        console.log('🔧 Setting users:', response.data);
        console.log('🔧 Users length:', response.data?.length);
        setUsers(response.data || []);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los usuarios",
      });
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await UserService.toggleUserStatus(userId, !currentStatus);
      
      if (response.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, blocked: !currentStatus }
            : user
        ));
        
        toast({
          title: "Usuario actualizado",
          description: `El usuario ha sido ${!currentStatus ? 'bloqueado' : 'desbloqueado'}`,
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }
    
    try {
      const response = await UserService.deleteUser(userId);
      
      if (response.success) {
        // Remove from local state
        setUsers(users.filter(user => user.id !== userId));
        
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario",
      });
    }
  };

  // Dialog handlers
  const handleCreateUser = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: '',
      type_user: ''
    });
    setIsCreateOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      role: user.role?.id?.toString() || '',
      type_user: user.type_user?.id?.toString() || ''
    });
    setIsEditOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setDialogLoading(true);
      
      // Basic validation
      if (!formData.username || !formData.email) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Usuario y email son requeridos",
        });
        return;
      }

      if (isCreateOpen && !formData.password) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La contraseña es requerida para crear un usuario",
        });
        return;
      }

      const userData = {
        username: formData.username,
        email: formData.email,
        role: formData.role ? parseInt(formData.role) : null,
        type_user: formData.type_user ? parseInt(formData.type_user) : null
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      let response;
      if (isCreateOpen) {
        response = await UserService.createUser(userData);
      } else {
        response = await UserService.updateUser(selectedUser.id, userData);
      }

      if (response.success) {
        toast({
          title: isCreateOpen ? "Usuario creado" : "Usuario actualizado",
          description: response.message,
        });
        
        // Close dialogs
        setIsCreateOpen(false);
        setIsEditOpen(false);
        
        // Reload users
        await loadUsers();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el usuario",
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const getUserInitials = (user) => {
    const name = user.username || user.email || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const getUserStatusBadge = (user) => {
    if (user.blocked) {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    return <Badge variant="secondary">Activo</Badge>;
  };

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('username', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Usuario
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar?.url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {user.username || 'Sin nombre'}
                </p>
                {user.firstName && user.lastName && (
                  <p className="text-sm text-muted-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('email', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Email
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('role.name', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Rol
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <Badge variant="outline">
            {info.getValue() || 'Sin rol'}
          </Badge>
        ),
      }),
      columnHelper.accessor('type_user.Tipo', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Tipo
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <Badge variant="secondary">
            {info.getValue() || 'Sin tipo'}
          </Badge>
        ),
      }),
      columnHelper.accessor('blocked', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Estado
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => {
          const user = info.row.original;
          return getUserStatusBadge(user);
        },
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Fecha Registro
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString('es-ES')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission('api::user.user.update') && (
                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  
                  {hasPermission('api::user.user.update') && (
                    <DropdownMenuItem
                      onClick={() => handleToggleUserStatus(user.id, user.blocked)}
                    >
                      {user.blocked ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      ) : (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Bloquear
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  
                  {hasPermission('api::user.user.delete') && (
                    <DropdownMenuItem
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [hasPermission, users]
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize: pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex: 0, pageSize });
        setPageSize(newPagination.pageSize);
      }
    },
    manualPagination: false,
    pageCount: Math.ceil(users.length / pageSize),
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          
          {hasPermission('api::user.user.create') && (
            <Button 
              onClick={handleCreateUser}
              className="bg-primary hover:bg-primary/90 fixed right-4 top-20 z-10 shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios por nombre, email..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Gestiona y administra todos los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Responsive Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="whitespace-nowrap">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className="hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell, index) => (
                              <TableCell 
                                key={cell.id} 
                                className="whitespace-nowrap"
                                data-label={
                                  index === 0 ? "Usuario" :
                                  index === 1 ? "Email" :
                                  index === 2 ? "Rol" :
                                  index === 3 ? "Tipo" :
                                  index === 4 ? "Estado" :
                                  index === 5 ? "Fecha Registro" :
                                  index === 6 ? "Acciones" : ""
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No se encontraron usuarios.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}{' '}
                      de {table.getFilteredRowModel().rows.length} resultados
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Filas por página:</p>
                      <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          table.setPageIndex(0);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[5, 10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          Página {table.getState().pagination.pageIndex + 1} de{' '}
                          {table.getPageCount()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuario
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="col-span-3"
                placeholder="Nombre de usuario"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                placeholder="Contraseña"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type_user" className="text-right">
                Tipo
              </Label>
              <Select 
                value={formData.type_user} 
                onValueChange={(value) => setFormData({ ...formData, type_user: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.Tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateOpen(false)}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveUser}
              disabled={dialogLoading}
            >
              {dialogLoading ? 'Guardando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Usuario
              </Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="col-span-3"
                placeholder="Nombre de usuario"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Nueva Contraseña
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3"
                placeholder="Dejar vacío para mantener actual"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Rol
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type_user" className="text-right">
                Tipo
              </Label>
              <Select 
                value={formData.type_user} 
                onValueChange={(value) => setFormData({ ...formData, type_user: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.Tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveUser}
              disabled={dialogLoading}
            >
              {dialogLoading ? 'Guardando...' : 'Actualizar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;