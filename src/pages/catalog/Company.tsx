import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CatalogTable } from '@/components/catalog/CatalogTable';
import { CatalogFormDialog } from '@/components/catalog/CatalogFormDialog';
import { companyService } from '@/services/catalogServices';
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
import { format } from 'date-fns';
import { Building2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api.js';
import axios from 'axios';

export const Company: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = useAuthPermissions();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
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
  const canCreate = hasPermission('api::company.company.create');
  const canEdit = hasPermission('api::company.company.update');
  const canDelete = hasPermission('api::company.company.delete');
  const canViewAll = hasPermission('api::company.company.find');

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        searchFields: ['name', 'acronym', 'description', 'phone'],
        populate: 'logo',
      };

      if (showOnlyOwn && (user?.documentId || user?.id)) {
        params.createdByDocumentId = user.documentId || user.id;
      }

      const response = await companyService.getAll(params);
      
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
        accessorKey: 'logo',
        header: 'Logo',
        cell: ({ row }) => {
          const logo = row.original.attributes?.logo;
          const logoUrl = logo?.[0]?.url || logo?.url;
          if (logoUrl) {
            const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${API_CONFIG.BASE_URL}${logoUrl}`;
            return (
              <img 
                src={fullUrl} 
                alt="Logo" 
                className="h-10 w-10 object-cover rounded-md border"
              />
            );
          }
          return (
            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          );
        },
      },
      {
        accessorKey: 'attributes.name',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.attributes?.name || 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'attributes.acronym',
        header: 'Email',
        cell: ({ row }) => row.original.attributes?.acronym || 'N/A',
      },
      {
        accessorKey: 'attributes.phone',
        header: 'Teléfono',
        cell: ({ row }) => row.original.attributes?.phone || 'N/A',
      },
      {
        accessorKey: 'attributes.address',
        header: 'Dirección',
        cell: ({ row }) => {
          const address = row.original.attributes?.address;
          return address ? (
            <span className="text-sm text-muted-foreground line-clamp-1">{address}</span>
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

  // Campos del formulario - según schema de Strapi
  const formFields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text' as const,
      required: true,
      placeholder: 'Nombre de la empresa',
    },
    {
      name: 'acronym',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'email@empresa.com',
    },
    {
      name: 'phone',
      label: 'Teléfono',
      type: 'number' as const,
      required: false,
      placeholder: '1234567890',
    },
    {
      name: 'address',
      label: 'Dirección',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Dirección completa',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Descripción de la empresa',
    },
    {
      name: 'logo',
      label: 'Logo',
      type: 'image' as const,
      required: false,
      multiple: true,
      description: 'Sube el logo de la empresa',
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

  // Subir imagen a Strapi
  const uploadImage = async (file: File): Promise<number | null> => {
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const token = localStorage.getItem(API_CONFIG.LOCAL_STORAGE_KEYS.TOKEN);
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data[0]) {
        return response.data[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleFormSubmit = async (formData: any, files?: { [key: string]: File[] }) => {
    setFormLoading(true);
    console.log('handleFormSubmit called with:', { formData, files });
    try {
      // Subir imágenes si hay
      let logoIds: number[] = [];
      if (files?.logo && files.logo.length > 0) {
        console.log('Uploading logo files:', files.logo);
        for (const file of files.logo) {
          console.log('Uploading file:', file.name);
          const id = await uploadImage(file);
          console.log('Upload result id:', id);
          if (id) logoIds.push(id);
        }
      }

      // Preparar datos
      const dataToSend: any = {
        name: formData.name,
        acronym: formData.acronym,
        description: formData.description || null,
        phone: formData.phone ? parseInt(formData.phone) : null,
        address: formData.address || null,
      };

      // Solo agregar logo si hay nuevas imágenes
      if (logoIds.length > 0) {
        dataToSend.logo = logoIds;
      }

      let response;
      if (editingItem) {
        response = await companyService.update(editingItem.documentId || editingItem.id, dataToSend);
      } else {
        response = await companyService.create(dataToSend);
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
      console.error('Error:', error);
      toast.error('Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await companyService.delete(itemToDelete.documentId || itemToDelete.id);
      
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
        title="Empresas"
      />

      <CatalogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        title={editingItem ? 'Editar Empresa' : 'Nueva Empresa'}
        description={editingItem ? 'Modifica los datos de la empresa' : 'Completa el formulario para registrar una nueva empresa'}
        fields={formFields}
        defaultValues={editingItem ? editingItem.attributes : {}}
        isLoading={formLoading}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la empresa.
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

export default Company;
