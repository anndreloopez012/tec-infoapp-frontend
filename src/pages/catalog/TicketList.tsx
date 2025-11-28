import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { ticketService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function TicketList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { checkPermission } = useAuth();
  const navigate = useNavigate();

  // Permisos
  const canCreate = checkPermission('api::ticket.ticket', 'create');
  const canEdit = checkPermission('api::ticket.ticket', 'update');
  const canDelete = checkPermission('api::ticket.ticket', 'delete');
  const canView = checkPermission('api::ticket.ticket', 'find');

  // Columnas para la tabla
  const columns = [
    { 
      accessorKey: 'name', 
      header: 'Nombre',
      cell: ({ row }: any) => row.original.name || 'Sin nombre'
    },
    {
      accessorKey: 'ticket_status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const status = row.original.ticket_status;
        return status?.name || 'Sin estado';
      }
    },
    {
      accessorKey: 'ticket_priority',
      header: 'Prioridad',
      cell: ({ row }: any) => {
        const priority = row.original.ticket_priority;
        return priority?.name || 'Sin prioridad';
      }
    },
    {
      accessorKey: 'ticket_type',
      header: 'Tipo',
      cell: ({ row }: any) => {
        const type = row.original.ticket_type;
        return type?.name || 'Sin tipo';
      }
    },
  ];

  const fetchData = async () => {
    if (!canView) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para ver tickets",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = {
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
        populate: ['ticket_status', 'ticket_priority', 'ticket_type'],
        sort: ['createdAt:desc'],
        ...(searchTerm && {
          filters: {
            name: {
              $containsi: searchTerm,
            },
          },
        }),
      };

      const response = await ticketService.getAll(params);
      
      setData(response.data || []);
      setPagination(response.meta?.pagination || pagination);
    } catch (error: any) {
      console.error('Error al cargar tickets:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar los tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.pageSize, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = () => {
    if (!canCreate) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para crear tickets",
        variant: "destructive",
      });
      return;
    }
    navigate('/ticket/new');
  };

  const handleEdit = (item: any) => {
    if (!canEdit) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para editar tickets",
        variant: "destructive",
      });
      return;
    }
    navigate(`/ticket/${item.documentId}`);
  };

  const handleDelete = async (item: any) => {
    if (!canDelete) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para eliminar tickets",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket?')) {
      return;
    }

    try {
      await ticketService.delete(item.documentId);
      toast({
        title: "Ticket eliminado",
        description: "El ticket ha sido eliminado correctamente",
      });
      fetchData();
    } catch (error: any) {
      console.error('Error al eliminar ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el ticket",
        variant: "destructive",
      });
    }
  };

  const handleView = (item: any) => {
    navigate(`/ticket/${item.documentId}`);
  };

  return (
    <CatalogTable
      title="Gestión de Tickets"
      columns={columns}
      data={data}
      loading={loading}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
      onView={handleView}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
