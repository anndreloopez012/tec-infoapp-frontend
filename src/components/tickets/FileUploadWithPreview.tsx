import { useState } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FilePreview {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
}

interface FileUploadWithPreviewProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
  maxFiles?: number;
}

export function FileUploadWithPreview({ 
  onUpload, 
  disabled = false,
  maxFiles = 10 
}: FileUploadWithPreviewProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const getFileType = (file: File): FilePreview['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews: FilePreview[] = files.map(file => {
      const type = getFileType(file);
      let preview: string | undefined;

      if (type === 'image' || type === 'video') {
        preview = URL.createObjectURL(file);
      }

      return { file, preview, type };
    });

    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles));
    e.target.value = '';
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return newPreviews;
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;

    try {
      setUploading(true);
      const files = previews.map(p => p.file);
      await onUpload(files);
      
      // Limpiar previews después de subir exitosamente
      previews.forEach(p => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      setPreviews([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: FilePreview['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8" />;
      case 'video':
        return <Film className="h-8 w-8" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading || previews.length >= maxFiles}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "hover:bg-muted/50",
            (disabled || uploading || previews.length >= maxFiles) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {previews.length >= maxFiles 
              ? `Máximo ${maxFiles} archivos`
              : "Haz clic o arrastra archivos aquí"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Imágenes, videos, PDFs, documentos
          </p>
        </label>
      </div>

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  {preview.type === 'image' && preview.preview ? (
                    <img
                      src={preview.preview}
                      alt={preview.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : preview.type === 'video' && preview.preview ? (
                    <video
                      src={preview.preview}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted p-4">
                      {getFileIcon(preview.type)}
                      <p className="text-xs text-center mt-2 line-clamp-2">
                        {preview.file.name}
                      </p>
                    </div>
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={() => removePreview(index)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {/* File Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-white/70">
                      {(preview.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || disabled}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Subiendo...' : `Subir ${previews.length} archivo(s)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
