import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contentInfoService, contentCategoryService, companyService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  attachments?: any[];
}

const ContentInfoForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContentInfoData>({
    title: '',
    slug: '',
    content: '',
    active: true,
    status_content: 'draft',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
    loadCompanies();
    if (editId) {
      loadContentInfo(editId);
    }
  }, [editId]);

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

  const loadContentInfo = async (documentId: string) => {
    setLoading(true);
    try {
      const result = await contentInfoService.getAll({
        filters: { documentId },
        populate: 'category_content,company,author,attachments',
      });

      if (result.success && result.data.length > 0) {
        const item = result.data[0];
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
        setExistingAttachments(item.attachments || []);
      }
    } catch (error) {
      console.error('Error loading content info:', error);
      toast({
        title: "Error",
        description: "Error al cargar la información de contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveExistingAttachment = (attachmentId: number) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
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

      if (formData.category_content) {
        payload.category_content = formData.category_content;
      }
      
      if (formData.company) {
        payload.company = formData.company;
      }

      if (existingAttachments.length > 0) {
        payload.attachments = existingAttachments.map(att => att.id);
      }

      let result = editId
        ? await contentInfoService.update(editId, payload)
        : await contentInfoService.create(payload);

      if (result.success && uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('ref', 'api::content-info.content-info');
        formData.append('refId', result.data.id || result.data.documentId);
        formData.append('field', 'attachments');

        try {
          await fetch(`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
        }
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || `Información de contenido ${editId ? 'actualizada' : 'creada'} correctamente`,
        });
        navigate('/contentinfo');
      } else {
        toast({
          title: "Error",
          description: result.error || `Error al ${editId ? 'actualizar' : 'crear'} la información de contenido`,
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
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/contentinfo')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la lista
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {editId ? 'Editar' : 'Crear'} Información de Contenido
            </CardTitle>
            <CardDescription>
              Complete el formulario para {editId ? 'actualizar' : 'crear'} la información de contenido
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido</Label>
                <LexicalEditor
                  value={formData.content || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="Ingrese el contenido..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="attachments">Imágenes de Portada</Label>
                <Input
                  id="attachments"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {uploadedFiles.length} archivo(s) seleccionado(s)
                  </div>
                )}
                
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Imágenes actuales:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {existingAttachments.map((att) => (
                        <div key={att.id} className="relative group">
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${att.url}`}
                            alt={att.name}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingAttachment(att.id)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/contentinfo')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentInfoForm;
