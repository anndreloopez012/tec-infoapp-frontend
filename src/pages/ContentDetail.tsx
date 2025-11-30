import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { contentInfoService } from "@/services/catalogServices";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, Building2, User, Download, ArrowLeft } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { API_CONFIG } from "@/config/api";
import LexicalViewer from "@/components/editor/LexicalViewer";

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

interface ContentDetailItem {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string;
  active: boolean;
  status_content: "draft" | "published" | "archived";
  publish_date: string;
  category_content?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
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

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

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
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [item, setItem] = useState<ContentDetailItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const result = await contentInfoService.getAll({
          pageSize: 1,
          additionalFilters: {
            "filters[slug][$eq]": slug,
            "filters[status_content][$eq]": "published",
            "filters[active][$eq]": true,
          },
        });

        if (result.success && result.data.length > 0) {
          const contentItem = result.data[0] as ContentDetailItem;
          setItem(contentItem);

          const plainText = stripHtml(contentItem.content || "");
          const description = plainText.substring(0, 150);
          document.title = `${contentItem.title} | TEC Info`;

          const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
          if (metaDescription) {
            metaDescription.content = description;
          }
        } else {
          toast({
            title: "No encontrado",
            description: "No se encontró el contenido solicitado",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading content detail:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el contenido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, toast]);

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
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const downloadAllImages = async (attachments: Attachment[]) => {
    for (const attachment of attachments) {
      const url = getImageUrl(attachment);
      if (url) {
        await downloadImage(url, `attachment-${attachment.id}.png`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Contenido no encontrado</h1>
          <p className="text-muted-foreground">El contenido que buscas no existe o ya no está disponible.</p>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al contenido
        </Button>

        <article className="bg-card rounded-2xl shadow-xl overflow-hidden border border-primary/10">
          {/* Hero Image */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="relative h-80 w-full overflow-hidden">
              <img
                src={getBestImageFormat(item.attachments[0]) || getImageUrl(item.attachments[0]) || undefined}
                alt={item.attachments[0].alternativeText || item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          <div className="p-8">
            {/* Title and meta */}
            <header className="mb-6">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {item.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {item.category_content && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Categoría
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      <Tag className="w-4 h-4 mr-1" />
                      {item.category_content.name}
                    </Badge>
                  </div>
                )}

                {item.company && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Empresa</span>
                    <Badge variant="outline" className="text-sm">
                      <Building2 className="w-3 h-3 mr-1" />
                      {item.company.name}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Fecha de publicación
                  </span>
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(item.publish_date).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Badge>
                </div>

                {item.author && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Autor</span>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium leading-tight">{item.author.username}</p>
                        <p className="text-xs text-muted-foreground">{item.author.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Content body */}
            <section className="mb-8">
              <h2 className="sr-only">Contenido</h2>
              <LexicalViewer content={item.content} />
            </section>

            {/* Comment */}
            {item.comment && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Comentarios
                </h2>
                <div className="p-4 bg-accent/20 rounded-lg border-l-4 border-primary">
                  <p className="text-sm">{item.comment}</p>
                </div>
              </section>
            )}

            {/* Attachments */}
            {item.attachments && item.attachments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Imágenes ({item.attachments.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAllImages(item.attachments!)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar todas
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {item.attachments.map((attachment) => (
                    <figure
                      key={attachment.id}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-border bg-accent/20"
                    >
                      <img
                        src={getBestImageFormat(attachment) || getImageUrl(attachment)}
                        alt={attachment.alternativeText || `Adjunto ${attachment.id}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <figcaption className="sr-only">{attachment.alternativeText || `Adjunto ${attachment.id}`}</figcaption>
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
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
};

export default ContentDetail;
