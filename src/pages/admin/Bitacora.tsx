import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Eye,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import auditLogService from '@/services/auditLogService';

interface AuditLog {
  id: number;
  action: string;
  model: string;
  entry: number;
  after: string;
  createdAt: string;
}

const columnHelper = createColumnHelper<AuditLog>();

const Bitacora = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Para esta implementación, cargaremos todos los datos y usaremos filtrado del lado cliente
      const response = await auditLogService.getAuditLogs(1, 1000);
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleRefresh = () => {
    loadAuditLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatJsonForDisplay = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openJsonModal = (log: AuditLog) => {
    setSelectedLog(log);
    setShowJsonModal(true);
  };

  // Get unique models for filter dropdown
  const uniqueModels = useMemo(() => {
    const models = Array.from(new Set(auditLogs.map(log => log.model))).sort();
    return models;
  }, [auditLogs]);

  // Custom filter function for date
  const dateFilterFn = (row: any, columnId: string, filterValue: Date) => {
    if (!filterValue) return true;
    const cellValue = row.getValue(columnId);
    if (!cellValue) return false;
    
    const rowDate = new Date(cellValue);
    const filterDate = new Date(filterValue);
    
    // Compare only the date part (year, month, day)
    return (
      rowDate.getFullYear() === filterDate.getFullYear() &&
      rowDate.getMonth() === filterDate.getMonth() &&
      rowDate.getDate() === filterDate.getDate()
    );
  };

  // Define table columns
  const columns = useMemo(() => [
    columnHelper.accessor('action', {
      header: 'Acción',
      cell: ({ getValue }) => (
        <Badge variant={getActionBadgeVariant(getValue())}>
          {getValue()}
        </Badge>
      ),
      filterFn: 'includesString',
    }),
    columnHelper.accessor('model', {
      header: 'Modelo',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">{getValue()}</span>
      ),
      filterFn: 'includesString',
    }),
    columnHelper.accessor('entry', {
      header: 'Entrada',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('after', {
      header: 'Después',
      cell: ({ getValue, row }) => (
        <div className="flex items-center space-x-2 max-w-xs">
          <span className="truncate text-sm">
            {getValue() && getValue().length > 50 
              ? `${getValue().substring(0, 50)}...`
              : getValue()
            }
          </span>
          {getValue() && getValue().length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openJsonModal(row.original)}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      enableColumnFilter: false,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Fecha',
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {formatDate(getValue())}
          </span>
        </div>
      ),
      filterFn: dateFilterFn,
    }),
  ], []);

  const table = useReactTable({
    data: auditLogs,
    columns,
    state: {
      columnFilters: [
        ...columnFilters,
        ...(dateFilter ? [{ id: 'createdAt', value: dateFilter }] : [])
      ],
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      }
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bitácora del Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Registro de actividades y cambios en el sistema
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </Button>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros y Controles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Filtrar por acción..."
                value={(table.getColumn('action')?.getFilterValue() as string) ?? ''}
                onChange={(e) => table.getColumn('action')?.setFilterValue(e.target.value)}
              />
              
              <Select
                value={(table.getColumn('model')?.getFilterValue() as string) ?? ''}
                onValueChange={(value) => 
                  table.getColumn('model')?.setFilterValue(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los modelos</SelectItem>
                  {uniqueModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Seleccionar fecha..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={(date) => setDateFilter(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {dateFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter(undefined)}
                        className="w-full"
                      >
                        Limpiar fecha
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filas por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 filas</SelectItem>
                  <SelectItem value="25">25 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {table.getFilteredRowModel().rows.length} de {auditLogs.length} registros
              </div>
              <Button 
                onClick={() => {
                  table.resetColumnFilters();
                  setDateFilter(undefined);
                }} 
                variant="outline" 
                size="sm"
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audit Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Registros de Auditoría</span>
              <Badge variant="outline" className="ml-auto">
                {table.getFilteredRowModel().rows.length} registros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <EmptyState 
                title="No hay registros"
                description="No se encontraron registros de auditoría con los filtros aplicados."
              />
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="relative">
                              <div className="flex items-center space-x-2">
                                <span>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </span>
                                {header.column.getCanSort() && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={header.column.getToggleSortingHandler()}
                                  >
                                    {header.column.getIsSorted() === 'desc' ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : header.column.getIsSorted() === 'asc' ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <div className="h-4 w-4 opacity-50">
                                        <ChevronDown className="h-4 w-4" />
                                      </div>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Página {table.getState().pagination.pageIndex + 1} de{' '}
                    {table.getPageCount()} • Mostrando{' '}
                    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{' '}
                    de {table.getFilteredRowModel().rows.length} registros
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>


      {/* JSON Modal */}
      <Dialog open={showJsonModal} onOpenChange={setShowJsonModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
            <DialogDescription>
              Información completa del campo "Después" - Acción: {selectedLog?.action} | Modelo: {selectedLog?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-muted-foreground">JSON Formateado:</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedLog?.after && copyToClipboard(formatJsonForDisplay(selectedLog.after))}
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar</span>
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                {selectedLog?.after ? formatJsonForDisplay(selectedLog.after) : 'No hay datos'}
              </pre>
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>Fecha:</strong> {selectedLog?.createdAt ? formatDate(selectedLog.createdAt) : ''}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bitacora;