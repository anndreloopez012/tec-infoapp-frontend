import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicContentService } from '@/services/publicApiService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, User, X } from 'lucide-react';
import { ShareButtons } from '@/components/public/ShareButtons';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { toast } from 'sonner';
import LexicalViewer from '@/components/editor/LexicalViewer';
import type { CarouselApi } from '@/components/ui/carousel';

interface Attachment {
  id: number;
  name: string;
  url: string;
  formats?: {
    large?: { url: string };
    medium?: { url: string };
    small?: { url: string };
    thumbnail?: { url: string };
  };
}

interface ContentDetailItem {
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
  attachments?: Attachment[];
}

const getImageUrl = (imageData: any) => {
  if (!imageData?.url) return null;
  return imageData.url.startsWith('http')
    ? imageData.url
    : `${API_CONFIG.BASE_URL}${imageData.url}`;
};

const getBestImageFormat = (attachment: Attachment): string => {
  const formats = attachment.formats;
  if (formats?.large?.url) return getImageUrl(formats.large) || attachment.url;
  if (formats?.medium?.url) return getImageUrl(formats.medium) || attachment.url;
  return getImageUrl(attachment) || attachment.url;
};

export default function PublicContentDetail() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    if (!carouselOpen || !carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [carouselOpen, carouselApi]);

  const openCarousel = (index: number) => {
    setCurrentImageIndex(index);
    setCarouselOpen(true);
  };

  const loadContent = async () => {
    if (!contentId) return;

    setLoading(true);
    try {
      const result = await publicContentService.getById(contentId);
      
      if (result.success && result.data) {
        // Check if content has companies (private content)
        if (result.data.companies && result.data.companies.length > 0) {
          toast.error('Este contenido es privado');
          navigate(-1);
          return;
        }

        // Check if content is published and active
        if (result.data.status_content !== 'published' || !result.data.active) {
          toast.error('Contenido no disponible');
          navigate(-1);
          return;
        }

        setItem(result.data);
        
        // Update page title
        if (result.data.title) {
          document.title = `${result.data.title} - Contenido`;
        }
      } else {
        toast.error('Contenido no encontrado');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Error al cargar el contenido');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-8">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-96 bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-muted-foreground">Contenido no encontrado</p>
              <Button onClick={() => navigate(-1)} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8 max-w-5xl animate-fade-in">
        {/* Back Button and Share */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <ShareButtons
            url={`/public/content/${contentId}`}
            title={item.title}
            description={item.subtitle}
          />
        </div>

        {/* Hero Image */}
        {item.main_image && (
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={getImageUrl(item.main_image)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          </div>
        )}

        {/* Content Header */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {item.title}
            </h1>
            {item.subtitle && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {item.subtitle}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm">
            {item.category_content?.name && (
              <Badge
                variant="outline"
                className="text-sm px-3 py-1"
                style={{
                  backgroundColor: item.category_content?.color 
                    ? `${item.category_content.color}20`
                    : 'hsl(var(--primary) / 0.1)',
                  borderColor: item.category_content?.color || 'hsl(var(--primary))',
                  color: item.category_content?.color || 'hsl(var(--primary))'
                }}
              >
                {item.category_content.name}
              </Badge>
            )}
            
            {item.publish_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(item.publish_date), "dd 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {item.author_content?.name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{item.author_content.name}</span>
              </div>
            )}
          </div>

          <Separator />
        </div>

        {/* Rich Content */}
        {item.content && (
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="px-0">
              <LexicalViewer content={item.content} />
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {item.attachments && item.attachments.length > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Imágenes ({item.attachments.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {item.attachments.map((attachment, index) => (
                  <div
                    key={attachment.id}
                    onClick={() => openCarousel(index)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
                  >
                    <img
                      src={getBestImageFormat(attachment)}
                      alt={attachment.name}
                      className="w-full h-full object-cover transition-transform"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fullscreen Carousel Modal */}
        <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
          <DialogContent className="max-w-full w-screen h-screen p-0 bg-black/95 flex items-center justify-center border-none">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setCarouselOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {item?.attachments && item.attachments.length > 0 && (
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  loop: true,
                  startIndex: currentImageIndex,
                }}
                className="w-full max-w-6xl"
              >
                <CarouselContent>
                  {item.attachments.map((attachment, index) => (
                    <CarouselItem key={attachment.id}>
                      <div className="flex items-center justify-center h-[80vh] p-8 animate-fade-in">
                        <img
                          src={getBestImageFormat(attachment)}
                          alt={attachment.name}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 h-12 w-12 bg-white/10 border-white/20 text-white hover:bg-white/20" />
                <CarouselNext className="right-4 h-12 w-12 bg-white/10 border-white/20 text-white hover:bg-white/20" />
              </Carousel>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
