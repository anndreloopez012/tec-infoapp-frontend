import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicEventService } from '@/services/publicApiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Grid3x3, List, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

type ViewMode = 'grid' | 'list';

export default function PublicEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Extract unique event types when events change
    const types = events
      .map((event) => event.type_event)
      .filter((type) => type != null);
    const unique = Array.from(new Map(types.map((t) => [t.id, t])).values());
    setEventTypes(unique);
  }, [events]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedType, selectedDate, events]);

  const loadEvents = async () => {
    try {
      const result = await publicEventService.getAll({
        pageSize: 1000,
        populate: '*',
      });

      if (result.success) {
        setEvents(result.data);
        setFilteredEvents(result.data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((event) => event.type_event?.documentId === selectedType);
    }

    // Date filter
    if (selectedDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter((event) => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);

        switch (selectedDate) {
          case 'upcoming':
            return eventDate >= now;
          case 'past':
            return eventDate < now;
          case 'today':
            return eventDate.toDateString() === now.toDateString();
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedDate('all');
  };

  const getImageUrl = (image: any) => {
    if (!image?.url) return '';
    return image.url.startsWith('http') ? image.url : `${API_CONFIG.BASE_URL}${image.url}`;
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/public/events/${eventId}`);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map((event) => (
        <Card
          key={event.id}
          className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
          onClick={() => handleEventClick(event.documentId)}
        >
          {event.main_image && (
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img
                src={getImageUrl(event.main_image)}
                alt={event.title || 'Evento'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {event.type_event && (
                <Badge
                  className="absolute top-3 right-3"
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
          <CardHeader>
            <CardTitle className="line-clamp-2">{event.title || 'Sin título'}</CardTitle>
            <CardDescription className="line-clamp-2">
              {event.description || 'Sin descripción'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_date), "dd 'de' MMMM, yyyy", { locale: es })}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {event.location.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredEvents.map((event) => (
        <Card
          key={event.id}
          className="hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => handleEventClick(event.documentId)}
        >
          <CardContent className="p-6">
            <div className="flex gap-6">
              {event.main_image && (
                <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden">
                  <img
                    src={getImageUrl(event.main_image)}
                    alt={event.title || 'Evento'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-semibold">{event.title || 'Sin título'}</h3>
                  {event.type_event && (
                    <Badge
                      style={{
                        backgroundColor: event.type_event.color || '#3b82f6',
                        color: 'white',
                      }}
                    >
                      {event.type_event.name}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {event.description || 'Sin descripción'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {event.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.start_date), "dd 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Eventos</h1>
            <p className="text-muted-foreground text-lg">
              Descubre todos los eventos organizados por el TEC
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de evento</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.documentId} value={type.documentId}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha</label>
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las fechas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las fechas</SelectItem>
                        <SelectItem value="upcoming">Próximos eventos</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="past">Eventos pasados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(searchQuery || selectedType !== 'all' || selectedDate !== 'all') && (
            <div className="flex gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="gap-2">
                  Búsqueda: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </Badge>
              )}
              {selectedType !== 'all' && (
                <Badge variant="secondary" className="gap-2">
                  Tipo: {eventTypes.find((t) => t.documentId === selectedType)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedType('all')}
                  />
                </Badge>
              )}
              {selectedDate !== 'all' && (
                <Badge variant="secondary" className="gap-2">
                  Fecha:{' '}
                  {selectedDate === 'upcoming'
                    ? 'Próximos'
                    : selectedDate === 'past'
                    ? 'Pasados'
                    : 'Hoy'}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedDate('all')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">No se encontraron eventos</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
          </>
        )}
      </div>
    );
  }
