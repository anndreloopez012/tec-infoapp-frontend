import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Upload,
  Download,
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
  FileSpreadsheet
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
import { cn } from '@/lib/utils';

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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tower: '',
    office: '',
    password: '',
    role: '',
    type_user: '',
    isActive: 'true'
  });

  const [importFormData, setImportFormData] = useState({
    role: '',
    isActive: 'true',
    fileName: ''
  });
  const [importRows, setImportRows] = useState([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
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

  // Clear form errors
  const clearFormErrors = () => {
    setFormErrors({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: ''
    });
  };

  // Validate form fields
  const validateForm = (isCreate = false) => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: ''
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = 'El nombre es requerido';
      isValid = false;
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'El apellido es requerido';
      isValid = false;
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'El apellido debe tener al menos 2 caracteres';
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
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      tower: '',
      office: '',
      password: '',
      role: '',
      type_user: '',
      isActive: 'true'
    });
    clearFormErrors();
    setIsCreateOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      tower: user.tower || '',
      office: user.office || '',
      password: '', // Don't pre-fill password
      role: user.role?.id?.toString() || '',
      type_user: user.type_user?.id?.toString() || '',
      isActive: user.blocked ? 'false' : 'true'
    });
    clearFormErrors();
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
        username: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tower: formData.tower.trim(),
        office: formData.office.trim(),
        role: formData.role ? parseInt(formData.role) : null,
        type_user: formData.type_user ? parseInt(formData.type_user) : null,
        blocked: formData.isActive !== 'true',
        confirmed: true
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

  const CSV_TEMPLATE = `nombre,apellido,telefono,correo,torre,oficina
Ana,Perez,5555-1234,ana.perez@ejemplo.com,Torre 1,Oficina 101
Luis,Gomez,5555-5678,luis.gomez@ejemplo.com,Torre 2,Oficina 205`;

  const normalizeCsvValue = (value = '') =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const parseCsvText = (text) => {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i += 1;
        row.push(current);
        if (row.some((cell) => cell.trim() !== '')) {
          rows.push(row.map((cell) => cell.trim()));
        }
        row = [];
        current = '';
      } else {
        current += char;
      }
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row.map((cell) => cell.trim()));
      }
    }

    return rows;
  };

  const mapCsvRowsToUsers = (csvRows) => {
    if (!csvRows.length) {
      throw new Error('El archivo CSV está vacío');
    }

    const headers = csvRows[0].map(normalizeCsvValue);
    const headerMap = {
      nombre: ['nombre', 'nombres', 'first_name', 'firstname'],
      apellido: ['apellido', 'apellidos', 'last_name', 'lastname'],
      telefono: ['telefono', 'tel', 'phone', 'celular'],
      correo: ['correo', 'email', 'e-mail'],
      torre: ['torre', 'tower'],
      oficina: ['oficina', 'office'],
    };

    const resolveHeaderIndex = (variants) =>
      headers.findIndex((header) => variants.includes(header));

    const indexes = {
      firstName: resolveHeaderIndex(headerMap.nombre),
      lastName: resolveHeaderIndex(headerMap.apellido),
      phone: resolveHeaderIndex(headerMap.telefono),
      email: resolveHeaderIndex(headerMap.correo),
      tower: resolveHeaderIndex(headerMap.torre),
      office: resolveHeaderIndex(headerMap.oficina),
    };

    if ([indexes.firstName, indexes.lastName, indexes.phone, indexes.email, indexes.tower, indexes.office].some((index) => index < 0)) {
      throw new Error('El CSV debe incluir las columnas: nombre, apellido, telefono, correo, torre, oficina');
    }

    return csvRows
      .slice(1)
      .filter((row) => row.some((cell) => cell?.trim()))
      .map((row, index) => ({
        line: index + 2,
        firstName: row[indexes.firstName]?.trim() || '',
        lastName: row[indexes.lastName]?.trim() || '',
        phone: row[indexes.phone]?.trim() || '',
        email: row[indexes.email]?.trim().toLowerCase() || '',
        tower: row[indexes.tower]?.trim() || '',
        office: row[indexes.office]?.trim() || '',
      }))
      .map((row) => {
        if (!row.firstName || !row.lastName || !row.email) {
          throw new Error(`La fila ${row.line} no tiene nombre, apellido o correo completos`);
        }
        return row;
      });
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'usuarios-ejemplo-tec-community.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenImportDialog = () => {
    setImportFormData({
      role: '',
      isActive: 'true',
      fileName: ''
    });
    setImportRows([]);
    setIsImportOpen(true);
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedRows = mapCsvRowsToUsers(parseCsvText(text));
      setImportRows(parsedRows);
      setImportFormData((current) => ({ ...current, fileName: file.name }));
      toast({
        title: 'CSV cargado',
        description: `${parsedRows.length} usuario(s) listos para importar`,
      });
    } catch (error) {
      setImportRows([]);
      setImportFormData((current) => ({ ...current, fileName: '' }));
      toast({
        variant: "destructive",
        title: "CSV inválido",
        description: error.message || 'No se pudo procesar el archivo CSV',
      });
    } finally {
      event.target.value = '';
    }
  };

  const handleImportUsers = async () => {
    if (!importFormData.role) {
      toast({
        variant: "destructive",
        title: "Rol requerido",
        description: "Selecciona el rol que tendrán los usuarios importados",
      });
      return;
    }

    if (!importRows.length) {
      toast({
        variant: "destructive",
        title: "CSV requerido",
        description: "Carga un archivo CSV válido antes de importar",
      });
      return;
    }

    try {
      setImportLoading(true);
      const response = await UserService.importUsersFromCsv(importRows, {
        role: importFormData.role,
        isActive: importFormData.isActive === 'true',
      });

      if (!response.data) {
        throw new Error(response.error || 'No se pudo importar el archivo');
      }

      const result = response.data;
      toast({
        title: result.failed ? 'Importación parcial' : 'Importación completada',
        description: response.message,
      });

      if (result.failed) {
        console.error('Errores en importación CSV:', result.errors);
      }

      setIsImportOpen(false);
      setImportRows([]);
      await loadUsers();
    } catch (error) {
      console.error('Error importing users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'No se pudo importar el CSV',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const getUserInitials = (user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) {
      return fullName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    }
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
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Sin nombre'}
                </p>
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">
                    {user.username || user.email}
                  </p>
                  {(user.tower || user.office) && (
                    <p className="text-xs text-muted-foreground">
                      {[user.tower, user.office].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('phone', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Tel.
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{info.getValue() || 'N/A'}</span>
          </div>
        ),
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
            <div className="fixed right-4 top-20 z-10 flex gap-2">
              <Button 
                variant="outline"
                onClick={handleOpenImportDialog}
                className="shadow-lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Button>
              <Button 
                onClick={handleCreateUser}
                className="bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </div>
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
                                  index === 1 ? "Tel." :
                                  index === 2 ? "Email" :
                                  index === 3 ? "Rol" :
                                  index === 4 ? "Tipo" :
                                  index === 5 ? "Estado" :
                                  index === 6 ? "Fecha Registro" :
                                  index === 7 ? "Acciones" : ""
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="firstName" className={cn("sm:text-right font-medium", formErrors.firstName && "text-destructive")}>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                  }}
                  className={cn(formErrors.firstName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Nombre"
                />
                {formErrors.firstName && (
                  <p className="text-sm text-destructive">{formErrors.firstName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="lastName" className={cn("sm:text-right font-medium", formErrors.lastName && "text-destructive")}>
                Apellido <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                  }}
                  className={cn(formErrors.lastName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Apellido"
                />
                {formErrors.lastName && (
                  <p className="text-sm text-destructive">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="phone" className="sm:text-right font-medium">
                Tel.
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="5555-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="email" className={cn("sm:text-right font-medium", formErrors.email && "text-destructive")}>
                Correo <span className="text-destructive">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="tower" className="sm:text-right font-medium">
                Torre
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="tower"
                  value={formData.tower}
                  onChange={(e) => setFormData({ ...formData, tower: e.target.value })}
                  placeholder="Torre 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="office" className="sm:text-right font-medium">
                Oficina
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="office"
                  value={formData.office}
                  onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                  placeholder="Oficina 101"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="isActive" className="sm:text-right font-medium">
                Activo
              </Label>
              <Select
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-firstName" className={cn("sm:text-right font-medium", formErrors.firstName && "text-destructive")}>
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                  }}
                  className={cn(formErrors.firstName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Nombre"
                />
                {formErrors.firstName && (
                  <p className="text-sm text-destructive">{formErrors.firstName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-lastName" className={cn("sm:text-right font-medium", formErrors.lastName && "text-destructive")}>
                Apellido <span className="text-destructive">*</span>
              </Label>
              <div className="sm:col-span-3 space-y-1">
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                    if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                  }}
                  className={cn(formErrors.lastName && "border-destructive focus-visible:ring-destructive")}
                  placeholder="Apellido"
                />
                {formErrors.lastName && (
                  <p className="text-sm text-destructive">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-phone" className="sm:text-right font-medium">
                Tel.
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="5555-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-email" className={cn("sm:text-right font-medium", formErrors.email && "text-destructive")}>
                Correo <span className="text-destructive">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-tower" className="sm:text-right font-medium">
                Torre
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="edit-tower"
                  value={formData.tower}
                  onChange={(e) => setFormData({ ...formData, tower: e.target.value })}
                  placeholder="Torre 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="edit-office" className="sm:text-right font-medium">
                Oficina
              </Label>
              <div className="sm:col-span-3">
                <Input
                  id="edit-office"
                  value={formData.office}
                  onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                  placeholder="Oficina 101"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="edit-isActive" className="sm:text-right font-medium">
                Activo
              </Label>
              <Select
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
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

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar Usuarios por CSV</DialogTitle>
            <DialogDescription>
              Carga un archivo CSV con nombre, apellido, teléfono, correo, torre y oficina. La empresa se asignará después.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Card className="border-dashed">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  Plantilla de ejemplo para carga masiva
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={downloadCsvTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar ejemplo CSV
                  </Button>
                  <Label
                    htmlFor="users-import-file"
                    className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Cargar archivo CSV
                  </Label>
                  <Input
                    id="users-import-file"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleImportFileChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {importFormData.fileName
                    ? `Archivo cargado: ${importFormData.fileName}`
                    : 'Aún no has cargado un archivo CSV'}
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol para todos los usuarios</Label>
                <Select
                  value={importFormData.role}
                  onValueChange={(value) => setImportFormData((current) => ({ ...current, role: value }))}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label>¿Entrarán activos?</Label>
                <Select
                  value={importFormData.isActive}
                  onValueChange={(value) => setImportFormData((current) => ({ ...current, isActive: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="true">Sí, activos</SelectItem>
                    <SelectItem value="false">No, inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Usuarios listos para importar</span>
                  <Badge variant="secondary">{importRows.length}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Los usuarios importados se crearán sin empresa y con contraseña temporal interna. Luego podrán completar su información restante.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportOpen(false)}
              disabled={importLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImportUsers}
              disabled={importLoading}
              className="w-full sm:w-auto"
            >
              {importLoading ? 'Importando...' : 'Importar usuarios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
