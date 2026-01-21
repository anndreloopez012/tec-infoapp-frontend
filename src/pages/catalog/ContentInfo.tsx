import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import CatalogTable from '@/components/catalog/CatalogTable';
import { contentInfoService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ContentInfo = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [itemToApprove, setItemToApprove] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();

  // Permisos
  const canCreate = hasPermission('api::content-info.content-info.create');
  const canEdit = hasPermission('api::content-info.content-info.update');
  const canDelete = hasPermission('api::content-info.content-info.delete');

  // Verificar si el usuario tiene rol super
  const isSuperUser = user?.role?.type === 'super' || 
                      user?.role?.type === 'super_admin' || 
                      user?.role?.name === 'super' || 
                      user?.role?.name === 'super_admin' ||
                      user?.role?.name === 'Super Admin';

  const handleApproveClick = (item: any) => {
    setItemToApprove(item);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!itemToApprove) return;
    
    setApproving(true);
    try {
      const result = await contentInfoService.update(itemToApprove.documentId, {
        active: true
      });

      if (result.success) {
        toast({
          title: "Contenido Aprobado",
          description: "El contenido ha sido aprobado y activado correctamente",
        });
        loadData(pagination.page, pagination.pageSize, searchQuery);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al aprobar el contenido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error approving content:', error);
      toast({
        title: "Error",
        description: "Error al aprobar el contenido",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
      setApproveDialogOpen(false);
      setItemToApprove(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'category_content',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.original.category_content;
        return category?.name || '-';
      },
    },
    {
      accessorKey: 'company',
      header: 'Empresa',
      cell: ({ row }) => {
        const company = row.original.company;
        return company?.name || '-';
      },
    },
    {
      accessorKey: 'active',
      header: 'Activo',
      cell: ({ row }) => {
        const active = row.getValue('active');
        const item = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={active ? "default" : "secondary"}>
              {active ? 'Sí' : 'No'}
            </Badge>
            {!active && isSuperUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveClick(item);
                }}
                className="h-7 px-2 text-xs gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                title="Aprobar contenido"
              >
                <CheckCircle className="h-3 w-3" />
                Aprobar
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status_content',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status_content') as string;
        const statusMap: Record<string, string> = {
          draft: 'Borrador',
          published: 'Publicado',
          archived: 'Archivado',
        };
        return statusMap[status] || status || 'Borrador';
      },
    },
    {
      accessorKey: 'publish_date',
      header: 'Fecha de Publicación',
      cell: ({ row }) => {
        const date = row.getValue('publish_date') as string;
        return date ? new Date(date).toLocaleDateString('es-MX') : '-';
      },
    },
  ];

  const loadData = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true);
    try {
      const result = await contentInfoService.getAll({
        page,
        pageSize,
        search,
        searchFields: ['title', 'slug', 'content'],
        sort: 'createdAt:desc',
        populate: 'category_content,company,author,attachments',
      });

      if (result.success) {
        setData(result.data);
        setPagination({
          page: result.pagination.page || page,
          pageSize: result.pagination.pageSize || pageSize,
          pageCount: result.pagination.pageCount || 1,
          total: result.pagination.total || 0,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar la información de contenido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error al cargar la información de contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(pagination.page, pagination.pageSize, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page: number) => {
    loadData(page, pagination.pageSize, searchQuery);
  };

  const handlePageSizeChange = (pageSize: number) => {
    loadData(1, pageSize, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadData(1, pagination.pageSize, query);
  };

  const handleCreate = useCallback(() => {
    navigate('/contentinfo/new');
  }, [navigate]);

  const handleEdit = useCallback((item: any) => {
    console.log('Editando item:', item);
    navigate(`/contentinfo/edit?id=${item.documentId}`);
  }, [navigate]);

  const handleDelete = useCallback(async (item: any) => {
    if (!window.confirm('¿Está seguro de eliminar esta información de contenido?')) return;

    const result = await contentInfoService.delete(item.documentId);
    
    if (result.success) {
      toast({
        title: "Éxito",
        description: "Información de contenido eliminada correctamente",
      });
      loadData(pagination.page, pagination.pageSize, searchQuery);
    } else {
      toast({
        title: "Error",
        description: result.error || "Error al eliminar la información de contenido",
        variant: "destructive",
      });
    }
  }, [toast, pagination.page, pagination.pageSize, searchQuery]);


  return (
    <div className="container mx-auto py-6">
      <CatalogTable
        title="Información de Contenido"
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

      {/* Dialog de confirmación de aprobación */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Contenido</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de aprobar este contenido? Una vez aprobado, el contenido estará activo y visible según su estado de publicación.
              {itemToApprove && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <strong>Título:</strong> {itemToApprove.title}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApproveConfirm}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700"
            >
              {approving ? 'Aprobando...' : 'Aprobar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentInfo;
