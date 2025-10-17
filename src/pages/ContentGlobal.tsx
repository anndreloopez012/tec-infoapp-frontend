import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_CONFIG } from '@/config/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Attachment {
  id: number;
  url: string;
  alternativeText?: string;
  formats?: {
    large?: { url: string };
    medium?: { url: string };
    small?: { url: string };
    thumbnail?: { url: string };
  };
}

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
  attachments?: Attachment[];
  author?: {
    id: number;
    username: string;
    email: string;
  };
  comment?: string;
}

interface Category {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  color?: string;
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

  const getMainImage = (item: ContentItem) => {
    if (!item.attachments || item.attachments.length === 0) return null;
    return item.attachments[0];
  };

  const getCategoryColor = (categoryId: number | undefined) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    if (category?.color) return category.color;
    
    // Colores predeterminados que sean coherentes con el tema
    const defaultColors = [
      '#8B5CF6', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#14B8A6', // Teal
    ];
    
    // Usar el ID de la categoría para un color consistente
    const index = categoryId % defaultColors.length;
    return defaultColors[index];
  };

  const getBestImageFormat = (attachment: Attachment) => {
    if (!attachment) return null;
    // Prefer medium format for cards, fallback to original
    const format = attachment.formats?.medium || attachment.formats?.large;
    return format ? getImageUrl(format) : getImageUrl(attachment);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadAllImages = async (attachments: Attachment[]) => {
    for (const attachment of attachments) {
      const url = getImageUrl(attachment);
      if (url) {
        await downloadImage(url, `attachment-${attachment.id}.png`);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
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
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer group overflow-hidden">
              {getMainImage(item) && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getBestImageFormat(getMainImage(item)!)}
                    alt={getMainImage(item)?.alternativeText || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {item.attachments && item.attachments.length > 1 && (
                    <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                      {item.attachments.length} fotos
                    </Badge>
                  )}
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-2">
                  {item.category_content && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs border-2 transition-all hover:scale-105"
                      style={{ 
                        borderColor: getCategoryColor(item.category_content.id) || undefined,
                        backgroundColor: `${getCategoryColor(item.category_content.id)}15` || undefined
                      }}
                    >
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
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.category_content?.description || 'Haz clic en "Ver más" para leer el contenido completo'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center gap-2">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.publish_date).toLocaleDateString('es-MX')}
                  </span>
                  {item.author && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <User className="w-3 h-3 flex-shrink-0" />
                      {item.author.username}
                    </span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedContent(item)}
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0"
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
            <Card className="hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {getMainImage(item) && (
                  <div className="md:w-64 h-48 md:h-auto overflow-hidden relative">
                    <img
                      src={getBestImageFormat(getMainImage(item)!)}
                      alt={getMainImage(item)?.alternativeText || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.attachments && item.attachments.length > 1 && (
                      <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                        {item.attachments.length} fotos
                      </Badge>
                    )}
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
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {item.category_content?.description || 'Haz clic para leer el contenido completo'}
                  </p>
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm"
                      onClick={() => setSelectedContent(item)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Leer más
                    </Button>
                    {item.author && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author.username}
                      </span>
                    )}
                  </div>
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group mb-6 overflow-hidden">
              {getMainImage(item) && (
                <div className="relative overflow-hidden">
                  <img
                    src={getBestImageFormat(getMainImage(item)!)}
                    alt={getMainImage(item)?.alternativeText || item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.attachments && item.attachments.length > 1 && (
                    <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                      {item.attachments.length} fotos
                    </Badge>
                  )}
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
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.category_content?.description || 'Ver contenido completo'}
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
                {getMainImage(item) && (
                  <div className="relative">
                    <img
                      src={getBestImageFormat(getMainImage(item)!)}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    {item.attachments && item.attachments.length > 1 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {item.attachments.length}
                      </Badge>
                    )}
                  </div>
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
      {/* Navigation Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-lg"
      >
        <div className="container mx-auto px-4">
          {/* Category Navigation - Main Nav Style */}
          {categories.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between py-4">
              {/* Categories as Navigation - Centered */}
              <nav className="flex-1 flex justify-center">
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {categories.map((category, index) => {
                    const categoryColor = getCategoryColor(category.id);
                    const isActive = selectedCategory === category.id;
                    
                    return (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`
                          relative px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300
                          ${isActive
                            ? 'text-white shadow-lg scale-105'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }
                        `}
                      >
                        {/* Animated background with category color */}
                        {isActive && (
                          <motion.div
                            layoutId="activeCategory"
                            className="absolute inset-0 rounded-lg"
                            style={{ backgroundColor: categoryColor || undefined }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        
                        {/* Category icon and name */}
                        <span className="relative z-10 flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          {category.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </nav>

              {/* Search and View Controls */}
              <div className="flex gap-3 items-center flex-wrap">
                {/* Search Input */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative flex-1 lg:w-64 min-w-[200px]"
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary transition-all duration-200 h-11"
                  />
                </motion.div>
                
                {/* View Mode Toggles */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-1 bg-background/80 backdrop-blur-sm border rounded-lg p-1"
                >
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
                </motion.div>
              </div>
            </div>
          )}
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
            className="bg-card rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-primary/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Carousel */}
            {selectedContent.attachments && selectedContent.attachments.length > 0 && (
              <div className="relative">
                {selectedContent.attachments.length === 1 ? (
                  <div className="relative h-96 overflow-hidden rounded-t-2xl">
                    <motion.img
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.6 }}
                      src={getImageUrl(selectedContent.attachments[0])}
                      alt={selectedContent.attachments[0].alternativeText || selectedContent.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                ) : (
                  <Carousel className="w-full rounded-t-2xl overflow-hidden">
                    <CarouselContent>
                      {selectedContent.attachments.map((attachment, index) => (
                        <CarouselItem key={attachment.id}>
                          <div className="relative h-96">
                            <img
                              src={getImageUrl(attachment)}
                              alt={attachment.alternativeText || `${selectedContent.title} - Imagen ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                              {index + 1} / {selectedContent.attachments.length}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </Carousel>
                )}
              </div>
            )}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {selectedContent.title}
                  </h2>
                  
                  {/* Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Category */}
                    {selectedContent.category_content && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Categoría
                        </label>
                        <Badge 
                          variant="secondary" 
                          className="text-sm border-2 transition-all hover:scale-105"
                          style={{ 
                            borderColor: getCategoryColor(selectedContent.category_content.id) || undefined,
                            backgroundColor: `${getCategoryColor(selectedContent.category_content.id)}15` || undefined
                          }}
                        >
                          <Tag className="w-4 h-4 mr-1" />
                          {selectedContent.category_content.name}
                        </Badge>
                      </div>
                    )}

                    {/* Company */}
                    {selectedContent.company && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Empresa
                        </label>
                        <Badge variant="outline" className="transition-transform hover:scale-105">
                          <Building2 className="w-3 h-3 mr-1" />
                          {selectedContent.company.name}
                        </Badge>
                      </div>
                    )}

                    {/* Publish Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Fecha de Publicación
                      </label>
                      <Badge variant="outline" className="transition-transform hover:scale-105">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(selectedContent.publish_date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Estado
                      </label>
                      <Badge 
                        variant={selectedContent.status_content === 'published' ? 'default' : 'secondary'}
                        className="transition-transform hover:scale-105"
                      >
                        {selectedContent.status_content === 'published' ? 'Publicado' : 
                         selectedContent.status_content === 'draft' ? 'Borrador' : 'Archivado'}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedContent(null)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 ml-4"
                >
                  ✕
                </Button>
              </div>

              {/* Author Info */}
              {selectedContent.author && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mb-6"
                >
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Autor
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedContent.author.username}</p>
                      <p className="text-sm text-muted-foreground">{selectedContent.author.email}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
                  Contenido
                </label>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-foreground prose-pre:bg-accent/50 prose-li:text-foreground">
                  <ReactMarkdown>{selectedContent.content || 'Sin contenido'}</ReactMarkdown>
                </div>
              </motion.div>

              {/* Comment Section */}
              {selectedContent.comment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Comentarios
                  </label>
                  <div className="p-4 bg-accent/20 rounded-lg border-l-4 border-primary">
                    <p className="text-sm">{selectedContent.comment}</p>
                  </div>
                </motion.div>
              )}

              {/* Attachments Gallery */}
              {selectedContent.attachments && selectedContent.attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Archivos Adjuntos ({selectedContent.attachments.length})
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAllImages(selectedContent.attachments!)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar todas
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedContent.attachments.map((attachment) => (
                      <motion.div
                        key={attachment.id}
                        whileHover={{ scale: 1.05 }}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-accent/20"
                      >
                        <img
                          src={getBestImageFormat(attachment) || getImageUrl(attachment)}
                          alt={attachment.alternativeText || `Adjunto ${attachment.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadImage(getImageUrl(attachment)!, `attachment-${attachment.id}.png`)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ContentGlobal;
