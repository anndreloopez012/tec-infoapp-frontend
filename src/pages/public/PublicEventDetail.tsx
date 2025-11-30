import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { publicEventService } from '@/services/publicApiService';
import { API_CONFIG } from '@/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LexicalViewer from '@/components/editor/LexicalViewer';
import { ShareButtons } from '@/components/public/ShareButtons';

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

export default function PublicEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  const loadEvent = async (id: string) => {
    setLoading(true);
    try {
      const result = await publicEventService.getById(id);

      if (result.success && result.data) {
        setEvent(result.data);
      } else {
        navigate('/public/events');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      navigate('/public/events');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: any) => {
    if (!image?.url) return '';
    return image.url.startsWith('http') ? image.url : `${API_CONFIG.BASE_URL}${image.url}`;
  };

  const addToGoogleCalendar = () => {
    if (!event || !event.start_date) return;

    const startDate = new Date(event.start_date);
    const endDate = event.end_date
      ? new Date(event.end_date)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Evento',
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: event.description || '',
      location: event.location?.name || '',
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const addToAppleCalendar = () => {
    if (!event || !event.start_date) return;

    const startDate = new Date(event.start_date);
    const endDate = event.end_date
      ? new Date(event.end_date)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title || 'Evento'}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location?.name || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title || 'evento'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Evento no encontrado</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/public/events')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a eventos
        </Button>

        <Card>
          {event.main_image && (
            <div className="relative h-96 overflow-hidden rounded-t-lg">
              <img
                src={getImageUrl(event.main_image)}
                alt={event.title || 'Evento'}
                className="w-full h-full object-cover"
              />
              {event.type_event && (
                <Badge
                  className="absolute top-4 right-4 text-base px-4 py-2"
                  style={{
                    backgroundColor: event.type_event.color || '#3b82f6',
                    color: 'white',
                  }}
                >
                  {event.type_event.name}
                </Badge>
              )}
            </div>
          )}

          <CardContent className="p-8 space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{event.title || 'Sin título'}</h1>
              {event.description && (
                <p className="text-lg text-muted-foreground">{event.description}</p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.start_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Fecha de inicio</p>
                    <p className="text-muted-foreground">
                      {format(
                        new Date(event.start_date),
                        "dd 'de' MMMM, yyyy 'a las' HH:mm",
                        { locale: es }
                      )}
                    </p>
                  </div>
                </div>
              )}

              {event.end_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Fecha de finalización</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.end_date), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-muted-foreground">{event.location.name}</p>
                  </div>
                </div>
              )}

              {event.organizers_company && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Organizado por</p>
                    <p className="text-muted-foreground">{event.organizers_company.name}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={addToGoogleCalendar}
                className="flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Google Calendar
              </Button>

              <Button
                variant="outline"
                onClick={addToAppleCalendar}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Apple Calendar
              </Button>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Descripción del evento</h2>
                <ShareButtons url={window.location.href} title={event.title || 'Evento'} />
              </div>

              {event.content ? (
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                  <LexicalViewer content={event.content} />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay descripción detallada disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
