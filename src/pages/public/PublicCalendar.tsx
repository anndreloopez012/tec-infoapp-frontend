import { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Event as CalendarEventType, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { publicEventService } from '@/services/publicApiService';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar as MiniCalendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, MapPin, Users, ExternalLink, Apple, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [selectedEventTypes, setSelectedEventTypes] = useState<number[]>([]);

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
      title: event.title,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      resource: event,
    }));
  }, [filteredEvents]);

  const toggleEventType = (typeId: number) => {
    setSelectedEventTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

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

  const addToAppleCalendar = () => {
    if (!selectedEvent) return;

    const formatICSDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TEC//Event Calendar//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${selectedEvent.documentId}@tec.com
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART:${formatICSDate(selectedEvent.start_date)}
DTEND:${formatICSDate(selectedEvent.end_date)}
SUMMARY:${selectedEvent.title}
DESCRIPTION:${(selectedEvent.description || '').replace(/\n/g, '\\n')}
LOCATION:${selectedEvent.location?.name || ''}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="container py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Calendario de Eventos</h1>
          <p className="text-muted-foreground text-lg">
            Visualiza todos los eventos del TEC en un calendario interactivo
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini Calendar */}
            <Card>
              <CardContent className="p-4">
                <MiniCalendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            {/* Event Type Filters */}
            {eventTypes.length > 0 && (
              <Card>
                <CardContent className="p-4">
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
                            style={{ backgroundColor: type.color || '#3b82f6' }}
                          />
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Calendar */}
          <Card className="border-primary/20">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (currentView === 'month') {
                        newDate.setMonth(newDate.getMonth() - 1);
                      } else if (currentView === 'week') {
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
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (currentView === 'month') {
                        newDate.setMonth(newDate.getMonth() + 1);
                      } else if (currentView === 'week') {
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
                <h2 className="text-lg font-semibold">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={currentView === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('day')}
                >
                  Día
                </Button>
                <Button
                  variant={currentView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={currentView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('month')}
                >
                  Mes
                </Button>
                <Button
                  variant={currentView === 'agenda' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('agenda')}
                >
                  Agenda
                </Button>
              </div>
            </div>

            <CardContent className="p-6" style={{ height: '700px' }}>
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
                className="modern-calendar"
              />
            </CardContent>
          </Card>
        </div>

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

              <div className="flex flex-col gap-2 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={addToGoogleCalendar} variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google Calendar
                  </Button>
                  <Button onClick={addToAppleCalendar} variant="outline">
                    <Apple className="mr-2 h-4 w-4" />
                    Apple Calendar
                  </Button>
                </div>
                <Button variant="default" onClick={() => setIsDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
