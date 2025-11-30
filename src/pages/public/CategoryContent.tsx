import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicContentService, publicCategoryService } from '@/services/publicApiService';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

export default function CategoryContent() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<ContentData[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadContent();
    }
  }, [categoryId]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, content]);

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
    if (!searchQuery.trim()) {
      setFilteredContent(content);
      setCurrentPage(1);
      return;
    }

    const filtered = content.filter(
      (item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
    <div className="min-h-screen bg-background">
      <PublicHeader />

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedContent.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => handleContentClick(item.documentId)}
                  className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-border/50 hover:border-primary/50 flex flex-col"
                >
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
