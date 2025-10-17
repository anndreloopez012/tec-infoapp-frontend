import { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, Event as BigCalendarEvent } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as CalendarIcon, MapPin, Users, Clock, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { eventService } from "@/services/catalogServices";
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
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      documentId: event.documentId,
      title: event.title || "Sin título",
      start: event.start_date ? new Date(event.start_date) : new Date(),
      end: event.end_date ? new Date(event.end_date) : new Date(),
      resource: event,
    }));
  }, [events]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event.resource || null);
    setIsDialogOpen(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Eventos</h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona eventos en el calendario
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 shadow-lg" style={{ height: "700px" }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
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
        />
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

            <div className="flex gap-2 pt-4">
              <Button onClick={addToGoogleCalendar} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Agregar a Google Calendar
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
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
