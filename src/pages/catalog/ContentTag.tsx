import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { contentTagService } from '@/services/catalogServices';
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
import { Tag } from 'lucide-react';

export const ContentTag: React.FC = () => {
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
  const canCreate = hasPermission('content-tag.create');
  const canEdit = hasPermission('content-tag.update');
  const canDelete = hasPermission('content-tag.delete');
  const canViewAll = hasPermission('content-tag.find');

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📋 [ContentTag] Cargando datos desde API: content-tag');
      
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        searchFields: ['name', 'slug', 'description'],
      };

      if (showOnlyOwn && user?.id) {
        params.createdBy = user.id;
      }

      console.log('📋 [ContentTag] Parámetros de consulta:', params);
      const response = await contentTagService.getAll(params);
      console.log('📋 [ContentTag] Respuesta de API:', response);
      
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
      console.error('❌ [ContentTag] Error:', error);
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
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{row.original.attributes?.name || 'N/A'}</Badge>
          </div>
        ),
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
        accessorKey: 'attributes.color',
        header: 'Color',
        cell: ({ row }) => {
          const color = row.original.attributes?.color;
          return color ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">{color}</span>
            </div>
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
      placeholder: 'Nombre del tag',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text' as const,
      required: true,
      placeholder: 'slug-del-tag',
      description: 'Identificador único para URLs',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Descripción del tag',
    },
    {
      name: 'color',
      label: 'Color',
      type: 'text' as const,
      required: false,
      placeholder: '#FF5733',
      description: 'Código hexadecimal del color',
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
        response = await contentTagService.update(editingItem.id, formData);
      } else {
        response = await contentTagService.create(formData);
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
      const response = await contentTagService.delete(itemToDelete.id);
      
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
        title="Tags de Contenido"
      />

      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        title={editingItem ? 'Editar Tag' : 'Nuevo Tag'}
        description={editingItem ? 'Modifica los datos del tag' : 'Completa el formulario para crear un nuevo tag'}
        fields={formFields}
        defaultValues={editingItem ? editingItem.attributes : {}}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el tag.
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

export default ContentTag;
