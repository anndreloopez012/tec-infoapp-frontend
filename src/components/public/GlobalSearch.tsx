import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar as CalendarIcon, X, Loader2, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { publicContentService, publicEventService } from '@/services/publicApiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

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
          pageSize: 10,
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
          pageSize: 10,
          populate: '*',
          additionalFilters: {
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
          category: item.type_event,
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
      navigate(`/public/events/${result.documentId}`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Command className="h-5 w-5 text-primary" />
            Buscar en todas las categorías
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar contenido, eventos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[500px] px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Buscando...</p>
              </div>
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Comienza tu búsqueda</p>
                <p className="text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar en todas las categorías
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">No se encontraron resultados</p>
                <p className="text-sm text-muted-foreground">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl hover:bg-accent transition-all duration-200',
                    'flex items-start gap-4 group border border-transparent hover:border-primary/20'
                  )}
                >
                  <div
                    className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                      result.type === 'content'
                        ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground'
                    )}
                  >
                    {result.type === 'content' ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <CalendarIcon className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-medium">
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
        </ScrollArea>

        {results.length > 0 && (
          <div className="px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Mostrando {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
