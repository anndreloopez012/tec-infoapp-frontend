import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { contentInfoService } from "@/services/catalogServices";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Tag, Building2, User, Download, ArrowLeft, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_CONFIG } from "@/config/api";
import LexicalViewer from "@/components/editor/LexicalViewer";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Attachment {
  id: number;
  name?: string;
  url: string;
  alternativeText?: string;
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
  description?: string;
  slug?: string;
  content: string;
  active: boolean;
  status_content?: string;
  status?: string;
  publish_date?: string;
  createdAt?: string;
  main_image?: any;
  cover_image?: any;
  category_content?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
  };
  companies?: any[];
  attachments?: Attachment[];
  author_content?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    username: string;
    email: string;
  };
  comment?: string;
}

const getImageUrl = (imageData: any) => {
  if (!imageData?.url) return null;
  return imageData.url.startsWith("http") ? imageData.url : `${API_CONFIG.BASE_URL}${imageData.url}`;
};

const getBestImageFormat = (attachment: Attachment) => {
  if (!attachment) return null;
  const format = attachment.formats?.large || attachment.formats?.medium;
  return format ? getImageUrl(format) : getImageUrl(attachment);
};

const ContentDetail: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ContentDetailItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  const loadContent = async () => {
    if (!contentId) return;
    setLoading(true);
    
    try {
      console.log('🔍 Loading content with ID:', contentId);
      
      // First try to get by documentId directly
      const result = await contentInfoService.getById(contentId);
      console.log('📦 getById result:', result);
      
      if (result.success && result.data && result.data.title) {
        console.log('✅ Content found via getById');
        setItem(result.data as ContentDetailItem);
        document.title = `${result.data.title} | TEC Info`;
      } else {
        console.log('⚠️ getById failed, trying getAll fallback...');
        // Fallback: try to search by documentId
        const searchResult = await contentInfoService.getAll({
          pageSize: 1,
          populate: '*',
          additionalFilters: {
            "filters[documentId][$eq]": contentId,
          },
        });
        
        console.log('📦 getAll result:', searchResult);

        if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
          console.log('✅ Content found via getAll');
          setItem(searchResult.data[0] as ContentDetailItem);
          document.title = `${searchResult.data[0].title} | TEC Info`;
        } else {
          console.log('❌ Content not found');
          toast.error("Contenido no encontrado");
        }
      }
    } catch (error) {
      console.error("❌ Error loading content detail:", error);
      toast.error("No se pudo cargar el contenido");
    } finally {
      setLoading(false);
    }
  };

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

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Imagen descargada");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Error al descargar la imagen");
    }
  };

  const downloadAllImages = async (attachments: Attachment[]) => {
    toast.info(`Descargando ${attachments.length} imágenes...`);
    for (const attachment of attachments) {
      const url = getBestImageFormat(attachment) || getImageUrl(attachment);
      if (url) {
        await downloadImage(url, attachment.name || `attachment-${attachment.id}.png`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-5xl">
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
      <div className="container py-12 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground mb-4">Contenido no encontrado</p>
            <p className="text-sm text-muted-foreground">El contenido que buscas no existe o ya no está disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const heroImage = item.main_image || item.cover_image || (item.attachments && item.attachments.length > 0 ? item.attachments[0] : null);

  return (
    <div className="container py-8 space-y-8 max-w-5xl animate-fade-in">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Hero Image */}
      {heroImage && (
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={getBestImageFormat(heroImage) || getImageUrl(heroImage)}
            alt={item.title}
            loading="lazy"
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
          {(item.subtitle || item.description) && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {item.subtitle || item.description}
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
              <Tag className="w-3 h-3 mr-1" />
              {item.category_content.name}
            </Badge>
          )}
          
          {(item.publish_date || item.createdAt) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(item.publish_date || item.createdAt!), "dd 'de' MMMM, yyyy", {
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

          {item.author?.username && !item.author_content?.name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{item.author.username}</span>
            </div>
          )}

          {item.companies && item.companies.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{item.companies.map(c => c.name || c.Name).join(', ')}</span>
            </div>
          )}

          {(item.status_content || item.status) && (
            <Badge variant={(item.status_content || item.status) === 'published' ? 'default' : 'secondary'}>
              {(item.status_content || item.status) === 'published' ? 'Publicado' : (item.status_content || item.status)}
            </Badge>
          )}
        </div>

        <Separator />
      </div>

      {/* Rich Content */}
      {item.content && (
        <Card className="border-none shadow-none bg-transparent overflow-hidden">
          <CardContent className="px-0 overflow-hidden">
            <div className="w-full overflow-hidden">
              <LexicalViewer content={item.content} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comment */}
      {item.comment && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Comentarios
            </h3>
            <div className="p-4 bg-accent/20 rounded-lg border-l-4 border-primary">
              <p className="text-sm">{item.comment}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {item.attachments && item.attachments.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="h-5 w-5" />
                Archivos adjuntos ({item.attachments.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => openCarousel(0)}
                >
                  Ver fotos
                </Button>
                {item.attachments.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => downloadAllImages(item.attachments!)}
                  >
                    Descargar todos
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {item.attachments.map((attachment, index) => (
                <div
                  key={attachment.id}
                  onClick={() => openCarousel(index)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
                >
                  <img
                    src={getBestImageFormat(attachment) || getImageUrl(attachment)}
                    alt={attachment.alternativeText || attachment.name || `Adjunto ${attachment.id}`}
                    loading="lazy"
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
            type="button"
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
                {item.attachments.map((attachment) => (
                  <CarouselItem key={attachment.id}>
                    <div className="flex items-center justify-center h-[80vh] p-8 animate-fade-in">
                      <img
                        src={getBestImageFormat(attachment) || getImageUrl(attachment)}
                        alt={attachment.alternativeText || attachment.name || `Adjunto ${attachment.id}`}
                        loading="lazy"
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
};

export default ContentDetail;
