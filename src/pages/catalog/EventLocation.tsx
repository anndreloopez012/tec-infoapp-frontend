import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { eventLocationService } from '@/services/catalogServices';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { MapPin, Check, X } from 'lucide-react';
import { LocationMapPicker } from '@/components/catalog/LocationMapPicker';
import { GoogleMapsPreview } from '@/components/catalog/GoogleMapsPreview';
import { useForm } from 'react-hook-form';

export const EventLocation: React.FC = () => {
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
        searchFields: ['name'],
      };

      if (showOnlyOwn && (user?.documentId || user?.id)) {
        params.createdByDocumentId = user.documentId || user.id;
      }

      const response = await eventLocationService.getAll(params);
      
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
        accessorKey: 'attributes.name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.attributes?.name || 'N/A'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'attributes.physical_location',
        header: 'Coordenadas',
        cell: ({ row }) => {
          const location = row.original.attributes?.physical_location;
          return location ? (
            <span className="text-xs font-mono text-muted-foreground">{location}</span>
          ) : (
            'N/A'
          );
        },
      },
      {
        accessorKey: 'attributes.available',
        header: 'Disponible',
        cell: ({ row }) => {
          const available = row.original.attributes?.available;
          return available ? (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Sí
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <X className="h-3 w-3" />
              No
            </Badge>
          );
        },
      },
      {
        accessorKey: 'attributes.capacity',
        header: 'Capacidad',
        cell: ({ row }) => {
          const capacity = row.original.attributes?.capacity;
          return capacity ? (
            <Badge variant="secondary">{capacity} personas</Badge>
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    physical_location: '',
    google_maps: '',
    available: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when editing
  useEffect(() => {
    if (editingItem && formOpen) {
      setFormData({
        name: editingItem.attributes?.name || '',
        capacity: editingItem.attributes?.capacity?.toString() || '',
        physical_location: editingItem.attributes?.physical_location || '',
        google_maps: editingItem.attributes?.google_maps || '',
        available: editingItem.attributes?.available ?? true
      });
    } else if (!formOpen) {
      // Reset form when dialog closes
      setFormData({
        name: '',
        capacity: '',
        physical_location: '',
        google_maps: '',
        available: true
      });
    }
  }, [editingItem, formOpen]);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        name: formData.name,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        physical_location: formData.physical_location || null,
        google_maps: formData.google_maps || null,
        available: formData.available
      };

      let response;
      if (editingItem) {
        response = await eventLocationService.update(editingItem.documentId || editingItem.id, submitData);
      } else {
        response = await eventLocationService.create(submitData);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await eventLocationService.delete(itemToDelete.documentId || itemToDelete.id);
      
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
        title="Lugares para Eventos"
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Lugar' : 'Nuevo Lugar'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Modifica los datos del lugar' : 'Completa el formulario para registrar un nuevo lugar'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del lugar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Número de personas"
                min="0"
              />
            </div>

            <LocationMapPicker
              value={formData.physical_location}
              onChange={(coords) => setFormData(prev => ({ ...prev, physical_location: coords }))}
            />

            <GoogleMapsPreview
              value={formData.google_maps}
              onChange={(iframe) => setFormData(prev => ({ ...prev, google_maps: iframe }))}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
              />
              <Label htmlFor="available" className="cursor-pointer">
                Disponible
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el lugar.
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

export default EventLocation;
