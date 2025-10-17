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
import { eventAttendanceService } from "@/services/catalogServices";
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
  event?: string | any;
  attendee?: string | any;
  status?: string;
  attendance_date?: string;
  notes?: string;
  check_in_time?: string;
  check_out_time?: string;
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

  const [formData, setFormData] = useState<EventData>({
    event: "",
    attendee: "",
    status: "pending",
    attendance_date: "",
    notes: "",
    check_in_time: "",
    check_out_time: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [currentPage]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await eventAttendanceService.getAll({
        page: currentPage,
        pageSize: pageSize,
        populate: "*",
        searchFields: ["event", "attendee", "status"],
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
      item.event?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.attendee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      event: "",
      attendee: "",
      status: "pending",
      attendance_date: "",
      notes: "",
      check_in_time: "",
      check_out_time: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: EventData) => {
    setEditingItem(item);
    
    setFormData({
      event: item.event || "",
      attendee: item.attendee || "",
      status: item.status || "pending",
      attendance_date: item.attendance_date || "",
      notes: item.notes || "",
      check_in_time: item.check_in_time || "",
      check_out_time: item.check_out_time || "",
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
      const result = await eventAttendanceService.delete(deletingItem.documentId);

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Asistencia eliminada correctamente",
        });
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar la asistencia",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event?.trim() || !formData.attendee?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El evento y el asistente son requeridos",
      });
      return;
    }

    try {
      const payload: any = {
        event: formData.event,
        attendee: formData.attendee,
        status: formData.status,
        attendance_date: formData.attendance_date,
        notes: formData.notes,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
      };

      const result = editingItem
        ? await eventAttendanceService.update(editingItem.documentId!, payload)
        : await eventAttendanceService.create(payload);

      if (result.success) {
        toast({
          title: "Éxito",
          description: editingItem
            ? "Asistencia actualizada correctamente"
            : "Asistencia creada correctamente",
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
        description: error.message || "No se pudo guardar la asistencia",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            Gestiona la asistencia a eventos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Asistencia
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
                        {typeof item.event === 'object' && item.event !== null
                          ? (item.event as any).title || (item.event as any).name || "Sin evento"
                          : item.event || "Sin evento"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Users className="h-4 w-4" />
                        {typeof item.attendee === 'object' && item.attendee !== null
                          ? (item.attendee as any).name || (item.attendee as any).username || "Sin asistente"
                          : item.attendee || "Sin asistente"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.attendance_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(item.attendance_date), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                    )}
                    
                    {item.check_in_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Entrada: {item.check_in_time}
                      </div>
                    )}
                    
                    {item.check_out_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Salida: {item.check_out_time}
                      </div>
                    )}
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {item.notes}
                      </p>
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
              {editingItem ? "Editar Asistencia" : "Nueva Asistencia"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifica los datos de la asistencia al evento"
                : "Completa los datos para registrar una nueva asistencia"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Evento *</Label>
                <Input
                  id="event"
                  value={formData.event}
                  onChange={(e) =>
                    setFormData({ ...formData, event: e.target.value })
                  }
                  placeholder="Nombre del evento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee">Asistente *</Label>
                <Input
                  id="attendee"
                  value={formData.attendee}
                  onChange={(e) =>
                    setFormData({ ...formData, attendee: e.target.value })
                  }
                  placeholder="Nombre del asistente"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendance_date">Fecha de Asistencia</Label>
                <Input
                  id="attendance_date"
                  type="date"
                  value={formData.attendance_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, attendance_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in_time">Hora de Entrada</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, check_in_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out_time">Hora de Salida</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, check_out_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Notas adicionales sobre la asistencia"
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
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              asistencia de "{typeof deletingItem?.attendee === 'object' 
                ? (deletingItem?.attendee as any)?.name || (deletingItem?.attendee as any)?.username 
                : deletingItem?.attendee}" al evento "{typeof deletingItem?.event === 'object'
                ? (deletingItem?.event as any)?.title || (deletingItem?.event as any)?.name
                : deletingItem?.event}".
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
