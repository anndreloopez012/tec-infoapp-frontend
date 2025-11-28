import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ticketService, ticketStatusService, ticketPriorityService, ticketTypeService, companyService } from '@/services/catalogServices';
import { API_CONFIG } from '@/config/api';
import { FileUploadWithPreview } from '@/components/tickets/FileUploadWithPreview';
import { FileGallery } from '@/components/tickets/FileGallery';

const ticketSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  ticket_type: z.string().optional(),
  ticket_priority: z.string().optional(),
  ticket_status: z.string().optional(),
  companies: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface FollowUp {
  id?: number;
  Comentario: string;
  Adjuntos?: any[];
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [ticketStatuses, setTicketStatuses] = useState([]);
  const [ticketPriorities, setTicketPriorities] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  const canCreate = hasPermission('api::ticket.ticket.create');
  const canUpdate = hasPermission('api::ticket.ticket.update');
  const isReadOnly = isNew ? !canCreate : !canUpdate;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadRelatedData();
    if (!isNew && id) {
      loadTicketData(id);
    }
  }, [id]);

  const loadRelatedData = async () => {
    try {
      const [statusesRes, prioritiesRes, typesRes, companiesRes] = await Promise.all([
        ticketStatusService.getAll({ pagination: { pageSize: 100 } }),
        ticketPriorityService.getAll({ pagination: { pageSize: 100 } }),
        ticketTypeService.getAll({ pagination: { pageSize: 100 } }),
        companyService.getAll({ pagination: { pageSize: 100 } }),
      ]);

      setTicketStatuses(statusesRes.data || []);
      setTicketPriorities(prioritiesRes.data || []);
      setTicketTypes(typesRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error: any) {
      console.error('Error al cargar datos relacionados:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos relacionados",
        variant: "destructive",
      });
    }
  };

  const loadTicketData = async (ticketId: string) => {
    try {
      setLoading(true);
      const params = {
        populate: ['ticket_status', 'ticket_priority', 'ticket_type', 'companies', 'media', 'followup', 'followup.Adjuntos'],
      };
      
      const response = await ticketService.getById(ticketId);
      const ticket = response.data;

      if (ticket) {
        setValue('name', ticket.name || '');
        setValue('description', ticket.description || '');
        setValue('ticket_status', ticket.ticket_status?.documentId || '');
        setValue('ticket_priority', ticket.ticket_priority?.documentId || '');
        setValue('ticket_type', ticket.ticket_type?.documentId || '');
        setValue('companies', ticket.companies?.map((c: any) => c.documentId) || []);
        
        setFollowUps(ticket.followup || []);
        setMediaFiles(ticket.media || []);
      }
    } catch (error: any) {
      console.error('Error al cargar ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cargar el ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (files: File[]) => {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error?.message || 'Error al subir archivos');
      }

      const uploadedFiles = await response.json();
      setMediaFiles(prev => [...prev, ...uploadedFiles]);
      
      toast({
        title: "Archivos subidos",
        description: `${uploadedFiles.length} archivo(s) subido(s) correctamente`,
      });
    } catch (error: any) {
      console.error('Error al subir archivos:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir los archivos",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeMediaFile = (fileId: number) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addFollowUp = () => {
    setFollowUps(prev => [...prev, { Comentario: '', Adjuntos: [] }]);
  };

  const removeFollowUp = (index: number) => {
    setFollowUps(prev => prev.filter((_, i) => i !== index));
  };

  const updateFollowUp = (index: number, field: keyof FollowUp, value: any) => {
    setFollowUps(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const onSubmit = async (data: TicketFormData) => {
    if (isReadOnly) {
      toast({
        title: "Sin permisos",
        description: `No tienes permisos para ${isNew ? 'crear' : 'editar'} tickets`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        name: data.name,
        description: data.description,
        media: mediaFiles.map(f => f.id),
        followup: followUps.filter(f => f.Comentario.trim()),
      };

      if (data.ticket_status) payload.ticket_status = data.ticket_status;
      if (data.ticket_priority) payload.ticket_priority = data.ticket_priority;
      if (data.ticket_type) payload.ticket_type = data.ticket_type;
      if (data.companies && data.companies.length > 0) payload.companies = data.companies;

      if (isNew) {
        await ticketService.create(payload);
        toast({
          title: "Ticket creado",
          description: "El ticket ha sido creado correctamente",
        });
      } else {
        await ticketService.update(id!, payload);
        toast({
          title: "Ticket actualizado",
          description: "El ticket ha sido actualizado correctamente",
        });
      }

      navigate('/ticket');
    } catch (error: any) {
      console.error('Error al guardar ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el ticket",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/ticket')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al listado
        </Button>
        
        <h1 className="text-3xl font-bold">
          {isNew ? 'Crear Ticket' : 'Detalle del Ticket'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Ticket</CardTitle>
            <CardDescription>Datos principales del ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name')}
                disabled={isReadOnly}
                placeholder="Nombre del ticket"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                disabled={isReadOnly}
                placeholder="Descripción del ticket"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ticket_status">Estado</Label>
                <Select
                  value={watch('ticket_status') || ''}
                  onValueChange={(value) => setValue('ticket_status', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketStatuses.map((status: any) => (
                      <SelectItem key={status.documentId} value={status.documentId}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ticket_priority">Prioridad</Label>
                <Select
                  value={watch('ticket_priority') || ''}
                  onValueChange={(value) => setValue('ticket_priority', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketPriorities.map((priority: any) => (
                      <SelectItem key={priority.documentId} value={priority.documentId}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ticket_type">Tipo</Label>
                <Select
                  value={watch('ticket_type') || ''}
                  onValueChange={(value) => setValue('ticket_type', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypes.map((type: any) => (
                      <SelectItem key={type.documentId} value={type.documentId}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Archivos adjuntos */}
        <Card>
          <CardHeader>
            <CardTitle>Archivos Adjuntos</CardTitle>
            <CardDescription>Documentos, imágenes o videos relacionados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isReadOnly && (
              <FileUploadWithPreview
                onUpload={handleMediaUpload}
                disabled={isReadOnly}
                maxFiles={20}
              />
            )}

            {mediaFiles.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4">
                  Archivos subidos ({mediaFiles.length})
                </h3>
                <FileGallery
                  files={mediaFiles}
                  onRemove={!isReadOnly ? removeMediaFile : undefined}
                  readOnly={isReadOnly}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seguimiento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Seguimiento</CardTitle>
                <CardDescription>Comentarios y actualizaciones del ticket</CardDescription>
              </div>
              {!isReadOnly && (
                <Button type="button" variant="outline" size="sm" onClick={addFollowUp}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay seguimientos registrados</p>
            ) : (
              followUps.map((followUp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Label>Comentario {index + 1}</Label>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFollowUp(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={followUp.Comentario}
                    onChange={(e) => updateFollowUp(index, 'Comentario', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Escribir comentario..."
                    rows={3}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/ticket')}
          >
            Cancelar
          </Button>
          {!isReadOnly && (
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : isNew ? 'Crear Ticket' : 'Actualizar Ticket'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
