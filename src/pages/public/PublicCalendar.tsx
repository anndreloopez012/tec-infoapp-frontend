import { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Event as CalendarEventType } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { publicEventService } from '@/services/publicApiService';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import LoadingSpinner from '@/components/common/LoadingSpinner';

moment.locale('es');
const localizer = momentLocalizer(moment);

interface EventData {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  content?: string;
  type_event?: any;
  location?: any;
  organizers_company?: any;
  main_image?: any;
}

interface CalendarEvent extends CalendarEventType {
  resource: EventData;
}

export default function PublicCalendar() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const result = await publicEventService.getAll({
        pageSize: 1000,
        populate: '*',
      });

      if (result.success) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      title: event.title,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      resource: event,
    }));
  }, [events]);

  const handleSelectEvent = (event: CalendarEvent) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setSelectedEvent(event.resource);
        setIsDialogOpen(true);
      });
    } else {
      setSelectedEvent(event.resource);
      setIsDialogOpen(true);
    }
  };

  const addToGoogleCalendar = () => {
    if (!selectedEvent) return;

    const startDate = new Date(selectedEvent.start_date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(selectedEvent.end_date).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const details = encodeURIComponent(selectedEvent.description || '');
    const location = encodeURIComponent(selectedEvent.location?.name || '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource.type_event?.color || '#3b82f6';
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <div className="container py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Calendario de Eventos</h1>
          <p className="text-muted-foreground text-lg">
            Visualiza todos los eventos del TEC en un calendario interactivo
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'No hay eventos en este rango',
              }}
            />
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                {selectedEvent?.title}
              </DialogTitle>
              {selectedEvent?.description && (
                <DialogDescription className="text-base">
                  {selectedEvent.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-4">
              {selectedEvent?.main_image && (
                <img
                  src={
                    selectedEvent.main_image.url?.startsWith('http')
                      ? selectedEvent.main_image.url
                      : `${API_CONFIG.BASE_URL}${selectedEvent.main_image.url}`
                  }
                  alt={selectedEvent.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">Inicio:</span>
                  {selectedEvent && format(new Date(selectedEvent.start_date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">Fin:</span>
                  {selectedEvent && format(new Date(selectedEvent.end_date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </div>

                {selectedEvent?.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Ubicación:</span>
                    {selectedEvent.location.name}
                  </div>
                )}

                {selectedEvent?.organizers_company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Organizador:</span>
                    {selectedEvent.organizers_company.name}
                  </div>
                )}

                {selectedEvent?.content && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-2">Detalles:</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.content}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={addToGoogleCalendar} className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Agregar a Google Calendar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
