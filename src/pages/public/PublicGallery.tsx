import { useEffect, useState } from 'react';
import { Images, Presentation, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { API_CONFIG } from '@/config/api.js';
import { publicGalleryService } from '@/services/publicApiService';
import { SeoHead } from '@/components/seo/SeoHead';
import { buildSiteUrl } from '@/config/seo';

interface GalleryItem {
  id: number;
  documentId: string;
  title?: string;
  description?: string;
  media?: Array<{ id: number; url: string; name?: string }>;
}

const getImageUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
};

export default function PublicGallery() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [filteredGalleries, setFilteredGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    loadGalleries();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGalleries(galleries);
      return;
    }

    const loweredQuery = searchQuery.toLowerCase();
    setFilteredGalleries(
      galleries.filter(
        (item) =>
          item.title?.toLowerCase().includes(loweredQuery) ||
          item.description?.toLowerCase().includes(loweredQuery)
      )
    );
  }, [searchQuery, galleries]);

  useEffect(() => {
    if (!isPresentationMode || !selectedGallery?.media?.length) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) =>
        prev === selectedGallery.media!.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isPresentationMode, selectedGallery]);

  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPresentationMode(false);
        setCurrentSlideIndex(0);
      }
      if (event.key === 'ArrowRight') {
        nextSlide();
      }
      if (event.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPresentationMode, selectedGallery]);

  const loadGalleries = async () => {
    setLoading(true);
    try {
      const result = await publicGalleryService.getAll({
        pageSize: 100,
        sort: 'title:asc',
        populate: '*',
      });

      if (result.success) {
        setGalleries(result.data);
        setFilteredGalleries(result.data);
      }
    } catch (error) {
      console.error('Error loading public gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (!selectedGallery?.media?.length) return;
    setCurrentSlideIndex((prev) =>
      prev === selectedGallery.media!.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (!selectedGallery?.media?.length) return;
    setCurrentSlideIndex((prev) =>
      prev === 0 ? selectedGallery.media!.length - 1 : prev - 1
    );
  };

  const openPresentationAt = (index: number) => {
    setCurrentSlideIndex(index);
    setIsPresentationMode(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Galería pública"
        description="Explora la galería pública de Tec Community con imágenes, actividades y momentos destacados de la comunidad."
        path="/public/gallery"
        keywords={['galeria Tec', 'fotos Tec Community', 'comunidad Tec imagenes']}
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Galería pública de Tec Community',
            url: buildSiteUrl('/public/gallery'),
            description:
              'Explora la galería pública de Tec Community con imágenes, actividades y momentos destacados de la comunidad.',
          },
        ]}
      />
      <div className="container py-10 space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Comunidad</p>
          <h1 className="text-4xl font-bold tracking-tight">Galería Pública</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Explora imágenes destacadas, actividades y momentos compartidos dentro de Tec Community.
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar galerías..."
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filteredGalleries.length === 0 ? (
          <div className="text-center py-16">
            <Images className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay galerías públicas disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGalleries.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-border/70 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedGallery(item)}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.media?.length ? (
                    <img
                      src={getImageUrl(item.media[0].url)}
                      alt={item.title || 'Galería'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{item.title || 'Galería sin título'}</CardTitle>
                  {item.description && (
                    <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {item.media?.length || 0} {(item.media?.length || 0) === 1 ? 'imagen' : 'imágenes'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedGallery && !isPresentationMode} onOpenChange={() => setSelectedGallery(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>{selectedGallery?.title}</DialogTitle>
                {selectedGallery?.description && (
                  <DialogDescription>{selectedGallery.description}</DialogDescription>
                )}
              </div>
              {selectedGallery?.media?.length ? (
                <Button variant="outline" size="sm" onClick={() => {
                  openPresentationAt(0);
                }}>
                  <Presentation className="h-4 w-4 mr-2" />
                  Presentación
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          {selectedGallery?.media?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedGallery.media.map((media, index) => (
                <div key={media.id} className="aspect-square overflow-hidden rounded-lg">
                  <img
                    src={getImageUrl(media.url)}
                    alt={media.name || selectedGallery.title || 'Galería'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => openPresentationAt(index)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">Esta galería no tiene imágenes.</p>
          )}
        </DialogContent>
      </Dialog>

      {isPresentationMode && selectedGallery?.media?.length ? (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <button
            onClick={() => {
              setIsPresentationMode(false);
              setCurrentSlideIndex(0);
            }}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={prevSlide}
            className="absolute left-4 z-10 text-white/80 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 z-10 text-white/80 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-0">
            <img
              src={getImageUrl(selectedGallery.media[currentSlideIndex].url)}
              alt={selectedGallery.media[currentSlideIndex].name || selectedGallery.title || 'Galería'}
              className="max-w-full max-h-full object-contain animate-fade-in"
            />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {selectedGallery.media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlideIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlideIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
