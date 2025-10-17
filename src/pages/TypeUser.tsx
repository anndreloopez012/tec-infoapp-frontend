import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  AlertTriangle,
  FileText,
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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import typeUserService from '@/services/typeUserService';

const columnHelper = createColumnHelper();

// Interfaces
interface TypeUser {
  id: number;
  Tipo: string;
  Descripcion: string;
  createdAt?: string;
  updatedAt?: string;
}

const TypeUser: React.FC = () => {
  const [typeUsers, setTypeUsers] = useState<TypeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTypeUser, setSelectedTypeUser] = useState<TypeUser | null>(null);

  const { toast } = useToast();

  // Estados del formulario
  const [formData, setFormData] = useState({
    Tipo: '',
    Descripcion: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadTypeUsers();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadTypeUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTypeUsers = async () => {
    try {
      setLoading(true);
      const response = await typeUserService.getTypeUsers({
        sort: 'createdAt:desc'
      });
      
      if (response.success) {
        setTypeUsers(response.data || []);
      } else {
        console.error('Error loading type users:', response.error);
        toast({
          title: "Error",
          description: response.error || "Error al cargar tipos de usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading type users:', error);
      toast({
        title: "Error",
        description: "Error al cargar tipos de usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.Tipo.trim() || !formData.Descripcion.trim()) {
        toast({
          title: "Error de validación",
          description: "Todos los campos son requeridos",
          variant: "destructive",
        });
        return;
      }

      const response = await typeUserService.createTypeUser(formData);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Tipo de usuario creado exitosamente",
        });
        setShowCreateDialog(false);
        resetForm();
        loadTypeUsers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al crear tipo de usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating type user:', error);
      toast({
        title: "Error",
        description: "Error al crear tipo de usuario",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedTypeUser || !formData.Tipo.trim() || !formData.Descripcion.trim()) {
        toast({
          title: "Error de validación",
          description: "Todos los campos son requeridos",
          variant: "destructive",
        });
        return;
      }

      const response = await typeUserService.updateTypeUser(selectedTypeUser.id, formData);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Tipo de usuario actualizado exitosamente",
        });
        setShowEditDialog(false);
        setSelectedTypeUser(null);
        resetForm();
        loadTypeUsers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al actualizar tipo de usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating type user:', error);
      toast({
        title: "Error",
        description: "Error al actualizar tipo de usuario",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedTypeUser) return;

      const response = await typeUserService.deleteTypeUser(selectedTypeUser.id);
      
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Tipo de usuario eliminado exitosamente",
        });
        setShowDeleteDialog(false);
        setSelectedTypeUser(null);
        loadTypeUsers();
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al eliminar tipo de usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting type user:', error);
      toast({
        title: "Error",
        description: "Error al eliminar tipo de usuario",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      Tipo: '',
      Descripcion: ''
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (typeUser: TypeUser) => {
    setSelectedTypeUser(typeUser);
    setFormData({
      Tipo: typeUser.Tipo || '',
      Descripcion: typeUser.Descripcion || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (typeUser: TypeUser) => {
    setSelectedTypeUser(typeUser);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              ID
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <span className="font-mono text-sm">#{info.getValue() as number}</span>
        ),
      }),
      columnHelper.accessor('Tipo', {
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
          <span className="font-medium">{info.getValue() as string}</span>
        ),
      }),
      columnHelper.accessor('Descripcion', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Descripción
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <span className="text-sm text-muted-foreground max-w-xs truncate">
            {info.getValue() as string}
          </span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              Fecha Creación
              {column.getIsSorted() === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
              {!column.getIsSorted() && <ArrowUpDown className="ml-2 h-4 w-4" />}
            </Button>
          )
        },
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(info.getValue() as string)}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => {
          const typeUser = info.row.original as TypeUser;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(typeUser)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openDeleteDialog(typeUser)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: typeUsers,
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
    pageCount: Math.ceil(typeUsers.length / pageSize),
  });

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Tipos de Usuario</h1>
          
          <Button 
            onClick={openCreateDialog}
            className="bg-primary hover:bg-primary/90 fixed right-4 top-20 z-10 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Tipo
          </Button>
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
                  placeholder="Buscar tipos de usuario..."
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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tipos de Usuario</CardTitle>
            <CardDescription>
              Gestiona y administra todos los tipos de usuario del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                                index === 0 ? "ID" :
                                index === 1 ? "Tipo" :
                                index === 2 ? "Descripción" :
                                index === 3 ? "Fecha Creación" :
                                index === 4 ? "Acciones" : ""
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
                          <div className="text-center">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-sm font-semibold">No hay tipos de usuario</h3>
                            <p className="text-sm text-muted-foreground">
                              {globalFilter ? 'No se encontraron resultados para tu búsqueda.' : 'Comienza creando un nuevo tipo de usuario.'}
                            </p>
                          </div>
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
                    de {table.getFilteredRowModel().rows.length} registros
                  </p>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Filas por página</p>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 50, 100].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Tipo de Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo tipo de usuario al sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.Tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, Tipo: e.target.value }))}
                placeholder="Ej: Cliente, Proveedor, etc."
              />
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.Descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, Descripcion: e.target.value }))}
                placeholder="Describe el tipo de usuario..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Crear Tipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tipo de Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del tipo de usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Input
                id="edit-tipo"
                value={formData.Tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, Tipo: e.target.value }))}
                placeholder="Ej: Cliente, Proveedor, etc."
              />
            </div>
            <div>
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.Descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, Descripcion: e.target.value }))}
                placeholder="Describe el tipo de usuario..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el tipo de usuario "{selectedTypeUser?.Tipo}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TypeUser;