import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contentInfoService, contentCategoryService, companyService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, getUploadHeaders } from '@/config/api';
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
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ContentPreviewDialog from '@/components/catalog/ContentPreviewDialog';
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
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
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
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Cargar categorías y empresas solo una vez
  useEffect(() => {
    loadCategories();
    loadCompanies();
  }, []);

  // Detectar cambios en editId y cargar el contenido correspondiente
  useEffect(() => {
    if (editId && editId !== currentEditId) {
      console.log('Cargando contenido para ID:', editId);
      setCurrentEditId(editId);
      loadContentInfo(editId);
    } else if (!editId && currentEditId !== null) {
      // Limpiar formulario si no hay editId
      console.log('Limpiando formulario');
      setCurrentEditId(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        active: true,
        status_content: 'draft',
      });
      setExistingAttachments([]);
      setUploadedFiles([]);
      filePreviews.forEach(url => URL.revokeObjectURL(url));
      setFilePreviews([]);
    }
  }, [editId, currentEditId]);

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
    // Limpiar archivos subidos antes de cargar nuevo contenido
    setUploadedFiles([]);
    filePreviews.forEach(url => URL.revokeObjectURL(url));
    setFilePreviews([]);
    try {
      // Usar getById porque el endpoint está basado en documentId
      const result = await contentInfoService.getById(documentId);

      if (result.success && result.data) {
        const item = result.data;
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
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      
      // Limpiar previews anteriores
      filePreviews.forEach(url => URL.revokeObjectURL(url));
      
      // Crear nuevos previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(newPreviews);
    }
  };

  const handleRemoveUploadedFile = (index: number) => {
    // Revocar URL del preview
    URL.revokeObjectURL(filePreviews[index]);
    
    // Remover archivo y preview
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
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
          await fetch(buildApiUrl('upload'), {
            method: 'POST',
            headers: getUploadHeaders(),
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
        setShowSuccessDialog(true);
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
                  key={editId || 'new'}
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attachments">Imágenes de Portada</Label>
                  <Input
                    id="attachments"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Vista previa de nuevas imágenes:</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {filePreviews.map((preview, index) => (
                        <div 
                          key={index} 
                          className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all duration-200"
                        >
                          <img
                            src={preview}
                            alt={uploadedFiles[index].name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedFile(index)}
                              className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-1 text-xs truncate">
                            {uploadedFiles[index].name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Imágenes actuales:</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {existingAttachments.map((att) => (
                        <div 
                          key={att.id} 
                          className="relative group rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all duration-200"
                        >
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${att.url}`}
                            alt={att.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingAttachment(att.id)}
                              className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-1 text-xs truncate">
                            {att.name}
                          </div>
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Vista Previa
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

      <ContentPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        data={{
          ...formData,
          attachments: existingAttachments,
        }}
        categories={categories}
        companies={companies}
      />

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contenido guardado exitosamente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas regresar a la lista de contenidos o continuar editando?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSuccessDialog(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/contentinfo')}>
              Regresar a la lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentInfoForm;
