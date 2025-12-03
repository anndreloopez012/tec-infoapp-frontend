import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  ArrowRight, 
  Grid3x3, 
  List, 
  LayoutGrid, 
  SlidersHorizontal, 
  User,
  Loader2,
  Building2,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { contentInfoService, contentCategoryService } from '@/services/catalogServices';
import { API_CONFIG } from '@/config/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface ContentData {
  id: number;
  documentId: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  publish_date?: string;
  createdAt?: string;
  main_image?: any;
  cover_image?: any;
  category_content?: any;
  companies?: any[];
  author_content?: any;
  status_content?: string;
  status?: string;
}

type ViewMode = 'grid' | 'list' | 'masonry';
type SortOption = 'newest' | 'oldest' | 'title';

const PAGE_SIZE = 20;

const ContentByCategory = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [allAuthors, setAllAuthors] = useState<string[]>([]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Check if user has super/admin role to see archived content
  const canSeeArchived = useMemo(() => {
    if (!user?.role) return false;
    const roleType = user.role?.type?.toLowerCase() || '';
    const roleName = user.role?.name?.toLowerCase() || '';
    return ['super', 'admin', 'super_admin'].includes(roleType) || 
           ['super', 'admin', 'super_admin'].includes(roleName);
  }, [user]);

  // Get sort parameter for API - newest first by default
  const getSortParam = () => {
    switch (sortBy) {
      case 'newest': return 'createdAt:desc';
      case 'oldest': return 'createdAt:asc';
      case 'title': return 'title:asc';
      default: return 'createdAt:desc';
    }
  };

  // Get today's date in ISO format for publication date filter
  const getTodayISO = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Build filters for API - Authenticated version shows ALL content (with and without companies)
  // Status filtering: 
  // - "publicado" visible for everyone
  // - "archivado" visible only for super/admin roles
  // - "borrador" never visible
  // Publication date: only show content where publish_date <= today
  const buildFilters = useCallback(() => {
    const today = getTodayISO();
    const filters: Record<string, string> = {
      'filters[category_content][documentId][$eq]': categoryId || '',
      'filters[active][$eq]': 'true',
      'filters[publish_date][$lte]': today,
    };

    // Status filter - exclude draft, and exclude archived if user is not super/admin
    // Use case insensitive filter ($eqi) since API may return "Publicado" or "publicado"
    if (canSeeArchived) {
      // Super/admin can see both publicado and archivado (but not borrador)
      filters['filters[$or][0][status_content][$eqi]'] = 'publicado';
      filters['filters[$or][1][status_content][$eqi]'] = 'archivado';
    } else {
      // Regular users only see publicado
      filters['filters[status_content][$eqi]'] = 'publicado';
    }

    if (searchQuery.trim()) {
      filters['filters[title][$containsi]'] = searchQuery;
    }

    if (selectedAuthor !== 'all') {
      filters['filters[author_content][name][$eq]'] = selectedAuthor;
    }

    return filters;
  }, [categoryId, searchQuery, selectedAuthor, canSeeArchived]);

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadAuthors();
    }
  }, [categoryId]);

  // Reset and reload when filters change
  useEffect(() => {
    if (categoryId) {
      setContent([]);
      setPage(1);
      setHasMore(true);
      loadContent(1, true);
    }
  }, [categoryId, searchQuery, sortBy, selectedAuthor]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadContent(page + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  const loadCategory = async () => {
    if (!categoryId) return;
    try {
      const result = await contentCategoryService.getById(categoryId);
      if (result && result.data) {
        setCategory(result.data);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    }
  };

  const loadAuthors = async () => {
    try {
      const today = getTodayISO();
      const additionalFilters: Record<string, string> = {
        'filters[category_content][documentId][$eq]': categoryId || '',
        'filters[active][$eq]': 'true',
        'filters[publish_date][$lte]': today,
      };

      // Apply same status filters as content (case insensitive)
      if (canSeeArchived) {
        additionalFilters['filters[$or][0][status_content][$eqi]'] = 'publicado';
        additionalFilters['filters[$or][1][status_content][$eqi]'] = 'archivado';
      } else {
        additionalFilters['filters[status_content][$eqi]'] = 'publicado';
      }

      // Load content to extract unique authors
      const result = await contentInfoService.getAll({
        pageSize: 500,
        populate: 'author_content',
        additionalFilters,
      });

      if (result.data) {
        const authors = Array.from(
          new Set(result.data.map((item: ContentData) => item.author_content?.name).filter(Boolean))
        ) as string[];
        setAllAuthors(authors);
      }
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const loadContent = async (pageNum: number, isReset: boolean) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await contentInfoService.getAll({
        pageSize: PAGE_SIZE,
        page: pageNum,
        sort: getSortParam(),
        populate: '*',
        additionalFilters: buildFilters(),
      });

      if (result.success && result.data) {
        if (isReset) {
          setContent(result.data);
        } else {
          setContent(prev => [...prev, ...result.data]);
        }

        setPage(pageNum);
        // Check if we have more pages
        const totalFromPagination = result.pagination?.total || 0;
        setHasMore(pageNum * PAGE_SIZE < totalFromPagination && result.data.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData) return null;
    const url = imageData.url || imageData.formats?.medium?.url || imageData.formats?.small?.url;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
  };

  const handleContentClick = (item: ContentData) => {
    navigate(`/content-detail/${item.documentId || item.id}`);
  };

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          {category?.color && (
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
          <BookOpen className="h-10 w-10 text-primary" />
          {category?.name || category?.Name || 'Categoría'}
        </h1>
        {category?.description && (
          <p className="text-muted-foreground text-lg">{category.description}</p>
        )}
      </motion.div>

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

              {allAuthors.length > 0 && (
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                  <SelectTrigger className="w-[180px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los autores</SelectItem>
                    {allAuthors.map((author) => (
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
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'masonry' ? 'secondary' : 'ghost'}
                  size="icon"
                  type="button"
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
          Mostrando <strong>{content.length}</strong> resultados
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
      ) : content.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              No se encontró contenido en esta categoría
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item, index) => (
                <motion.div
                  key={item.documentId || item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                >
                  <Card
                    className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-border/50 hover:border-primary/50 flex flex-col h-full"
                    onClick={() => handleContentClick(item)}
                  >
                    {/* Image Preview */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
                      {(item.main_image || item.cover_image) ? (
                        <img
                          src={getImageUrl(item.main_image || item.cover_image)}
                          alt={item.title}
                          loading="lazy"
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

                      {/* Status Badge */}
                      {(item.status_content || item.status) && (
                        <Badge 
                          variant={(item.status_content || item.status) === 'archivado' ? 'secondary' : 'default'}
                          className="absolute top-4 right-4 gap-1"
                        >
                          {(item.status_content || item.status) === 'archivado' && <Archive className="h-3 w-3" />}
                          {(item.status_content || item.status) === 'publicado' ? 'Publicado' : 
                           (item.status_content || item.status) === 'archivado' ? 'Archivado' : 
                           (item.status_content || item.status)}
                        </Badge>
                      )}

                      {/* Private Content Indicator */}
                      {item.companies && item.companies.length > 0 && (
                        <Badge 
                          variant="outline"
                          className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm"
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          Privado
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader className="flex-grow space-y-3 pb-4">
                      <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                      {(item.subtitle || item.description) && (
                        <CardDescription className="text-sm line-clamp-2 leading-relaxed">
                          {item.subtitle || item.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    {/* Footer */}
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                        {(item.publish_date || item.createdAt) && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(item.publish_date || item.createdAt!), "dd MMM yyyy", {
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
                        <span>Ver más</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {content.map((item, index) => (
                <motion.div
                  key={item.documentId || item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                >
                  <Card
                    className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50"
                    onClick={() => handleContentClick(item)}
                  >
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Image */}
                      <div className="relative w-full md:w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
                        {(item.main_image || item.cover_image) ? (
                          <img
                            src={getImageUrl(item.main_image || item.cover_image)}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Private Content Indicator */}
                        {item.companies && item.companies.length > 0 && (
                          <Badge 
                            variant="outline"
                            className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
                          >
                            <Building2 className="h-3 w-3 mr-1" />
                            Privado
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                              {item.title}
                            </CardTitle>
                            <div className="flex gap-2 flex-shrink-0">
                              {item.category_content?.name && (
                                <Badge 
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
                              {(item.status_content || item.status) && (
                                <Badge 
                                  variant={(item.status_content || item.status) === 'published' ? 'default' : 'secondary'}
                                >
                                  {(item.status_content || item.status) === 'published' ? 'Publicado' : (item.status_content || item.status)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {(item.subtitle || item.description) && (
                            <CardDescription className="line-clamp-3">
                              {item.subtitle || item.description}
                            </CardDescription>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {(item.publish_date || item.createdAt) && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(new Date(item.publish_date || item.createdAt!), "dd MMM yyyy", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                            {item.author_content?.name && (
                              <span>{item.author_content.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                            <span>Ver más</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Masonry View */}
          {viewMode === 'masonry' && (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {content.map((item, index) => (
                <motion.div
                  key={item.documentId || item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="break-inside-avoid"
                  style={{ marginBottom: '1.5rem' }}
                >
                  <Card
                    className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/50"
                    onClick={() => handleContentClick(item)}
                  >
                    {/* Image Preview - Variable height for masonry effect */}
                    <div 
                      className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5"
                      style={{ height: `${200 + (index % 3) * 60}px` }}
                    >
                      {(item.main_image || item.cover_image) ? (
                        <img
                          src={getImageUrl(item.main_image || item.cover_image)}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Category Badge */}
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

                      {/* Private Content Indicator */}
                      {item.companies && item.companies.length > 0 && (
                        <Badge 
                          variant="outline"
                          className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm"
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          Privado
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader className="space-y-3 pb-4">
                      <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                      {(item.subtitle || item.description) && (
                        <CardDescription className="text-sm line-clamp-3">
                          {item.subtitle || item.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    {/* Footer */}
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                        {(item.publish_date || item.createdAt) && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(item.publish_date || item.createdAt!), "dd MMM yyyy", {
                                locale: es,
                              })}
                            </span>
                          </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Cargando más contenido...</span>
              </div>
            )}
            {!hasMore && content.length > 0 && (
              <p className="text-muted-foreground text-sm">No hay más contenido para mostrar</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ContentByCategory;
