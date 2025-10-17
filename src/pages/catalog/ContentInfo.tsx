import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import CatalogTable from '@/components/catalog/CatalogTable';
import { contentInfoService, contentCategoryService, companyService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MDEditor from '@uiw/react-md-editor';
import { Switch } from '@/components/ui/switch';
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

interface ContentInfoData {
  id?: number;
  documentId?: string;
  title: string;
  slug?: string;
  content?: string;
  active?: boolean;
  status_content?: 'draft' | 'published' | 'archived';
  publish_date?: string;
  category_content?: any;
  company?: any;
  author?: any;
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
    slug: '',
    content: '',
    active: true,
    status_content: 'draft',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Cargar categorías y compañías
  useEffect(() => {
    loadCategories();
    loadCompanies();
  }, []);

  const loadCategories = async () => {
    const result = await contentCategoryService.getAll({ pageSize: 100 });
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadCompanies = async () => {
    const result = await companyService.getAll({ pageSize: 100 });
    if (result.success) {
      setCompanies(result.data);
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
      slug: '',
      content: '',
      active: true,
      status_content: 'draft',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const categoryId = item.category_content?.documentId || item.category_content?.id;
    const companyId = item.company?.documentId || item.company?.id;

    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      content: item.content || '',
      active: item.active ?? true,
      status_content: item.status_content || 'draft',
      publish_date: item.publish_date?.split('T')[0] || '',
      category_content: categoryId,
      company: companyId,
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
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        content: formData.content || null,
        active: formData.active ?? true,
        status_content: formData.status_content || 'draft',
        publish_date: formData.publish_date || null,
      };

      // Agregar relaciones
      if (formData.category_content) {
        payload.category_content = formData.category_content;
      }
      
      if (formData.company) {
        payload.company = formData.company;
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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="Se generará automáticamente del título"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido (Markdown)</Label>
              <div data-color-mode="light">
                <MDEditor
                  value={formData.content || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value || '' }))}
                  height={400}
                  preview="edit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category_content as string}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_content: value }))}
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
                <Label htmlFor="company">Empresa</Label>
                <Select
                  value={formData.company as string}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((comp) => (
                      <SelectItem key={comp.documentId} value={comp.documentId}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status_content}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status_content: value }))}
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

              <div className="space-y-2">
                <Label htmlFor="publish_date">Fecha de Publicación</Label>
                <Input
                  id="publish_date"
                  type="date"
                  value={formData.publish_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Activo</Label>
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
