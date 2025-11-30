import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { Calendar, Building2, User } from 'lucide-react';

interface ContentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    title: string;
    content?: string;
    category_content?: any;
    company?: any;
    status_content?: 'draft' | 'published' | 'archived';
    publish_date?: string;
    author?: any;
    attachments?: any[];
  };
  categories: any[];
  companies: any[];
}

const ContentPreviewDialog: React.FC<ContentPreviewDialogProps> = ({
  open,
  onOpenChange,
  data,
  categories,
  companies,
}) => {
  const category = categories.find(c => c.documentId === data.category_content);
  const company = companies.find(c => c.documentId === data.company);

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'published': return 'Publicado';
      case 'archived': return 'Archivado';
      default: return status || 'Sin estado';
    }
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  // Parse Lexical JSON content to extract text
  const parseContent = (content?: string) => {
    if (!content) return '';
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.root?.children) {
        return extractTextFromNodes(parsed.root.children);
      }
      return content;
    } catch {
      return content;
    }
  };

  const extractTextFromNodes = (nodes: any[]): string => {
    let text = '';
    nodes.forEach(node => {
      if (node.type === 'text') {
        text += node.text;
      } else if (node.type === 'linebreak') {
        text += '\n';
      } else if (node.children) {
        text += extractTextFromNodes(node.children);
      }
      // Add spacing between block elements
      if (node.type === 'paragraph' || node.type === 'heading') {
        text += '\n\n';
      }
    });
    return text;
  };

  const contentText = parseContent(data.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{data.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
            {category && (
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ 
                    backgroundColor: category.color || 'hsl(var(--primary))',
                    color: 'white'
                  }}
                >
                  {category.name}
                </Badge>
              </div>
            )}

            {company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{company.name}</span>
              </div>
            )}

            {data.status_content && (
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(data.status_content)}>
                  {getStatusLabel(data.status_content)}
                </Badge>
              </div>
            )}

            {data.publish_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(data.publish_date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}

            {data.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{data.author.username || data.author.email}</span>
              </div>
            )}
          </div>

          {/* Cover Images */}
          {data.attachments && data.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Imágenes de Portada</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.attachments.map((att, index) => (
                  <img
                    key={index}
                    src={typeof att === 'string' ? att : `${import.meta.env.VITE_API_URL || 'https://tec-adm.server-softplus.plus'}${att.url}`}
                    alt={`Cover ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Content Section */}
          {contentText && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Contenido</h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{contentText}</ReactMarkdown>
              </div>
            </div>
          )}

          {!contentText && (
            <p className="text-muted-foreground italic">No hay contenido para mostrar</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewDialog;
