import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { eventAttendanceService } from '@/services/eventAttendanceService';
import { useAuth } from '@/context/AuthContext';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { API_CONFIG } from '@/config/api.js';

export const EventAttendance: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = useAuthPermissions();
  
  // Permisos
  const canCreate = hasPermission('api::event-attendance.event-attendance.create');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  
  // Filtros
  const [eventFilter, setEventFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Listas para filtros
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Cargar eventos y usuarios para filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;
        
        // Cargar eventos
        const eventsResponse = await axios.get(
          `${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/events?pagination[pageSize]=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEvents(eventsResponse.data.data || []);
        
        // Cargar usuarios
        const usersResponse = await axios.get(
          `${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/users?pagination[pageSize]=1000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(usersResponse.data || []);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    
    loadFilterData();
  }, []);

  // Cargar datos con filtros
  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      if (eventFilter) params.eventId = eventFilter;
      if (userFilter) params.userId = userFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

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
  }, [pagination.page, pagination.pageSize, eventFilter, userFilter, statusFilter, startDateFilter, endDateFilter]);

  // Columnas de la tabla
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.id}</span>,
      },
      {
        accessorKey: 'event',
        header: 'Evento',
        cell: ({ row }) => {
          const event = row.original.event;
          return event?.title || event?.name || 'N/A';
        },
      },
      {
        accessorKey: 'user',
        header: 'Usuario',
        cell: ({ row }) => {
          const user = row.original.user;
          return user?.username || user?.email || 'N/A';
        },
      },
      {
        accessorKey: 'status_attendance',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.original.status_attendance;
          const variant = status === 'confirmed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive';
          const label = status === 'confirmed' ? 'Confirmado' : status === 'pending' ? 'Pendiente' : 'Cancelado';
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        accessorKey: 'comment',
        header: 'Comentario',
        cell: ({ row }) => {
          const comment = row.original.comment;
          return comment ? (
            <span className="text-sm line-clamp-2">{comment}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Sin comentario</span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha de Registro',
        cell: ({ row }) => {
          const date = row.original.createdAt;
          return date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : 'N/A';
        },
      },
    ],
    []
  );

  // Exportar datos
  const handleExport = async () => {
    try {
      toast.loading('Exportando datos...');
      
      const params: any = {};
      if (eventFilter) params.eventId = eventFilter;
      if (userFilter) params.userId = userFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const response = await eventAttendanceService.exportData(params);
      
      if (response.success && response.data.length > 0) {
        // Convertir a CSV
        const csvHeaders = ['ID', 'Evento', 'Usuario', 'Email', 'Estado', 'Comentario', 'Fecha de Registro'];
        const csvRows = response.data.map((item: any) => [
          item.id,
          item.event?.title || item.event?.name || 'N/A',
          item.user?.username || 'N/A',
          item.user?.email || 'N/A',
          item.status_attendance === 'confirmed' ? 'Confirmado' : item.status_attendance === 'pending' ? 'Pendiente' : 'Cancelado',
          item.comment || '',
          item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A',
        ]);
        
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `asistencias_eventos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Datos exportados correctamente');
      } else {
        toast.error('No hay datos para exportar');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar datos');
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setEventFilter('');
    setUserFilter('');
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const activeFiltersCount = [eventFilter, userFilter, statusFilter, startDateFilter, endDateFilter].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Asistencia de Eventos</h1>
        <div className="flex gap-2">
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Filtros Avanzados</DialogTitle>
                <DialogDescription>
                  Filtra las asistencias por diferentes criterios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-filter">Evento</Label>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger id="event-filter">
                      <SelectValue placeholder="Todos los eventos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los eventos</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.documentId} value={event.documentId}>
                          {event.title || event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-filter">Usuario</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger id="user-filter">
                      <SelectValue placeholder="Todos los usuarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los usuarios</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.documentId} value={user.documentId}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status-filter">Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los estados</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date-filter">Fecha de inicio</Label>
                  <Input
                    id="start-date-filter"
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date-filter">Fecha de fin</Label>
                  <Input
                    id="end-date-filter"
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                  <Button onClick={() => setFilterDialogOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {canCreate && (
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      <CatalogTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        onPageSizeChange={(pageSize) => setPagination({ ...pagination, pageSize, page: 1 })}
        onSearch={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        canCreate={false}
        canEdit={false}
        canDelete={false}
        title=""
      />
    </div>
  );
};

export default EventAttendance;
