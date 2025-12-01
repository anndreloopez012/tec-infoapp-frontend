import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { eventAttendanceService } from '@/services/eventAttendanceService';
import { useAuth } from '@/context/AuthContext';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter, FileSpreadsheet, FileText, Calendar, User, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  
  // Export modal
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportEventFilter, setExportEventFilter] = useState('');
  const [exportUserFilter, setExportUserFilter] = useState('');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  
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
  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      toast.loading(`Exportando a ${type.toUpperCase()}...`);
      
      const params: any = {};
      if (exportEventFilter) params.eventId = exportEventFilter;
      if (exportUserFilter) params.userId = exportUserFilter;
      if (exportStartDate) params.startDate = exportStartDate;
      if (exportEndDate) params.endDate = exportEndDate;

      const response = await eventAttendanceService.exportData(params);
      
      if (response.success && response.data.length > 0) {
        if (type === 'excel') {
          // Convertir a CSV (Excel compatible)
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
          const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `asistencias_eventos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Datos exportados a Excel correctamente');
        } else {
          // Para PDF, usaremos la misma lógica pero con nombre diferente
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
          
          // Crear contenido HTML para "PDF" (versión imprimible)
          const htmlContent = `
            <html>
              <head>
                <title>Reporte de Asistencias</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  h1 { color: #333; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; font-weight: bold; }
                  tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
              </head>
              <body>
                <h1>Reporte de Asistencias a Eventos</h1>
                <p>Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <table>
                  <thead>
                    <tr>${csvHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
                  </thead>
                  <tbody>
                    ${csvRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                  </tbody>
                </table>
              </body>
            </html>
          `;
          
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `asistencias_eventos_${format(new Date(), 'yyyyMMdd_HHmmss')}.html`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Reporte generado (Abrir en navegador e imprimir como PDF)');
        }
        
        setExportDialogOpen(false);
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

  const clearExportFilters = () => {
    setExportEventFilter('');
    setExportUserFilter('');
    setExportStartDate('');
    setExportEndDate('');
  };

  const activeFiltersCount = [eventFilter, userFilter, statusFilter, startDateFilter, endDateFilter].filter(Boolean).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header con título y acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asistencia de Eventos</h1>
          <p className="text-muted-foreground mt-1">Gestiona y visualiza las asistencias a eventos</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtros Popover */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 relative">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filtros de búsqueda</h4>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="event-filter" className="text-xs font-medium">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Evento
                    </Label>
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                      <SelectTrigger id="event-filter" className="h-9">
                        <SelectValue placeholder="Todos" />
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
                    <Label htmlFor="user-filter" className="text-xs font-medium">
                      <User className="h-3 w-3 inline mr-1" />
                      Usuario
                    </Label>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger id="user-filter" className="h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los usuarios</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.documentId} value={user.documentId}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-filter" className="text-xs font-medium">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Estado
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date-filter" className="text-xs font-medium">
                        Desde
                      </Label>
                      <Input
                        id="start-date-filter"
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date-filter" className="text-xs font-medium">
                        Hasta
                      </Label>
                      <Input
                        id="end-date-filter"
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setFilterPopoverOpen(false)} 
                  className="w-full"
                  size="sm"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón de Exportar */}
          {canCreate && (
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Exportar Reporte</DialogTitle>
                  <DialogDescription>
                    Configura los filtros y selecciona el formato de exportación
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Filtros de exportación */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Filtros de exportación</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearExportFilters}
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpiar
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="export-event" className="text-xs font-medium">Evento</Label>
                        <Select value={exportEventFilter} onValueChange={setExportEventFilter}>
                          <SelectTrigger id="export-event">
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
                        <Label htmlFor="export-user" className="text-xs font-medium">Usuario</Label>
                        <Select value={exportUserFilter} onValueChange={setExportUserFilter}>
                          <SelectTrigger id="export-user">
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

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="export-start-date" className="text-xs font-medium">Fecha inicio</Label>
                          <Input
                            id="export-start-date"
                            type="date"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="export-end-date" className="text-xs font-medium">Fecha fin</Label>
                          <Input
                            id="export-end-date"
                            type="date"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Opciones de formato */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Formato de exportación</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Card 
                        className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
                        onClick={() => handleExport('excel')}
                      >
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">Excel</p>
                            <p className="text-xs text-muted-foreground">Formato CSV</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
                        onClick={() => handleExport('pdf')}
                      >
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
                          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                            <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">PDF</p>
                            <p className="text-xs text-muted-foreground">Vista imprimible</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Badges de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {eventFilter && (
            <Badge variant="secondary" className="gap-1">
              Evento
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setEventFilter('')}
              />
            </Badge>
          )}
          {userFilter && (
            <Badge variant="secondary" className="gap-1">
              Usuario
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setUserFilter('')}
              />
            </Badge>
          )}
          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              Estado: {statusFilter === 'confirmed' ? 'Confirmado' : statusFilter === 'pending' ? 'Pendiente' : 'Cancelado'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setStatusFilter('')}
              />
            </Badge>
          )}
          {startDateFilter && (
            <Badge variant="secondary" className="gap-1">
              Desde: {format(new Date(startDateFilter), 'dd/MM/yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setStartDateFilter('')}
              />
            </Badge>
          )}
          {endDateFilter && (
            <Badge variant="secondary" className="gap-1">
              Hasta: {format(new Date(endDateFilter), 'dd/MM/yyyy')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => setEndDateFilter('')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Tabla */}
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
