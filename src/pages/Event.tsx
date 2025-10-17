import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { eventService, eventTypeService, eventLocationService, companyService } from "@/services/catalogServices";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EventData {
  id?: number;
  documentId?: string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  content?: string;
  type_event?: any;
  location?: any;
  organizers_company?: any;
  main_image?: any;
  attendees?: any;
  createdAt?: string;
  updatedAt?: string;
}

const Event = () => {
  const [data, setData] = useState<EventData[]>([]);
  const [filteredData, setFilteredData] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventData | null>(null);
  const [deletingItem, setDeletingItem] = useState<EventData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 9;

  // Dropdown options
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState<EventData>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    content: "",
    type_event: "",
    location: "",
    organizers_company: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadDropdownData();
  }, [currentPage]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const loadDropdownData = async () => {
    try {
      const [typesResult, locationsResult, companiesResult] = await Promise.all([
        eventTypeService.getAll({ pageSize: 100 }),
        eventLocationService.getAll({ pageSize: 100 }),
        companyService.getAll({ pageSize: 100 }),
      ]);

      if (typesResult.success) setEventTypes(typesResult.data);
      if (locationsResult.success) setLocations(locationsResult.data);
      if (companiesResult.success) setCompanies(companiesResult.data);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await eventService.getAll({
        page: currentPage,
        pageSize: pageSize,
        populate: "*",
        searchFields: ["title", "description"],
        search: searchQuery,
      });

      if (result.success) {
        setData(result.data);
        setFilteredData(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.pageCount || 1);
        }
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los eventos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      content: "",
      type_event: "",
      location: "",
      organizers_company: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: EventData) => {
    setEditingItem(item);
    
    setFormData({
      title: item.title || "",
      description: item.description || "",
      start_date: item.start_date ? item.start_date.split('T')[0] : "",
      end_date: item.end_date ? item.end_date.split('T')[0] : "",
      content: item.content || "",
      type_event: item.type_event?.documentId || "",
      location: item.location?.documentId || "",
      organizers_company: item.organizers_company?.documentId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = (item: EventData) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem?.documentId) return;

    try {
      const result = await eventService.delete(deletingItem.documentId);

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Evento eliminado correctamente",
        });
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el evento",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      });
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        content: formData.content,
        type_event: formData.type_event || null,
        location: formData.location || null,
        organizers_company: formData.organizers_company || null,
      };

      const result = editingItem
        ? await eventService.update(editingItem.documentId!, payload)
        : await eventService.create(payload);

      if (result.success) {
        toast({
          title: "Éxito",
          description: editingItem
            ? "Evento actualizado correctamente"
            : "Evento creado correctamente",
        });
        setIsDialogOpen(false);
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el evento",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            Gestiona los eventos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron eventos</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {item.title || "Sin título"}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {item.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.start_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Inicio: {format(new Date(item.start_date), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                    )}
                    
                    {item.end_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Fin: {format(new Date(item.end_date), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                    )}
                    
                    {item.type_event && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Tipo: {item.type_event.name}
                      </div>
                    )}
                    
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {item.location.name}
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfirm(item)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Evento" : "Nuevo Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifica los datos del evento"
                : "Completa los datos para crear un nuevo evento"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Título del evento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Descripción del evento"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha de Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type_event">Tipo de Evento</Label>
                <Select
                  value={formData.type_event || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type_event: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {eventTypes.map((type) => (
                      <SelectItem key={type.documentId} value={type.documentId}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Select
                  value={formData.location || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {locations.map((loc) => (
                      <SelectItem key={loc.documentId} value={loc.documentId}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizers_company">Organizador</Label>
                <Select
                  value={formData.organizers_company || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizers_company: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar organizador" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {companies.map((company) => (
                      <SelectItem key={company.documentId} value={company.documentId}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
                placeholder="Contenido detallado del evento"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              evento "{deletingItem?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Event;
