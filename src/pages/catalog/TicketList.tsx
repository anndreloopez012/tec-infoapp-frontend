import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { KanbanStatusView } from '@/components/tickets/KanbanStatusView';
import { KanbanPriorityView } from '@/components/tickets/KanbanPriorityView';
import { ticketService, ticketStatusService, ticketPriorityService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, Columns3, Layers } from 'lucide-react';

type ViewMode = 'table' | 'status' | 'priority';

export default function TicketList() {
  const [data, setData] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Permisos
  const canCreate = hasPermission('api::ticket.ticket.create');
  const canEdit = hasPermission('api::ticket.ticket.update');
  const canDelete = hasPermission('api::ticket.ticket.delete');
  const canView = hasPermission('api::ticket.ticket.find');

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
          page: viewMode === 'table' ? pagination.page : 1,
          pageSize: viewMode === 'table' ? pagination.pageSize : 100,
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

      const [ticketsRes, statusesRes, prioritiesRes] = await Promise.all([
        ticketService.getAll(params),
        ticketStatusService.getAll({ pagination: { pageSize: 100 } }),
        ticketPriorityService.getAll({ pagination: { pageSize: 100 } }),
      ]);
      
      setData(ticketsRes.data || []);
      setStatuses(statusesRes.data || []);
      setPriorities(prioritiesRes.data || []);
      
      if (viewMode === 'table') {
        setPagination(ticketsRes.meta?.pagination || pagination);
      }
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
  }, [pagination.page, pagination.pageSize, searchTerm, viewMode]);

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

  const handleUpdateStatus = async (ticketId: string, statusId: string) => {
    if (!canEdit) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para actualizar tickets",
        variant: "destructive",
      });
      throw new Error('Sin permisos');
    }

    try {
      await ticketService.update(ticketId, {
        ticket_status: statusId,
      });
      
      // Actualizar el estado local inmediatamente
      setData(prevData => 
        prevData.map(ticket => 
          ticket.documentId === ticketId 
            ? { 
                ...ticket, 
                ticket_status: statuses.find(s => s.documentId === statusId) || ticket.ticket_status 
              }
            : ticket
        )
      );
      
      toast({
        title: "Estado actualizado",
        description: "El estado del ticket ha sido actualizado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el estado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdatePriority = async (ticketId: string, priorityId: string) => {
    if (!canEdit) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para actualizar tickets",
        variant: "destructive",
      });
      throw new Error('Sin permisos');
    }

    try {
      await ticketService.update(ticketId, {
        ticket_priority: priorityId,
      });
      
      // Actualizar el estado local inmediatamente
      setData(prevData => 
        prevData.map(ticket => 
          ticket.documentId === ticketId 
            ? { 
                ...ticket, 
                ticket_priority: priorities.find(p => p.documentId === priorityId) || ticket.ticket_priority 
              }
            : ticket
        )
      );
      
      toast({
        title: "Prioridad actualizada",
        description: "La prioridad del ticket ha sido actualizada correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la prioridad",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Administra y organiza los tickets del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            Crear Ticket
          </Button>
        )}
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <span>Tabla</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Columns3 className="h-4 w-4" />
            <span>Por Estado</span>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Por Prioridad</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'table' && (
        <CatalogTable
          title="Listado de Tickets"
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
      )}

      {viewMode === 'status' && (
        <KanbanStatusView
          tickets={data}
          statuses={statuses}
          loading={loading}
          onUpdateStatus={handleUpdateStatus}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {viewMode === 'priority' && (
        <KanbanPriorityView
          tickets={data}
          priorities={priorities}
          loading={loading}
          onUpdatePriority={handleUpdatePriority}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
