import { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import { Calendar as CalendarIcon, MapPin, Users, Download, X, Apple, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as MiniCalendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { eventService } from "@/services/catalogServices";
import { eventAttendanceService } from "@/services/eventAttendanceService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { API_CONFIG } from "@/config/api";

moment.locale("es");
const localizer = momentLocalizer(moment);

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
}

interface CalendarEvent extends BigCalendarEvent {
  id?: number;
  documentId?: string;
  resource?: EventData;
}

const EventCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("week");
  const [selectedEventTypes, setSelectedEventTypes] = useState<number[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await eventService.getAll({
        pageSize: 1000,
        populate: "*",
      });

      if (result.success) {
        setEvents(result.data);
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

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = events
      .map((event) => event.type_event)
      .filter((type) => type != null);
    const unique = Array.from(new Map(types.map((t) => [t.id, t])).values());
    return unique;
  }, [events]);

  // Filter events by selected types
  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.length === 0) return events;
    return events.filter((event) =>
      event.type_event && selectedEventTypes.includes(event.type_event.id)
    );
  }, [events, selectedEventTypes]);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      documentId: event.documentId,
      title: event.title || "Sin título",
      start: event.start_date ? new Date(event.start_date) : new Date(),
      end: event.end_date ? new Date(event.end_date) : new Date(),
      resource: event,
    }));
  }, [filteredEvents]);

  const handleSelectEvent = async (event: CalendarEvent) => {
    setSelectedEvent(event.resource || null);
    setIsDialogOpen(true);
    
    // Check attendance for this event
    if (event.documentId && user?.documentId) {
      const result = await eventAttendanceService.checkAttendance(
        event.documentId,
        user.documentId
      );
      
      if (result.success && result.data) {
        setIsAttending(result.data.status_attendance === 'confirmed');
        setAttendanceId(result.data.documentId);
      } else {
        setIsAttending(false);
        setAttendanceId(null);
      }
    }
  };

  const toggleEventType = (typeId: number) => {
    setSelectedEventTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const addToGoogleCalendar = () => {
    if (!selectedEvent) return;

    const startDate = selectedEvent.start_date 
      ? new Date(selectedEvent.start_date).toISOString().replace(/-|:|\.\d\d\d/g, "")
      : "";
    const endDate = selectedEvent.end_date 
      ? new Date(selectedEvent.end_date).toISOString().replace(/-|:|\.\d\d\d/g, "")
      : "";

    const title = encodeURIComponent(selectedEvent.title || "");
    const description = encodeURIComponent(selectedEvent.description || "");
    const location = encodeURIComponent(selectedEvent.location?.name || "");

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`;

    window.open(googleCalendarUrl, "_blank");

    toast({
      title: "Abriendo Google Calendar",
      description: "Se abrirá una nueva pestaña para agregar el evento",
    });
  };

  const addToAppleCalendar = () => {
    if (!selectedEvent) return;

    const formatICSDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TEC//Event Calendar//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${selectedEvent.documentId || selectedEvent.id}@tec.com
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART:${formatICSDate(selectedEvent.start_date || new Date().toISOString())}
DTEND:${formatICSDate(selectedEvent.end_date || new Date().toISOString())}
SUMMARY:${selectedEvent.title || ""}
DESCRIPTION:${(selectedEvent.description || "").replace(/\n/g, "\\n")}
LOCATION:${selectedEvent.location?.name || ""}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.title?.replace(/\s+/g, "-") || "evento"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Descargando evento",
      description: "El archivo se ha descargado para Apple Calendar",
    });
  };

  const handleAttendance = async () => {
    if (!selectedEvent?.documentId || !user?.documentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para confirmar asistencia",
      });
      return;
    }

    setAttendanceLoading(true);

    try {
      if (isAttending && attendanceId) {
        // Cancelar asistencia
        const result = await eventAttendanceService.cancelAttendance(attendanceId);
        
        if (result.success) {
          setIsAttending(false);
          setAttendanceId(null);
          
          toast({
            title: "Asistencia cancelada",
            description: "Tu asistencia ha sido cancelada exitosamente",
          });
        }
      } else {
        // Confirmar asistencia
        const result = await eventAttendanceService.createAttendance(
          selectedEvent.documentId,
          user.documentId
        );
        
        if (result.success) {
          setIsAttending(true);
          setAttendanceId(result.data.documentId);
          
          toast({
            title: "¡Asistencia confirmada!",
            description: "Te esperamos en el evento",
          });
        }
      }
    } catch (error) {
      console.error("Error handling attendance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la solicitud",
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource?.type_event?.color || "#3174ad";
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        padding: "4px 8px",
      },
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Eventos</h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona eventos en el calendario
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block space-y-6">
          {/* Mini Calendar */}
          <div className="bg-card rounded-lg border shadow-sm p-4">
            <MiniCalendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              className="rounded-md"
            />
          </div>

          {/* Event Type Filters */}
          {eventTypes.length > 0 && (
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="font-semibold mb-4 text-sm">Filtrar por tipo</h3>
              <div className="space-y-3">
                {eventTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={selectedEventTypes.includes(type.id)}
                      onCheckedChange={() => toggleEventType(type.id)}
                    />
                    <Label
                      htmlFor={`type-${type.id}`}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: type.color || "#3b82f6" }}
                      />
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-2 md:p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (currentView === "month") {
                      newDate.setMonth(newDate.getMonth() - 1);
                    } else if (currentView === "week") {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setDate(newDate.getDate() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                  className="h-8 md:h-10 text-xs md:text-sm"
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 md:h-10 md:w-10"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (currentView === "month") {
                      newDate.setMonth(newDate.getMonth() + 1);
                    } else if (currentView === "week") {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setDate(newDate.getDate() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-sm md:text-lg font-semibold">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </h2>
            </div>

            <div className="flex gap-1 md:gap-2 w-full md:w-auto justify-end">
              <Button
                variant={currentView === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("day")}
                className="text-xs px-2 md:px-3"
              >
                <span className="hidden sm:inline">Día</span>
                <span className="sm:hidden">D</span>
              </Button>
              <Button
                variant={currentView === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("week")}
                className="text-xs px-2 md:px-3"
              >
                <span className="hidden sm:inline">Semana</span>
                <span className="sm:hidden">S</span>
              </Button>
              <Button
                variant={currentView === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("month")}
                className="text-xs px-2 md:px-3"
              >
                <span className="hidden sm:inline">Mes</span>
                <span className="sm:hidden">M</span>
              </Button>
              <Button
                variant={currentView === "agenda" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("agenda")}
                className="text-xs px-2 md:px-3"
              >
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">A</span>
              </Button>
            </div>
          </div>

          <div className="p-2 md:p-4 h-[500px] md:h-[700px]">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={setCurrentDate}
              view={currentView}
              onView={setCurrentView}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay eventos en este rango",
                showMore: (total) => `+ Ver más (${total})`,
              }}
              className="modern-calendar"
            />
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedEvent?.title || "Sin título"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.description || "Sin descripción"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedEvent?.main_image && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={
                    selectedEvent.main_image.url.startsWith("http")
                      ? selectedEvent.main_image.url
                      : `${API_CONFIG.BASE_URL}${selectedEvent.main_image.url}`
                  }
                  alt={selectedEvent.title || "Imagen del evento"}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedEvent?.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fecha de inicio</p>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedEvent.start_date), "dd 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent?.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fecha de fin</p>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedEvent.end_date), "dd 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent?.type_event && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Tipo de evento</p>
                    <Badge>{selectedEvent.type_event.name}</Badge>
                  </div>
                </div>
              )}

              {selectedEvent?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-muted-foreground">{selectedEvent.location.name}</p>
                  </div>
                </div>
              )}

              {selectedEvent?.organizers_company && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Organizador</p>
                    <p className="text-muted-foreground">
                      {selectedEvent.organizers_company.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedEvent?.content && (
              <div className="space-y-2">
                <p className="font-medium">Contenido</p>
                <p className="text-sm text-muted-foreground">{selectedEvent.content}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={handleAttendance} 
                variant={isAttending ? "outline" : "default"}
                disabled={attendanceLoading}
                className="w-full"
              >
                {attendanceLoading ? (
                  "Procesando..."
                ) : isAttending ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Cancelar asistencia
                  </>
                ) : (
                  "Asistir al evento"
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addToGoogleCalendar} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Google Calendar
                </Button>
                <Button onClick={addToAppleCalendar} variant="outline">
                  <Apple className="h-4 w-4 mr-2" />
                  Apple Calendar
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;
