import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { publicContentService, publicEventService } from '@/services/publicApiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: number;
  documentId: string;
  title: string;
  subtitle?: string;
  type: 'content' | 'event';
  category?: any;
  publish_date?: string;
  start_date?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search content
        const contentResult = await publicContentService.getAll({
          pageSize: 5,
          populate: '*',
          additionalFilters: {
            'filters[status_content][$eq]': 'published',
            'filters[active][$eq]': true,
            'filters[$or][0][title][$containsi]': query,
            'filters[$or][1][subtitle][$containsi]': query,
          },
        });

        // Search events
        const eventsResult = await publicEventService.getAll({
          pageSize: 5,
          populate: '*',
          additionalFilters: {
            'filters[status][$eq]': 'published',
            'filters[$or][0][title][$containsi]': query,
            'filters[$or][1][description][$containsi]': query,
          },
        });

        const contentResults: SearchResult[] = (contentResult.data || [])
          .filter((item: any) => !item.companies || item.companies.length === 0)
          .map((item: any) => ({
            id: item.id,
            documentId: item.documentId,
            title: item.title,
            subtitle: item.subtitle,
            type: 'content' as const,
            category: item.category_content,
            publish_date: item.publish_date,
          }));

        const eventResults: SearchResult[] = (eventsResult.data || []).map((item: any) => ({
          id: item.id,
          documentId: item.documentId,
          title: item.title,
          subtitle: item.description,
          type: 'event' as const,
          category: item.event_type,
          start_date: item.start_date,
        }));

        setResults([...contentResults, ...eventResults]);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'content') {
      navigate(`/public/content/${result.documentId}`);
    } else {
      navigate('/public/events');
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="Buscar contenido, eventos..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 rounded-full bg-muted/50 border-border/50 focus:bg-background transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <Card className="absolute top-full mt-2 w-full shadow-2xl border-border/50 animate-fade-in z-50 max-h-[400px] overflow-y-auto">
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {query.length < 2
                  ? 'Escribe al menos 2 caracteres para buscar'
                  : 'No se encontraron resultados'}
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors",
                      "flex items-start gap-3 group"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        result.type === 'content'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      )}
                    >
                      {result.type === 'content' ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <CalendarIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {result.type === 'content' ? 'Contenido' : 'Evento'}
                        </Badge>
                        {result.category?.name && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: result.category?.color
                                ? `${result.category.color}20`
                                : 'hsl(var(--muted))',
                              borderColor: result.category?.color || 'hsl(var(--border))',
                            }}
                          >
                            {result.category.name}
                          </Badge>
                        )}
                        {(result.publish_date || result.start_date) && (
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(result.publish_date || result.start_date!),
                              'dd MMM yyyy',
                              { locale: es }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
