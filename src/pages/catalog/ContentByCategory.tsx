import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Grid, List, LayoutGrid } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contentInfoService, contentCategoryService } from '@/services/catalogServices';
import { API_CONFIG } from '@/config/api';

const ContentByCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load category info
      const categoryResult = await contentCategoryService.getById(categoryId!);
      if (categoryResult) {
        setCategory(categoryResult);
      }

      // Load contents for this category
      const contentsResult = await contentInfoService.getAll({
        filters: {
          'category_content': {
            'documentId': {
              '$eq': categoryId
            }
          },
          'active': {
            '$eq': true
          }
        },
        populate: '*',
        sort: 'createdAt:desc'
      });

      if (contentsResult.data) {
        setContents(contentsResult.data);
      }
    } catch (error) {
      console.error('Error loading content by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData) return null;
    const url = imageData.url || imageData.formats?.medium?.url || imageData.formats?.small?.url;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
  };

  const handleContentClick = (content: any) => {
    navigate(`/content-detail/${content.documentId || content.id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category?.color || 'hsl(var(--primary))' }}
                />
                {category?.name || category?.Name || 'Categoría'}
              </h1>
              {category?.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {contents.length} {contents.length === 1 ? 'contenido' : 'contenidos'}
            </Badge>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content Grid/List */}
        {contents.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay contenido disponible</h3>
            <p className="text-muted-foreground">
              Esta categoría aún no tiene contenido publicado.
            </p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content, index) => (
              <motion.div
                key={content.documentId || content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  onClick={() => handleContentClick(content)}
                >
                  {/* Cover Image */}
                  {content.cover_image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getImageUrl(content.cover_image)}
                        alt={content.title || content.Title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {content.title || content.Title}
                    </CardTitle>
                    {content.description && (
                      <CardDescription className="line-clamp-2">
                        {content.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(content.publish_date || content.createdAt).toLocaleDateString('es-ES')}
                      </span>
                      {content.status && (
                        <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                          {content.status === 'published' ? 'Publicado' : content.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content, index) => (
              <motion.div
                key={content.documentId || content.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => handleContentClick(content)}
                >
                  <div className="flex gap-4 p-4">
                    {/* Cover Image */}
                    {content.cover_image && (
                      <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={getImageUrl(content.cover_image)}
                          alt={content.title || content.Title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                        {content.title || content.Title}
                      </h3>
                      {content.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(content.publish_date || content.createdAt).toLocaleDateString('es-ES')}
                        </span>
                        {content.status && (
                          <Badge variant={content.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                            {content.status === 'published' ? 'Publicado' : content.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContentByCategory;
