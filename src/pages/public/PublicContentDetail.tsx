import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicContentService } from '@/services/publicApiService';
import { PublicHeader } from '@/components/public/PublicHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Building2, User, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_CONFIG } from '@/config/api.js';
import { toast } from 'sonner';
import LexicalViewer from '@/components/editor/LexicalViewer';

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

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

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
      toast.success('Imagen descargada');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen');
    }
  };

  const downloadAllImages = async (attachments: Attachment[]) => {
    toast.info(`Descargando ${attachments.length} imágenes...`);
    for (const attachment of attachments) {
      const imageUrl = getBestImageFormat(attachment);
      await downloadImage(imageUrl, attachment.name);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
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
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <div className="container py-8 space-y-8 max-w-5xl animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

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
                  <Download className="h-5 w-5" />
                  Archivos adjuntos ({item.attachments.length})
                </h3>
                {item.attachments.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAllImages(item.attachments!)}
                  >
                    Descargar todos
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {item.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={getBestImageFormat(attachment)}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(getBestImageFormat(attachment), attachment.name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
