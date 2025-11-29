import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import CatalogTable from '@/components/catalog/CatalogTable';
import { contentInfoService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

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
  
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Permisos
  const canCreate = hasPermission('api::content-info.content-info.create');
  const canEdit = hasPermission('api::content-info.content-info.update');
  const canDelete = hasPermission('api::content-info.content-info.delete');


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
        return active ? 'Sí' : 'No';
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

  const handleCreate = () => {
    navigate('/contentinfo/new');
  };

  const handleEdit = (item: any) => {
    navigate(`/contentinfo/edit?id=${item.documentId}`);
  };

  const handleDelete = async (item: any) => {
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
  };


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

    </div>
  );
};

export default ContentInfo;
