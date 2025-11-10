import { useState, useEffect } from 'react';
import { publicEventService } from '@/services/publicApiService';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

export default function PublicEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, events]);

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      setCurrentPage(1);
      return;
    }

    const filtered = events.filter(
      (event) =>
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
    setCurrentPage(1);
  };

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredEvents.length / pageSize);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="container py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Eventos</h1>
          <p className="text-muted-foreground text-lg">
            Descubre todos los eventos organizados por el TEC
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        ) : paginatedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                No se encontraron eventos
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-lg transition-all duration-300 hover-scale border-primary/20"
                >
                  {event.main_image && (
                    <div className="overflow-hidden rounded-t-lg">
                      <img
                        src={
                          event.main_image.url?.startsWith('http')
                            ? event.main_image.url
                            : `${API_CONFIG.BASE_URL}${event.main_image.url}`
                        }
                        alt={event.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {event.title}
                    </CardTitle>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(event.start_date), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>

                    {event.type_event && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.type_event.name}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages && setCurrentPage(currentPage + 1)
                      }
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}
