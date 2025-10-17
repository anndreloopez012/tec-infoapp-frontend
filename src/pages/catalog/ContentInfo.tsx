import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import CatalogTable from '@/components/catalog/CatalogTable';
import { contentInfoService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contentCategoryService, contentTagService } from '@/services/catalogServices';

interface ContentInfoData {
  id?: number;
  documentId?: string;
  title: string;
  description?: string;
  content?: string;
  content_category?: any;
  content_tags?: any[];
  publish_date?: string;
  status?: 'draft' | 'published' | 'archived';
}

const ContentInfo = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    pageCount: 1,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentInfoData | null>(null);
  const [formData, setFormData] = useState<ContentInfoData>({
    title: '',
    description: '',
    content: '',
    status: 'draft',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Cargar categorías y tags
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  const loadCategories = async () => {
    const result = await contentCategoryService.getAll({ pageSize: 100 });
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadTags = async () => {
    const result = await contentTagService.getAll({ pageSize: 100 });
    if (result.success) {
      setTags(result.data);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const desc = row.getValue('description') as string;
        return desc ? (desc.length > 50 ? `${desc.substring(0, 50)}...` : desc) : '-';
      },
    },
    {
      accessorKey: 'content_category',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.original.content_category?.data || row.original.content_category;
        return category?.name || category?.attributes?.name || '-';
      },
    },
    {
      accessorKey: 'content_tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tagsData = row.original.content_tags?.data || row.original.content_tags || [];
        if (!Array.isArray(tagsData) || tagsData.length === 0) return '-';
        return tagsData.map((tag: any) => tag?.name || tag?.attributes?.name).filter(Boolean).join(', ');
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
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
        searchFields: ['title', 'description', 'content'],
        sort: 'createdAt:desc',
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
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      status: 'draft',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const categoryId = item.content_category?.data?.documentId || 
                      item.content_category?.data?.id || 
                      item.content_category?.documentId || 
                      item.content_category?.id;
    
    const tagIds = (item.content_tags?.data || item.content_tags || [])
      .map((tag: any) => tag?.documentId || tag?.id)
      .filter(Boolean);

    setFormData({
      title: item.title || '',
      description: item.description || '',
      content: item.content || '',
      content_category: categoryId,
      content_tags: tagIds,
      publish_date: item.publish_date || '',
      status: item.status || 'draft',
    });
    setIsDialogOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        content: formData.content || null,
        status: formData.status || 'draft',
        publish_date: formData.publish_date || null,
      };

      // Agregar relaciones
      if (formData.content_category) {
        payload.content_category = formData.content_category;
      }
      
      if (formData.content_tags && formData.content_tags.length > 0) {
        payload.content_tags = formData.content_tags;
      }

      const result = editingItem
        ? await contentInfoService.update(editingItem.documentId!, payload)
        : await contentInfoService.create(payload);

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || `Información de contenido ${editingItem ? 'actualizada' : 'creada'} correctamente`,
        });
        setIsDialogOpen(false);
        loadData(pagination.page, pagination.pageSize, searchQuery);
      } else {
        toast({
          title: "Error",
          description: result.error || `Error al ${editingItem ? 'actualizar' : 'crear'} la información de contenido`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Error al procesar la solicitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        canCreate={true}
        canEdit={true}
        canDelete={true}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Crear'} Información de Contenido
            </DialogTitle>
            <DialogDescription>
              Complete el formulario para {editingItem ? 'actualizar' : 'crear'} la información de contenido
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ingrese el título"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ingrese una descripción breve"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Ingrese el contenido completo"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.content_category as string}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, content_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.documentId} value={cat.documentId}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish_date">Fecha de Publicación</Label>
              <Input
                id="publish_date"
                type="date"
                value={formData.publish_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {tags.map((tag) => (
                  <label key={tag.documentId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.content_tags || []).includes(tag.documentId)}
                      onChange={(e) => {
                        const currentTags = formData.content_tags || [];
                        const newTags = e.target.checked
                          ? [...currentTags, tag.documentId]
                          : currentTags.filter((id) => id !== tag.documentId);
                        setFormData(prev => ({ ...prev, content_tags: newTags }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentInfo;
