import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicContentService, publicCategoryService } from '@/services/publicApiService';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
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
}

export default function CategoryContent() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<ContentData[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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
        setContent(result.data);
        setFilteredContent(result.data);
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
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredContent(filtered);
    setCurrentPage(1);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))}
          </div>
        ) : paginatedContent.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedContent.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-all duration-300 hover-scale border-primary/20 flex flex-col"
                >
                  {item.main_image && (
                    <div className="overflow-hidden rounded-t-lg">
                      <img
                        src={
                          item.main_image.url?.startsWith('http')
                            ? item.main_image.url
                            : `${API_CONFIG.BASE_URL}${item.main_image.url}`
                        }
                        alt={item.title}
                        className="w-full h-56 object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    {item.subtitle && (
                      <CardDescription className="text-base">
                        {item.subtitle}
                      </CardDescription>
                    )}
                    {item.publish_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(item.publish_date), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </div>
                    )}
                  </CardHeader>
                  {item.content && (
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
                        <ReactMarkdown>{item.content.substring(0, 200) + '...'}</ReactMarkdown>
                      </div>
                    </CardContent>
                  )}
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
