import React, { useState, useEffect } from 'react';
import { contentInfoService, contentCategoryService } from '@/services/catalogServices';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  LayoutGrid, 
  List, 
  Columns, 
  Calendar,
  Eye,
  Tag,
  Building2,
  Search
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
    id: number;
    url: string;
    alternativeText?: string;
    formats?: any;
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
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null) {
      loadContent();
    }
  }, [selectedCategory]);

  useEffect(() => {
    filterContent();
  }, [content, searchQuery]);

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredContent(content);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = content.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query) ||
      item.category_content?.name.toLowerCase().includes(query) ||
      item.company?.name.toLowerCase().includes(query)
    );
    setFilteredContent(filtered);
  };

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
        setFilteredContent(result.data);
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
        {filteredContent.map((item) => (
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
        {filteredContent.map((item) => (
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
        {filteredContent.map((item) => (
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
        {filteredContent.map((item) => (
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Header with Category Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-sm border-b sticky top-0 z-40 shadow-sm"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                Contenido Global
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground mt-2"
              >
                Explora nuestro contenido organizado por categorías
              </motion.p>
            </div>

            {/* Category Navigation - Embedded Style */}
            {categories.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between"
              >
                <div className="flex-1 max-w-4xl">
                  <Tabs 
                    value={selectedCategory?.toString()} 
                    onValueChange={(value) => setSelectedCategory(Number(value))}
                    className="w-full"
                  >
                    <TabsList className="w-full justify-start h-auto p-1 bg-background/60 backdrop-blur-sm border">
                      {categories.map((category) => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id.toString()}
                          className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:scale-105"
                        >
                          <Tag className="w-3 h-3 mr-2" />
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                {/* Search and View Mode */}
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar contenido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/60 backdrop-blur-sm border-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  
                  <div className="flex gap-1 bg-background/60 backdrop-blur-sm border rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      title="Vista en cuadrícula"
                      className="h-9 w-9 transition-all duration-200"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      title="Vista en lista"
                      className="h-9 w-9 transition-all duration-200"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('masonry')}
                      title="Vista mosaico"
                      className="h-9 w-9 transition-all duration-200"
                    >
                      <Columns className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Display */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <LoadingSpinner />
        ) : filteredContent.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <EmptyState
              title={searchQuery ? "No se encontraron resultados" : "No hay contenido disponible"}
              description={searchQuery ? "Intenta con otros términos de búsqueda" : "No se encontró contenido publicado en esta categoría"}
            />
          </motion.div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Detail Modal */}
      {selectedContent && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedContent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedContent.main_image && (
              <div className="relative h-80 overflow-hidden rounded-t-2xl">
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                  src={getImageUrl(selectedContent.main_image)}
                  alt={selectedContent.main_image.alternativeText || selectedContent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            )}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {selectedContent.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.category_content && (
                      <Badge variant="secondary" className="transition-transform hover:scale-105">
                        <Tag className="w-3 h-3 mr-1" />
                        {selectedContent.category_content.name}
                      </Badge>
                    )}
                    {selectedContent.company && (
                      <Badge variant="outline" className="transition-transform hover:scale-105">
                        <Building2 className="w-3 h-3 mr-1" />
                        {selectedContent.company.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="transition-transform hover:scale-105">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(selectedContent.publish_date).toLocaleDateString('es-MX')}
                    </Badge>
                  </div>
                </motion.div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedContent(null)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  ✕
                </Button>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedContent.content || '' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ContentGlobal;
