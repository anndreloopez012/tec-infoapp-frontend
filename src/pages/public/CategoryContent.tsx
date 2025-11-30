import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicContentService, publicCategoryService } from '@/services/publicApiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Calendar, ArrowRight, Grid3x3, List, LayoutGrid, SlidersHorizontal, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShareButtons } from '@/components/public/ShareButtons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ContentData {
  id: number;
  documentId: string;
  title: string;
  subtitle?: string;
  content?: string;
  publish_date?: string;
  main_image?: any;
  category_content?: any;
  companies?: any[];
  author_content?: any;
}

type ViewMode = 'grid' | 'list' | 'masonry';
type SortOption = 'newest' | 'oldest' | 'title';

export default function CategoryContent() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<ContentData[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const pageSize = 9;

  const authors = Array.from(
    new Set(content.map((item) => item.author_content?.name).filter(Boolean))
  );

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadContent();
    }
  }, [categoryId]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, content, sortBy, selectedAuthor]);

  const loadCategory = async () => {
    if (!categoryId) return;

    const result = await publicCategoryService.getById(categoryId);
    if (result.success) {
      setCategory(result.data);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const result = await publicContentService.getAll({
        pageSize: 1000,
        populate: '*',
        additionalFilters: {
          'filters[category_content][documentId][$eq]': categoryId,
          'filters[status_content][$eq]': 'published',
          'filters[active][$eq]': true,
        },
      });

      if (result.success) {
        // Filter out content that has companies assigned (private content)
        const publicContent = result.data.filter(
          (item: ContentData) => !item.companies || item.companies.length === 0
        );
        setContent(publicContent);
        setFilteredContent(publicContent);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...content];

    // Apply text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply author filter
    if (selectedAuthor !== 'all') {
      filtered = filtered.filter((item) => item.author_content?.name === selectedAuthor);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publish_date || 0).getTime() - new Date(a.publish_date || 0).getTime();
        case 'oldest':
          return new Date(a.publish_date || 0).getTime() - new Date(b.publish_date || 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredContent(filtered);
    setCurrentPage(1);
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData?.url) return null;
    return imageData.url.startsWith('http')
      ? imageData.url
      : `${API_CONFIG.BASE_URL}${imageData.url}`;
  };

  const handleContentClick = (documentId: string) => {
    navigate(`/public/content/${documentId}`);
  };

  const paginatedContent = filteredContent.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredContent.length / pageSize);

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            {category?.name || 'Categoría'}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground text-lg">{category.description}</p>
          )}
        </div>

        {/* Filters and View Controls */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más reciente</SelectItem>
                    <SelectItem value="oldest">Más antiguo</SelectItem>
                    <SelectItem value="title">Título (A-Z)</SelectItem>
                  </SelectContent>
                </Select>

                {authors.length > 0 && (
                  <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                    <SelectTrigger className="w-[180px]">
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los autores</SelectItem>
                      {authors.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Separator orientation="vertical" className="h-10 hidden lg:block" />

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('masonry')}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedAuthor !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Búsqueda: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                {selectedAuthor !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Autor: {selectedAuthor}
                    <button onClick={() => setSelectedAuthor('all')} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando <strong>{paginatedContent.length}</strong> de{' '}
            <strong>{filteredContent.length}</strong> resultados
          </span>
        </div>

        {loading ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            viewMode === 'list' && "grid-cols-1",
            viewMode === 'masonry' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-xl" />
            ))}
          </div>
        ) : paginatedContent.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                No se encontró contenido público en esta categoría
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedContent.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-border/50 hover:border-primary/50 flex flex-col"
                  >
                    <div onClick={() => handleContentClick(item.documentId)}>
                      {/* Image Preview */}
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
                        {item.main_image ? (
                          <img
                            src={getImageUrl(item.main_image)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Floating Category Badge */}
                        {item.category_content?.name && (
                          <Badge 
                            className="absolute top-4 left-4 shadow-lg backdrop-blur-sm"
                            style={{
                              backgroundColor: item.category_content?.color 
                                ? `${item.category_content.color}40`
                                : 'hsl(var(--primary) / 0.2)',
                              borderColor: item.category_content?.color || 'hsl(var(--primary))',
                              color: item.category_content?.color || 'hsl(var(--primary))'
                            }}
                          >
                            {item.category_content.name}
                          </Badge>
                        )}

                        {/* Share Button */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShareButtons
                            url={`/public/content/${item.documentId}`}
                            title={item.title}
                            description={item.subtitle}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <CardHeader className="flex-grow space-y-3 pb-4">
                        <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        {item.subtitle && (
                          <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                            {item.subtitle}
                          </CardDescription>
                        )}
                      </CardHeader>

                      {/* Footer */}
                      <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                          {item.publish_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {format(new Date(item.publish_date), "dd MMM yyyy", {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          )}
                          {item.author_content?.name && (
                            <span className="text-xs">
                              {item.author_content.name}
                            </span>
                          )}
                        </div>

                        {/* Read More Button */}
                        <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                          <span>Leer más</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {paginatedContent.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50"
                  >
                    <div
                      onClick={() => handleContentClick(item.documentId)}
                      className="flex flex-col md:flex-row gap-4 p-4"
                    >
                      {/* Image */}
                      <div className="relative w-full md:w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
                        {item.main_image ? (
                          <img
                            src={getImageUrl(item.main_image)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-2xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <ShareButtons
                              url={`/public/content/${item.documentId}`}
                              title={item.title}
                              description={item.subtitle}
                            />
                          </div>
                          {item.subtitle && (
                            <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.subtitle}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-3 flex-wrap">
                            {item.category_content?.name && (
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: item.category_content?.color 
                                    ? `${item.category_content.color}20`
                                    : 'hsl(var(--primary) / 0.1)',
                                  borderColor: item.category_content?.color || 'hsl(var(--primary))',
                                }}
                              >
                                {item.category_content.name}
                              </Badge>
                            )}
                            {item.publish_date && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(new Date(item.publish_date), "dd MMM yyyy", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                            {item.author_content?.name && (
                              <span className="text-sm text-muted-foreground">
                                {item.author_content.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <span>Leer más</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Masonry View */}
            {viewMode === 'masonry' && (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {paginatedContent.map((item) => (
                  <Card
                    key={item.id}
                    className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/50 break-inside-avoid mb-6"
                  >
                    <div onClick={() => handleContentClick(item.documentId)}>
                      {/* Image Preview */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5" style={{ height: `${200 + (item.id % 3) * 80}px` }}>
                        {item.main_image ? (
                          <img
                            src={getImageUrl(item.main_image)}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Floating Category Badge */}
                        {item.category_content?.name && (
                          <Badge 
                            className="absolute top-4 left-4 shadow-lg backdrop-blur-sm text-xs"
                            style={{
                              backgroundColor: item.category_content?.color 
                                ? `${item.category_content.color}40`
                                : 'hsl(var(--primary) / 0.2)',
                              borderColor: item.category_content?.color || 'hsl(var(--primary))',
                              color: item.category_content?.color || 'hsl(var(--primary))'
                            }}
                          >
                            {item.category_content.name}
                          </Badge>
                        )}

                        {/* Share Button */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShareButtons
                            url={`/public/content/${item.documentId}`}
                            title={item.title}
                            description={item.subtitle}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <CardHeader className="space-y-2 pb-3">
                        <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        {item.subtitle && (
                          <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                            {item.subtitle}
                          </CardDescription>
                        )}
                      </CardHeader>

                      {/* Footer */}
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                          {item.publish_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(item.publish_date), "dd MMM", {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          )}
                          {item.author_content?.name && (
                            <span className="text-xs truncate max-w-[120px]">
                              {item.author_content.name}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
              ))}
            </div>
            )}

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
    );
  }
