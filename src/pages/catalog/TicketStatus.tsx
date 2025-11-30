import React, { useState, useEffect } from 'react';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { ticketStatusService } from '@/services/catalogServices';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { toast } from 'sonner';

const TicketStatus = () => {
  const { hasPermission } = useAuthPermissions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canCreate = hasPermission('api::ticket-status.ticket-status.create');
  const canEdit = hasPermission('api::ticket-status.ticket-status.update');
  const canDelete = hasPermission('api::ticket-status.ticket-status.delete');
  const canView = hasPermission('api::ticket-status.ticket-status.find');

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: row.original.color || '#6b7280' }}
          />
          <span className="text-sm text-muted-foreground">{row.original.color || 'Sin color'}</span>
        </div>
      ),
    },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text' as const,
      placeholder: 'Ingrese el nombre del estado',
      required: true,
    },
    {
      name: 'color',
      label: 'Color',
      type: 'color' as const,
      placeholder: '#000000',
      description: 'Color para identificar visualmente el estado',
    },
  ];

  const fetchData = async (page = 1, pageSize = 10, search = '') => {
    if (!canView) {
      toast.error('No tienes permiso para ver los estados de ticket');
      return;
    }

    setLoading(true);
    try {
      const response = await ticketStatusService.getAll({
        page,
        pageSize,
        search,
      });

      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Error al cargar los estados de ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket statuses:', error);
      toast.error('Error al cargar los estados de ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    fetchData(newPage, pagination.pageSize, searchTerm);
  };

  const handlePageSizeChange = (newPageSize) => {
    fetchData(1, newPageSize, searchTerm);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchData(1, pagination.pageSize, term);
  };

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('No tienes permiso para crear estados de ticket');
      return;
    }
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      toast.error('No tienes permiso para editar estados de ticket');
      return;
    }
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (documentId) => {
    if (!canDelete) {
      toast.error('No tienes permiso para eliminar estados de ticket');
      return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este estado?')) {
      return;
    }

    try {
      const response = await ticketStatusService.delete(documentId);
      if (response.success) {
        toast.success('Estado eliminado correctamente');
        fetchData(pagination.page, pagination.pageSize, searchTerm);
      } else {
        toast.error('Error al eliminar el estado');
      }
    } catch (error) {
      console.error('Error deleting ticket status:', error);
      toast.error('Error al eliminar el estado');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (editingItem) {
        response = await ticketStatusService.update(editingItem.documentId, formData);
      } else {
        response = await ticketStatusService.create(formData);
      }

      if (response.success) {
        toast.success(
          editingItem ? 'Estado actualizado correctamente' : 'Estado creado correctamente'
        );
        setDialogOpen(false);
        fetchData(pagination.page, pagination.pageSize, searchTerm);
      } else {
        toast.error('Error al guardar el estado');
      }
    } catch (error) {
      console.error('Error saving ticket status:', error);
      toast.error('Error al guardar el estado');
    }
  };

  return (
    <div className="space-y-6">
      <CatalogTable
        title="Estados de Ticket"
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      <CatalogFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        title={editingItem ? 'Editar Estado' : 'Nuevo Estado'}
        description={
          editingItem
            ? 'Modifica los datos del estado de ticket'
            : 'Completa la información para crear un nuevo estado'
        }
        fields={formFields}
        defaultValues={editingItem || { name: '', color: '#6b7280' }}
      />
    </div>
  );
};

export default TicketStatus;
