import React, { useState, useEffect } from 'react';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { ticketTypeService } from '@/services/catalogServices';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TicketType = () => {
  const { hasPermission } = useAuth();
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

  const canCreate = hasPermission('api::ticket-type.ticket-type.create');
  const canEdit = hasPermission('api::ticket-type.ticket-type.update');
  const canDelete = hasPermission('api::ticket-type.ticket-type.delete');
  const canView = hasPermission('api::ticket-type.ticket-type.find');

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
      placeholder: 'Ingrese el nombre del tipo',
      required: true,
    },
    {
      name: 'color',
      label: 'Color',
      type: 'color' as const,
      placeholder: '#000000',
      description: 'Color para identificar visualmente el tipo',
    },
  ];

  const fetchData = async (page = 1, pageSize = 10, search = '') => {
    if (!canView) {
      toast.error('No tienes permiso para ver los tipos de ticket');
      return;
    }

    setLoading(true);
    try {
      const response = await ticketTypeService.getAll({
        page,
        pageSize,
        search,
      });

      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Error al cargar los tipos de ticket');
      }
    } catch (error) {
      console.error('Error fetching ticket types:', error);
      toast.error('Error al cargar los tipos de ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.pageSize, searchTerm);
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
      toast.error('No tienes permiso para crear tipos de ticket');
      return;
    }
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    if (!canEdit) {
      toast.error('No tienes permiso para editar tipos de ticket');
      return;
    }
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (documentId) => {
    if (!canDelete) {
      toast.error('No tienes permiso para eliminar tipos de ticket');
      return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este tipo?')) {
      return;
    }

    try {
      const response = await ticketTypeService.delete(documentId);
      if (response.success) {
        toast.success('Tipo eliminado correctamente');
        fetchData(pagination.page, pagination.pageSize, searchTerm);
      } else {
        toast.error('Error al eliminar el tipo');
      }
    } catch (error) {
      console.error('Error deleting ticket type:', error);
      toast.error('Error al eliminar el tipo');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (editingItem) {
        response = await ticketTypeService.update(editingItem.documentId, formData);
      } else {
        response = await ticketTypeService.create(formData);
      }

      if (response.success) {
        toast.success(
          editingItem ? 'Tipo actualizado correctamente' : 'Tipo creado correctamente'
        );
        setDialogOpen(false);
        fetchData(pagination.page, pagination.pageSize, searchTerm);
      } else {
        toast.error('Error al guardar el tipo');
      }
    } catch (error) {
      console.error('Error saving ticket type:', error);
      toast.error('Error al guardar el tipo');
    }
  };

  return (
    <div className="space-y-6">
      <CatalogTable
        title="Tipos de Ticket"
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
        title={editingItem ? 'Editar Tipo' : 'Nuevo Tipo'}
        description={
          editingItem
            ? 'Modifica los datos del tipo de ticket'
            : 'Completa la información para crear un nuevo tipo'
        }
        fields={formFields}
        defaultValues={editingItem || { name: '', color: '#6b7280' }}
      />
    </div>
  );
};

export default TicketType;
