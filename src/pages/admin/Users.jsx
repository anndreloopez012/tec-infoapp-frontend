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
  ArrowDown,
  Building2,
  Check,
  ChevronsUpDown
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { UserService } from '@/services/userService.js';
import { RoleService } from '@/services/roleService.js';
import { UserTypeService } from '@/services/userTypeService.js';
import { companyService } from '@/services/catalogServices';
import { useAuth } from '@/context/AuthContext';

const columnHelper = createColumnHelper();

const Users = () => {
  const { hasPermission } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    type_user: '',
    company: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
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
      
      // Load roles, user types and companies in parallel
      const [rolesResult, userTypesResult, companiesResult] = await Promise.all([
        RoleService.getRoles(),
        UserTypeService.getUserTypes(),
        companyService.getAll({ pageSize: 1000 })
      ]);
      
      console.log('🔧 Roles result:', rolesResult);
      console.log('🔧 UserTypes result:', userTypesResult);
      console.log('🔧 Companies result:', companiesResult);
      
      if (rolesResult.success) {
        console.log('🔧 Setting roles:', rolesResult.data);
        setRoles(rolesResult.data);
      }
      
      if (userTypesResult.success) {
        console.log('🔧 Setting userTypes:', userTypesResult.data);
        setUserTypes(userTypesResult.data);
      }

      if (companiesResult.data) {
        console.log('🔧 Setting companies:', companiesResult.data);
        setCompanies(companiesResult.data);
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

  // Clear form errors
  const clearFormErrors = () => {
    setFormErrors({
      username: '',
      email: '',
      password: '',
      role: ''
    });
  };

  // Validate form fields
  const validateForm = (isCreate = false) => {
    const errors = {
      username: '',
      email: '',
      password: '',
      role: ''
    };
    let isValid = true;

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
      isValid = false;
    } else if (formData.username.trim().length < 3) {
      errors.username = 'El usuario debe tener al menos 3 caracteres';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Ingresa un email válido';
      isValid = false;
    }

    // Password validation (only for create)
    if (isCreate) {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
        isValid = false;
      }
    }

    // Role validation
    if (!formData.role) {
      errors.role = 'El rol es requerido';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Dialog handlers
  const handleCreateUser = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: '',
      type_user: '',
      company: ''
    });
    clearFormErrors();
    setCompanyPopoverOpen(false);
    setIsCreateOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      role: user.role?.id?.toString() || '',
      type_user: user.type_user?.id?.toString() || '',
      company: user.company?.id?.toString() || user.company?.documentId || ''
    });
    clearFormErrors();
    setCompanyPopoverOpen(false);
    setIsEditOpen(true);
  };

  const handleSaveUser = async () => {
    // Validate form before submission
    if (!validateForm(isCreateOpen)) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
      });
      return;
    }

    try {
      setDialogLoading(true);

      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role ? parseInt(formData.role) : null,
        type_user: formData.type_user ? parseInt(formData.type_user) : null,
        company: formData.company || null
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
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Usuario */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="username" className={cn("sm:text-right font-medium", formErrors.username && "text-destructive")}>
                Usuario <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                  }}
                  className={cn(formErrors.username && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Nombre de usuario"
                />
                {formErrors.username && (
                  <p className="text-sm text-destructive">{formErrors.username}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="email" className={cn("sm:text-right font-medium", formErrors.email && "text-destructive")}>
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  className={cn(formErrors.email && "border-destructive focus-visible:ring-destructive")}
                  placeholder="correo@ejemplo.com"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="password" className={cn("sm:text-right font-medium", formErrors.password && "text-destructive")}>
                Contraseña <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                  }}
                  className={cn(formErrors.password && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Contraseña"
                />
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>
            </div>

            {/* Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="role" className={cn("sm:text-right font-medium", formErrors.role && "text-destructive")}>
                Rol <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, role: value });
                    if (formErrors.role) setFormErrors({ ...formErrors, role: '' });
                  }}
                >
                  <SelectTrigger className={cn(formErrors.role && "border-destructive focus-visible:ring-destructive")}>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-destructive">{formErrors.role}</p>
                )}
              </div>
            </div>

            {/* Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="type_user" className="sm:text-right font-medium">
                Tipo
              </Label>
              <Select 
                value={formData.type_user} 
                onValueChange={(value) => setFormData({ ...formData, type_user: value })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.Tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa con filtro */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="company" className="sm:text-right font-medium">
                Empresa
              </Label>
              <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyPopoverOpen}
                    className="sm:col-span-3 justify-between font-normal"
                  >
                    <span className="truncate">
                      {formData.company
                        ? companies.find((c) => (c.documentId || c.id?.toString()) === formData.company)?.name || 'Seleccionar empresa'
                        : 'Seleccionar empresa'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar empresa..." />
                    <CommandList>
                      <CommandEmpty>No se encontró empresa.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setFormData({ ...formData, company: '' });
                            setCompanyPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.company ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Sin empresa
                        </CommandItem>
                        {companies.map((company) => (
                          <CommandItem
                            key={company.documentId || company.id}
                            value={company.name}
                            onSelect={() => {
                              setFormData({ ...formData, company: company.documentId || company.id?.toString() });
                              setCompanyPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.company === (company.documentId || company.id?.toString()) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateOpen(false)}
              disabled={dialogLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveUser}
              disabled={dialogLoading}
              className="w-full sm:w-auto"
            >
              {dialogLoading ? 'Guardando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Usuario */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-username" className={cn("sm:text-right font-medium", formErrors.username && "text-destructive")}>
                Usuario <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (formErrors.username) setFormErrors({ ...formErrors, username: '' });
                  }}
                  className={cn(formErrors.username && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Nombre de usuario"
                />
                {formErrors.username && (
                  <p className="text-sm text-destructive">{formErrors.username}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-email" className={cn("sm:text-right font-medium", formErrors.email && "text-destructive")}>
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  className={cn(formErrors.email && "border-destructive focus-visible:ring-destructive")}
                  placeholder="correo@ejemplo.com"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-password" className="sm:text-right font-medium">
                Nueva Contraseña
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para mantener actual"
                />
                <p className="text-xs text-muted-foreground">Opcional - solo si desea cambiar la contraseña</p>
              </div>
            </div>

            {/* Rol */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-role" className={cn("sm:text-right font-medium", formErrors.role && "text-destructive")}>
                Rol <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, role: value });
                    if (formErrors.role) setFormErrors({ ...formErrors, role: '' });
                  }}
                >
                  <SelectTrigger className={cn(formErrors.role && "border-destructive focus-visible:ring-destructive")}>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-destructive">{formErrors.role}</p>
                )}
              </div>
            </div>

            {/* Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-type_user" className="sm:text-right font-medium">
                Tipo
              </Label>
              <Select 
                value={formData.type_user} 
                onValueChange={(value) => setFormData({ ...formData, type_user: value })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {userTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.Tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa con filtro */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-company" className="sm:text-right font-medium">
                Empresa
              </Label>
              <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyPopoverOpen}
                    className="sm:col-span-3 justify-between font-normal"
                  >
                    <span className="truncate">
                      {formData.company
                        ? companies.find((c) => (c.documentId || c.id?.toString()) === formData.company)?.name || 'Seleccionar empresa'
                        : 'Seleccionar empresa'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar empresa..." />
                    <CommandList>
                      <CommandEmpty>No se encontró empresa.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setFormData({ ...formData, company: '' });
                            setCompanyPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.company ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Sin empresa
                        </CommandItem>
                        {companies.map((company) => (
                          <CommandItem
                            key={company.documentId || company.id}
                            value={company.name}
                            onSelect={() => {
                              setFormData({ ...formData, company: company.documentId || company.id?.toString() });
                              setCompanyPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.company === (company.documentId || company.id?.toString()) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              disabled={dialogLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveUser}
              disabled={dialogLoading}
              className="w-full sm:w-auto"
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