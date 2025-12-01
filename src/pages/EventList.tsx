import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Grid3x3, List, Search, Filter, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { eventService, eventTypeService } from "@/services/catalogServices";
import { eventAttendanceService } from "@/services/eventAttendanceService";
import { API_CONFIG } from "@/config/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface AttendanceState {
  [eventId: string]: {
    isAttending: boolean;
    attendanceId: string | null;
    loading: boolean;
  };
}

type ViewMode = 'grid' | 'list';

const EventList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [attendanceStates, setAttendanceStates] = useState<AttendanceState>({});

  useEffect(() => {
    loadEvents();
    loadEventTypes();
  }, []);

  useEffect(() => {
    if (events.length > 0 && user?.documentId) {
      checkAllAttendances();
    }
  }, [events, user]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedType, selectedDate, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await eventService.getAll({
        pageSize: 100,
        populate: "*",
      });

      if (result.success) {
        // Filtrar eventos: mostrar los de la empresa del usuario o los que no tienen empresa
        const userCompanyId = user?.company?.documentId;
        const filtered = result.data.filter((event: EventData) => {
          const eventCompanyId = event.organizers_company?.documentId;
          return !eventCompanyId || eventCompanyId === userCompanyId;
        });
        
        setEvents(filtered);
        setFilteredEvents(filtered);
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

  const loadEventTypes = async () => {
    try {
      const result = await eventTypeService.getAll({ pageSize: 100 });
      if (result.success) {
        setEventTypes(result.data);
      }
    } catch (error) {
      console.error("Error loading event types:", error);
    }
  };

  const checkAllAttendances = async () => {
    if (!user?.documentId) return;

    const newStates: AttendanceState = {};
    
    for (const event of events) {
      if (event.documentId) {
        const result = await eventAttendanceService.checkAttendance(
          event.documentId,
          user.documentId
        );
        
        newStates[event.documentId] = {
          isAttending: result.data !== null && result.data.status_attendance === 'confirmed',
          attendanceId: result.data?.documentId || null,
          loading: false,
        };
      }
    }

    setAttendanceStates(newStates);
  };

  const handleAttendance = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.documentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para confirmar asistencia",
      });
      return;
    }

    const currentState = attendanceStates[eventId];
    
    setAttendanceStates(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], loading: true },
    }));

    try {
      if (currentState?.isAttending && currentState.attendanceId) {
        // Cancelar asistencia
        const result = await eventAttendanceService.cancelAttendance(currentState.attendanceId);
        
        if (result.success) {
          setAttendanceStates(prev => ({
            ...prev,
            [eventId]: {
              isAttending: false,
              attendanceId: null,
              loading: false,
            },
          }));
          
          toast({
            title: "Asistencia cancelada",
            description: "Tu asistencia ha sido cancelada exitosamente",
          });
        }
      } else {
        // Confirmar asistencia
        const result = await eventAttendanceService.createAttendance(eventId, user.documentId);
        
        if (result.success) {
          setAttendanceStates(prev => ({
            ...prev,
            [eventId]: {
              isAttending: true,
              attendanceId: result.data.documentId,
              loading: false,
            },
          }));
          
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
      
      setAttendanceStates(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], loading: false },
      }));
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter((event) =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo
    if (selectedType !== "all") {
      filtered = filtered.filter((event) => event.type_event?.documentId === selectedType);
    }

    // Filtro por fecha
    if (selectedDate !== "all") {
      const now = new Date();
      filtered = filtered.filter((event) => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        
        switch (selectedDate) {
          case "upcoming":
            return eventDate >= now;
          case "past":
            return eventDate < now;
          case "today":
            return eventDate.toDateString() === now.toDateString();
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedDate("all");
  };

  const getImageUrl = (image: any) => {
    if (!image?.url) return "";
    return image.url.startsWith('http') ? image.url : `${API_CONFIG.BASE_URL}${image.url}`;
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/event-detail/${eventId}`);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map((event) => {
        const attendanceState = attendanceStates[event.documentId!];
        
        return (
          <Card 
            key={event.id} 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
          >
            <div onClick={() => handleEventClick(event.documentId!)}>
              {event.main_image && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={getImageUrl(event.main_image)}
                    alt={event.title || "Evento"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {event.type_event && (
                    <Badge 
                      className="absolute top-3 right-3"
                      style={{
                        backgroundColor: event.type_event.color || '#3b82f6',
                        color: 'white'
                      }}
                    >
                      {event.type_event.name}
                    </Badge>
                  )}
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title || "Sin título"}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description || "Sin descripción"}
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
            </div>
            <div className="px-6 pb-4">
              <Button
                className="w-full"
                variant={attendanceState?.isAttending ? "outline" : "default"}
                disabled={attendanceState?.loading}
                onClick={(e) => handleAttendance(event.documentId!, e)}
              >
                {attendanceState?.loading ? (
                  "Procesando..."
                ) : attendanceState?.isAttending ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Cancelar asistencia
                  </>
                ) : (
                  "Asistir al evento"
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredEvents.map((event) => {
        const attendanceState = attendanceStates[event.documentId!];
        
        return (
          <Card 
            key={event.id}
            className="hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="flex-1 cursor-pointer" onClick={() => handleEventClick(event.documentId!)}>
                  <div className="flex gap-6">
                    {event.main_image && (
                      <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(event.main_image)}
                          alt={event.title || "Evento"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-semibold">{event.title || "Sin título"}</h3>
                        {event.type_event && (
                          <Badge 
                            style={{
                              backgroundColor: event.type_event.color || '#3b82f6',
                              color: 'white'
                            }}
                          >
                            {event.type_event.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {event.description || "Sin descripción"}
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
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant={attendanceState?.isAttending ? "outline" : "default"}
                    disabled={attendanceState?.loading}
                    onClick={(e) => handleAttendance(event.documentId!, e)}
                  >
                    {attendanceState?.loading ? (
                      "Procesando..."
                    ) : attendanceState?.isAttending ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Cancelar
                      </>
                    ) : (
                      "Asistir"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">
            Explora y participa en nuestros eventos
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
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

        {(searchQuery || selectedType !== "all" || selectedDate !== "all") && (
          <div className="flex gap-2 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="gap-2">
                Búsqueda: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="secondary" className="gap-2">
                Tipo: {eventTypes.find(t => t.documentId === selectedType)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedType("all")} />
              </Badge>
            )}
            {selectedDate !== "all" && (
              <Badge variant="secondary" className="gap-2">
                Fecha: {selectedDate === "upcoming" ? "Próximos" : selectedDate === "past" ? "Pasados" : "Hoy"}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDate("all")} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron eventos</p>
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
};

export default EventList;
