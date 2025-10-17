import React, { useState, useEffect } from 'react';
import { contentInfoService, contentCategoryService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutGrid, 
  List, 
  Columns, 
  Calendar,
  Eye,
  Tag,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_CONFIG } from '@/config/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

interface ContentItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  active: boolean;
  status_content: 'draft' | 'published' | 'archived';
  publish_date: string;
  category_content?: {
    id: number;
    name: string;
    description?: string;
  };
  company?: {
    id: number;
    name: string;
  };
  main_image?: {
    url: string;
    alternativeText?: string;
  };
  attachments?: any[];
}

interface Category {
  id: number;
  documentId: string;
  name: string;
  description?: string;
}

type ViewMode = 'grid' | 'list' | 'masonry' | 'compact';

const ContentGlobal = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      loadContent();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const result = await contentCategoryService.getAll({ 
        pageSize: 100,
        filters: { active: true }
      });
      
      if (result.success && result.data.length > 0) {
        setCategories(result.data);
        setSelectedCategory(result.data[0].id);
      } else {
        toast({
          title: "No hay categorías disponibles",
          description: "Por favor, crea categorías de contenido primero.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const result = await contentInfoService.getAll({
        pageSize: 100,
        populate: '*',
        filters: {
          category_content: { id: selectedCategory },
          active: true,
          status_content: 'published'
        }
      });
      
      if (result.success) {
        setContent(result.data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData?.url) return null;
    return imageData.url.startsWith('http') 
      ? imageData.url 
      : `${API_CONFIG.BASE_URL}${imageData.url}`;
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number) => {
    const stripped = stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {content.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
              {item.main_image && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={getImageUrl(item.main_image)}
                    alt={item.main_image.alternativeText || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-2">
                  {item.category_content && (
                    <Badge variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {item.category_content.name}
                    </Badge>
                  )}
                  {item.company && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {item.company.name}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {truncateText(item.content || '', 150)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.publish_date).toLocaleDateString('es-MX')}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedContent(item)}
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver más
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {content.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex flex-col md:flex-row">
                {item.main_image && (
                  <div className="md:w-64 h-48 md:h-auto overflow-hidden rounded-l-lg">
                    <img
                      src={getImageUrl(item.main_image)}
                      alt={item.main_image.alternativeText || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex-1 p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-2 mt-2">
                      {item.category_content && (
                        <Badge variant="secondary">
                          <Tag className="w-3 h-3 mr-1" />
                          {item.category_content.name}
                        </Badge>
                      )}
                      {item.company && (
                        <Badge variant="outline">
                          <Building2 className="w-3 h-3 mr-1" />
                          {item.company.name}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(item.publish_date).toLocaleDateString('es-MX')}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {truncateText(item.content || '', 300)}
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setSelectedContent(item)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Leer más
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderMasonryView = () => (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      <AnimatePresence mode="popLayout">
        {content.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="break-inside-avoid"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group mb-6">
              {item.main_image && (
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={getImageUrl(item.main_image)}
                    alt={item.main_image.alternativeText || item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-2">
                  {item.category_content && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category_content.name}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {truncateText(item.content || '', 200)}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedContent(item)}
                  className="w-full"
                >
                  Ver detalles
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderCompactView = () => (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {content.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedContent(item)}
            >
              <div className="flex items-center gap-4">
                {item.main_image && (
                  <img
                    src={getImageUrl(item.main_image)}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.category_content && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category_content.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.publish_date).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'grid':
        return renderGridView();
      case 'list':
        return renderListView();
      case 'masonry':
        return renderMasonryView();
      case 'compact':
        return renderCompactView();
      default:
        return renderGridView();
    }
  };

  if (loading && categories.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contenido Global</h1>
          <p className="text-muted-foreground mt-2">
            Explora nuestro contenido organizado por categorías
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs 
              value={selectedCategory?.toString()} 
              onValueChange={(value) => setSelectedCategory(Number(value))}
              className="w-full sm:w-auto overflow-x-auto"
            >
              <TabsList className="inline-flex w-auto">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id.toString()}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* View Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Vista en cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                title="Vista en lista"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'masonry' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('masonry')}
                title="Vista mosaico"
              >
                <Columns className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('compact')}
                title="Vista compacta"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content Display */}
      {loading ? (
        <LoadingSpinner />
      ) : content.length === 0 ? (
        <EmptyState
          title="No hay contenido disponible"
          description="No se encontró contenido publicado en esta categoría"
        />
      ) : (
        renderContent()
      )}

      {/* Detail Modal */}
      {selectedContent && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedContent.main_image && (
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img
                  src={getImageUrl(selectedContent.main_image)}
                  alt={selectedContent.main_image.alternativeText || selectedContent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedContent.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.category_content && (
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {selectedContent.category_content.name}
                      </Badge>
                    )}
                    {selectedContent.company && (
                      <Badge variant="outline">
                        <Building2 className="w-3 h-3 mr-1" />
                        {selectedContent.company.name}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(selectedContent.publish_date).toLocaleDateString('es-MX')}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedContent(null)}
                >
                  ✕
                </Button>
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedContent.content || '' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContentGlobal;
