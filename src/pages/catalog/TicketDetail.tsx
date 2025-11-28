import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { ticketService, ticketStatusService, ticketPriorityService, ticketTypeService, companyService } from '@/services/catalogServices';
import { userService } from '@/services/userService';
import { API_CONFIG } from '@/config/api';
import { FileUploadWithPreview } from '@/components/tickets/FileUploadWithPreview';
import { FileGallery } from '@/components/tickets/FileGallery';
import { cn } from '@/lib/utils';

const ticketSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  ticket_type: z.string().optional(),
  ticket_priority: z.string().optional(),
  ticket_status: z.string().optional(),
  companies: z.array(z.string()).optional(),
  users_permissions_users: z.array(z.string()).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface FollowUp {
  id?: number;
  Comentario: string;
  Adjuntos?: any[];
  createdBy?: any;
  isSaved?: boolean;
  isEditing?: boolean;
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const { user } = useAuth();

  const canCreate = hasPermission('api::ticket.ticket.create');
  const canUpdate = hasPermission('api::ticket.ticket.update');
  const isReadOnly = isNew ? !canCreate : !canUpdate;

  // Verificar si el usuario tiene rol super/admin/super_admin
  const userRole = user?.role?.type || user?.role?.name || '';
  const isSuperAdmin = ['super', 'admin', 'super_admin'].includes(userRole.toLowerCase());

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

  // Si el usuario NO es super admin, pre-seleccionar su empresa automáticamente
  useEffect(() => {
    if (!isSuperAdmin && user && isNew) {
      // Obtener empresa del usuario
      const userCompanyId = user.company?.documentId || user.company?.id;
      const userCompaniesIds = user.companies?.map((c: any) => c.documentId || c.id) || [];
      
      // Si tiene empresa(s), pre-seleccionar
      if (userCompanyId) {
        console.log('🏢 Pre-seleccionando empresa del usuario:', userCompanyId);
        setValue('companies', [userCompanyId]);
      } else if (userCompaniesIds.length > 0) {
        console.log('🏢 Pre-seleccionando empresas del usuario:', userCompaniesIds);
        setValue('companies', userCompaniesIds);
      }
    }
  }, [user, isSuperAdmin, isNew]);

  // Filtrar usuarios cuando cambien las empresas seleccionadas
  useEffect(() => {
    const selectedCompanies = watch('companies') || [];
    
    console.log('🔍 Empresas seleccionadas:', selectedCompanies);
    
    if (selectedCompanies.length === 0) {
      console.log('⚠️ No hay empresas seleccionadas, limpiando usuarios');
      setFilteredUsers([]);
      return;
    }

    // Hacer llamada al API con filtro de empresas
    const fetchFilteredUsers = async () => {
      try {
        console.log('📞 Llamando al API para obtener usuarios...');
        const response = await userService.getUsers({ pageSize: 1000 });
        
        console.log('📦 Usuarios obtenidos del API:', response.data?.length || 0);
        
        // Filtrar manualmente ya que el API puede no soportar el filtro $or complejo
        const filtered = (response.data || []).filter((u: any) => {
          if (!u.company && !u.companies) {
            console.log('❌ Usuario sin empresa:', u.username || u.email);
            return false;
          }
          
          const userCompanyIds = u.companies 
            ? u.companies.map((c: any) => c.documentId || c.id)
            : u.company 
              ? [u.company.documentId || u.company.id]
              : [];
          
          const matches = userCompanyIds.some((cId: string) => selectedCompanies.includes(cId));
          
          if (matches) {
            console.log('✅ Usuario coincide:', u.username || u.email, 'empresas:', userCompanyIds);
          }
          
          return matches;
        });
        
        console.log('🎯 Usuarios filtrados:', filtered.length);
        setFilteredUsers(filtered);
      } catch (error) {
        console.error('❌ Error al filtrar usuarios:', error);
        setFilteredUsers([]);
      }
    };

    fetchFilteredUsers();
  }, [watch('companies')]);

  const loadRelatedData = async () => {
    try {
      const [statusesRes, prioritiesRes, typesRes, companiesRes, usersRes] = await Promise.all([
        ticketStatusService.getAll({ pagination: { pageSize: 100 } }),
        ticketPriorityService.getAll({ pagination: { pageSize: 100 } }),
        ticketTypeService.getAll({ pagination: { pageSize: 100 } }),
        companyService.getAll({ pagination: { pageSize: 100 } }),
        userService.getUsers({ pageSize: 1000 }),
      ]);

      setTicketStatuses(statusesRes.data || []);
      setTicketPriorities(prioritiesRes.data || []);
      setTicketTypes(typesRes.data || []);
      setCompanies(companiesRes.data || []);
      setAllUsers(usersRes.data || []);
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
        populate: {
          ticket_status: true,
          ticket_priority: true,
          ticket_type: true,
          companies: true,
          users_permissions_users: true,
          media: true,
          followup: {
            populate: ['Adjuntos']
          }
        }
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
        setValue('users_permissions_users', ticket.users_permissions_users?.map((u: any) => String(u.id)) || []);
        
        console.log('Ticket followup data:', ticket.followup);
        
        // Marcar seguimientos cargados como guardados
        setFollowUps((ticket.followup || []).map((f: any) => {
          console.log('Followup item:', f);
          return {
            ...f,
            isSaved: true,
            isEditing: false
          };
        }));
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

  const handleFollowUpMediaUpload = async (index: number, files: File[]) => {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || API_CONFIG.AUTH_TOKEN;

      const response = await fetch(`${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al subir archivos');
      }

      const uploadedFiles = await response.json();
      
      // Actualizar adjuntos del followup específico
      setFollowUps(prev => prev.map((item, i) => 
        i === index 
          ? { ...item, Adjuntos: [...(item.Adjuntos || []), ...uploadedFiles] }
          : item
      ));
      
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

  const removeFollowUpMedia = (followUpIndex: number, fileId: number) => {
    setFollowUps(prev => prev.map((item, i) => 
      i === followUpIndex 
        ? { ...item, Adjuntos: (item.Adjuntos || []).filter(f => f.id !== fileId) }
        : item
    ));
  };

  const addFollowUp = () => {
    setFollowUps(prev => [...prev, { 
      Comentario: '', 
      Adjuntos: [],
      isSaved: false,
      isEditing: true,
      createdBy: user
    }]);
  };

  const removeFollowUp = (index: number) => {
    setFollowUps(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEditFollowUp = (index: number) => {
    setFollowUps(prev => prev.map((item, i) => 
      i === index ? { ...item, isEditing: !item.isEditing } : item
    ));
  };

  const updateFollowUp = (index: number, field: keyof FollowUp, value: any) => {
    setFollowUps(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const saveFollowUp = async (index: number) => {
    const followUp = followUps[index];
    
    if (!followUp.Comentario.trim()) {
      toast({
        title: "Error",
        description: "El comentario no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    if (isNew) {
      toast({
        title: "Información",
        description: "Debes crear el ticket primero antes de guardar seguimientos",
        variant: "destructive",
      });
      return;
    }

    if (!canUpdate) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para actualizar tickets",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Preparar el seguimiento con el usuario creador
      const followUpToSave = {
        Comentario: followUp.Comentario,
        Adjuntos: (followUp.Adjuntos || []).map(file => file.id),
        createdBy: user?.id
      };

      // Preparar todos los seguimientos: NINGUNO debe perderse
      const allFollowUps = followUps
        .filter(f => f.Comentario.trim() || (f.Adjuntos && f.Adjuntos.length > 0))
        .map(f => ({
          ...(f.id ? { id: f.id } : {}),
          Comentario: f.Comentario,
          Adjuntos: (f.Adjuntos || []).map((file: any) => file.id),
        }));

      const payload = {
        followup: allFollowUps,
      };

      await ticketService.update(id!, payload);
      
      // Marcar el seguimiento como guardado y en modo lectura
      setFollowUps(prev => prev.map((item, i) => 
        i === index 
          ? { ...item, isSaved: true, isEditing: false, createdBy: user }
          : item
      ));
      
      toast({
        title: "Seguimiento guardado",
        description: "El seguimiento ha sido guardado correctamente",
      });

      // Recargar los datos del ticket para obtener el estado actualizado
      await loadTicketData(id!);
    } catch (error: any) {
      console.error('Error al guardar seguimiento:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el seguimiento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
        followup: followUps
          .filter(f => f.Comentario.trim())
          .map(f => ({
            Comentario: f.Comentario,
            Adjuntos: (f.Adjuntos || []).map(file => file.id)
          })),
      };

      if (data.ticket_status) payload.ticket_status = data.ticket_status;
      if (data.ticket_priority) payload.ticket_priority = data.ticket_priority;
      if (data.ticket_type) payload.ticket_type = data.ticket_type;
      if (data.companies && data.companies.length > 0) payload.companies = data.companies;
      if (data.users_permissions_users && data.users_permissions_users.length > 0) {
        payload.users_permissions_users = data.users_permissions_users.map(id => parseInt(id));
      }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Solo mostrar input de empresa si es super admin */}
              {isSuperAdmin && (
                <div>
                  <Label htmlFor="companies">Empresa *</Label>
                  <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={companySearchOpen}
                        disabled={isReadOnly}
                        className="w-full justify-between h-auto min-h-[40px]"
                      >
                        <div className="flex flex-wrap gap-1 flex-1">
                          {watch('companies')?.length ? (
                            watch('companies')?.map((companyId: string) => {
                              const company = companies.find((c: any) => c.documentId === companyId);
                              return company ? (
                                <Badge key={companyId} variant="secondary" className="mr-1">
                                  {company.name}
                                  <button
                                    type="button"
                                    className="ml-1 hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = watch('companies') || [];
                                      setValue('companies', current.filter((id: string) => id !== companyId));
                                      // Limpiar usuarios si no hay empresas
                                      if (current.length === 1) {
                                        setValue('users_permissions_users', []);
                                      }
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-muted-foreground">Seleccionar empresas...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar empresa..." />
                        <CommandList>
                          <CommandEmpty>No se encontró la empresa.</CommandEmpty>
                          <CommandGroup>
                            {companies.map((company: any) => {
                              const isSelected = watch('companies')?.includes(company.documentId);
                              return (
                                <CommandItem
                                  key={company.documentId}
                                  value={company.name}
                                  onSelect={() => {
                                    const current = watch('companies') || [];
                                    if (isSelected) {
                                      setValue('companies', current.filter((id: string) => id !== company.documentId));
                                      // Limpiar usuarios si no hay empresas
                                      if (current.length === 1) {
                                        setValue('users_permissions_users', []);
                                      }
                                    } else {
                                      setValue('companies', [...current, company.documentId]);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {company.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Mostrar input de TEC Member cuando haya empresas seleccionadas (automáticas o manuales) */}
              {watch('companies')?.length > 0 && (
                <div>
                  <Label htmlFor="users_permissions_users">TEC Member</Label>
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        disabled={isReadOnly}
                        className="w-full justify-between h-auto min-h-[40px]"
                      >
                        <div className="flex flex-wrap gap-1 flex-1">
                          {watch('users_permissions_users')?.length ? (
                            watch('users_permissions_users')?.map((userId: string) => {
                              const userItem = allUsers.find((u: any) => String(u.id) === String(userId));
                              return userItem ? (
                                <Badge key={userId} variant="secondary" className="mr-1">
                                  {userItem.username || userItem.email}
                                  <button
                                    type="button"
                                    className="ml-1 hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = watch('users_permissions_users') || [];
                                      setValue('users_permissions_users', current.filter((id: string) => id !== userId));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-muted-foreground">Seleccionar miembros...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar miembro..." />
                        <CommandList>
                          <CommandEmpty>
                            {filteredUsers.length === 0 
                              ? 'No hay usuarios disponibles para la(s) empresa(s) seleccionada(s)' 
                              : 'No se encontró el miembro.'}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((userItem: any) => {
                                const isSelected = watch('users_permissions_users')?.includes(String(userItem.id));
                                return (
                                  <CommandItem
                                    key={userItem.id}
                                    value={userItem.username || userItem.email}
                                    onSelect={() => {
                                      const current = watch('users_permissions_users') || [];
                                      if (isSelected) {
                                        setValue('users_permissions_users', current.filter((id: string) => id !== String(userItem.id)));
                                      } else {
                                        setValue('users_permissions_users', [...current, String(userItem.id)]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{userItem.username || userItem.email}</span>
                                      {userItem.email && userItem.username && (
                                        <span className="text-xs text-muted-foreground">{userItem.email}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No hay usuarios disponibles para la(s) empresa(s) seleccionada(s)
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
              followUps.map((followUp, index) => {
                // Por defecto, permitir editar seguimientos si no tienen guardado aún
                // o si es un ticket nuevo y todavía no se ha guardado
                const isInEditMode = followUp.isEditing !== false;
                const canModify = !followUp.isSaved || !isReadOnly;
                
                return (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Label className="text-base font-semibold">Comentario {index + 1}</Label>
                        {followUp.isSaved && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Guardado
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!isReadOnly && followUp.isSaved && !isInEditMode && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEditFollowUp(index)}
                          >
                            Editar
                          </Button>
                        )}
                        {!isReadOnly && isInEditMode && (
                          <>
                            {followUp.isSaved && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEditFollowUp(index)}
                              >
                                Cancelar
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => saveFollowUp(index)}
                              disabled={submitting}
                            >
                              Guardar
                            </Button>
                          </>
                        )}
                        {!isReadOnly && canModify && (
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
                    </div>
                    
                    <Textarea
                      value={followUp.Comentario}
                      onChange={(e) => updateFollowUp(index, 'Comentario', e.target.value)}
                      disabled={!isInEditMode}
                      placeholder="Escribir comentario..."
                      rows={3}
                    />

                    {/* Archivos adjuntos del seguimiento */}
                    <div className="space-y-3">
                      {isInEditMode && (
                        <>
                          <Label className="text-sm font-medium">Subir archivos</Label>
                          <FileUploadWithPreview
                            onUpload={(files) => handleFollowUpMediaUpload(index, files)}
                            disabled={false}
                            maxFiles={10}
                          />
                        </>
                      )}

                      {followUp.Adjuntos && followUp.Adjuntos.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Archivos adjuntos ({followUp.Adjuntos.length})
                          </Label>
                          <FileGallery
                            files={followUp.Adjuntos}
                            onRemove={isInEditMode ? (fileId) => removeFollowUpMedia(index, fileId) : undefined}
                            readOnly={!isInEditMode}
                          />
                        </div>
                      )}
                      
                      {!isInEditMode && (!followUp.Adjuntos || followUp.Adjuntos.length === 0) && (
                        <p className="text-sm text-muted-foreground">Sin archivos adjuntos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )})
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
