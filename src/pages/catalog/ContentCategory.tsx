import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { contentCategoryService } from '@/services/catalogServices';
import { useAuth } from '@/context/AuthContext';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const ContentCategory: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = useAuthPermissions();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyOwn, setShowOnlyOwn] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Permisos
  const canCreate = hasPermission('content-category.create');
  const canEdit = hasPermission('content-category.update');
  const canDelete = hasPermission('content-category.delete');
  const canViewAll = hasPermission('content-category.find');

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📋 [ContentCategory] Cargando datos desde API: content-category');
      
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        searchFields: ['name', 'description', 'slug'],
      };

      if (showOnlyOwn && user?.id) {
        params.createdBy = user.id;
      }

      console.log('📋 [ContentCategory] Parámetros de consulta:', params);
      const response = await contentCategoryService.getAll(params);
      console.log('📋 [ContentCategory] Respuesta de API:', response);
      
      if (response.success) {
        setData(response.data);
        if (response.pagination) {
          setPagination({
            page: response.pagination.page || 1,
            pageSize: response.pagination.pageSize || 10,
            pageCount: response.pagination.pageCount || 1,
            total: response.pagination.total || 0,
          });
        }
      } else {
        toast.error(response.error || 'Error al cargar datos');
      }
    } catch (error) {
      console.error('❌ [ContentCategory] Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination.page, pagination.pageSize, searchQuery, showOnlyOwn]);

  // Columnas de la tabla
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.id}</span>,
      },
      {
        accessorKey: 'attributes.name',
        header: 'Nombre',
        cell: ({ row }) => <span className="font-medium">{row.original.attributes?.name || 'N/A'}</span>,
      },
      {
        accessorKey: 'attributes.slug',
        header: 'Slug',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.attributes?.slug || 'N/A'}</span>,
      },
      {
        accessorKey: 'attributes.description',
        header: 'Descripción',
        cell: ({ row }) => {
          const desc = row.original.attributes?.description;
          return desc ? (
            <span className="text-sm text-muted-foreground line-clamp-2">{desc}</span>
          ) : (
            'N/A'
          );
        },
      },
      {
        accessorKey: 'attributes.createdAt',
        header: 'Fecha de Creación',
        cell: ({ row }) => {
          const date = row.original.attributes?.createdAt;
          return date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A';
        },
      },
    ],
    []
  );

  // Campos del formulario
  const formFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text' as const,
      required: true,
      placeholder: 'Nombre de la categoría',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text' as const,
      required: true,
      placeholder: 'slug-de-la-categoria',
      description: 'Identificador único para URLs',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Descripción de la categoría',
    },
  ];

  // Handlers
  const handleCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      let response;
      if (editingItem) {
        response = await contentCategoryService.update(editingItem.id, formData);
      } else {
        response = await contentCategoryService.create(formData);
      }

      if (response.success) {
        toast.success(response.message);
        loadData();
        setFormOpen(false);
        setEditingItem(null);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await contentCategoryService.delete(itemToDelete.id);
      
      if (response.success) {
        toast.success(response.message);
        loadData();
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <CatalogTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onPageSizeChange={(pageSize) => setPagination({ ...pagination, pageSize, page: 1 })}
        onSearch={setSearchQuery}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        showOwnRecordsToggle={canViewAll}
        showOnlyOwn={showOnlyOwn}
        onToggleOwnRecords={setShowOnlyOwn}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        title="Categorías de Contenido"
      />

      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        title={editingItem ? 'Editar Categoría' : 'Nueva Categoría'}
        description={editingItem ? 'Modifica los datos de la categoría' : 'Completa el formulario para crear una nueva categoría'}
        fields={formFields}
        defaultValues={editingItem ? editingItem.attributes : {}}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentCategory;
