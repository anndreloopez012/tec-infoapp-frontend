import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { eventAttendanceService } from '@/services/catalogServices';
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

export const EventAttendance: React.FC = () => {
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
  // Permisos (temporalmente deshabilitados)
  const canCreate = true;
  const canEdit = true;
  const canDelete = true;
  const canViewAll = true;

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        searchFields: ['event', 'attendee', 'status'],
      };

      if (showOnlyOwn && (user?.documentId || user?.id)) {
        params.createdByDocumentId = user.documentId || user.id;
      }

      const response = await eventAttendanceService.getAll(params);
      
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
      console.error('Error:', error);
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
        accessorKey: 'attributes.event',
        header: 'Evento',
        cell: ({ row }) => {
          const event = row.original.attributes?.event;
          if (!event) return 'N/A';
          if (typeof event === 'object') {
            return event.data?.attributes?.title || event.data?.attributes?.name || event.title || event.name || 'N/A';
          }
          return event;
        },
      },
      {
        accessorKey: 'attributes.attendee',
        header: 'Asistente',
        cell: ({ row }) => {
          const attendee = row.original.attributes?.attendee;
          if (!attendee) return 'N/A';
          if (typeof attendee === 'object') {
            return attendee.data?.attributes?.name || attendee.data?.attributes?.username || attendee.name || attendee.username || 'N/A';
          }
          return attendee;
        },
      },
      {
        accessorKey: 'attributes.status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.original.attributes?.status;
          const variant = status === 'confirmed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive';
          return <Badge variant={variant}>{status || 'N/A'}</Badge>;
        },
      },
      {
        accessorKey: 'attributes.createdAt',
        header: 'Fecha de Creación',
        cell: ({ row }) => {
          const date = row.original.attributes?.createdAt;
          return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : 'N/A';
        },
      },
    ],
    []
  );

  // Campos del formulario
  const formFields = [
    {
      name: 'event',
      label: 'Evento',
      type: 'text' as const,
      required: true,
      placeholder: 'Nombre del evento',
    },
    {
      name: 'attendee',
      label: 'Asistente',
      type: 'text' as const,
      required: true,
      placeholder: 'Nombre del asistente',
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'text' as const,
      required: true,
      placeholder: 'confirmed, pending, cancelled',
    },
    {
      name: 'notes',
      label: 'Notas',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Notas adicionales',
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
        response = await eventAttendanceService.update(editingItem.documentId || editingItem.id, formData);
      } else {
        response = await eventAttendanceService.create(formData);
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
      const response = await eventAttendanceService.delete(itemToDelete.documentId || itemToDelete.id);
      
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
        title="Asistencia de Eventos"
      />

      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        title={editingItem ? 'Editar Asistencia' : 'Nueva Asistencia'}
        description={editingItem ? 'Modifica los datos de la asistencia' : 'Completa el formulario para registrar una nueva asistencia'}
        fields={formFields}
        defaultValues={editingItem ? editingItem.attributes : {}}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro.
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

export default EventAttendance;
