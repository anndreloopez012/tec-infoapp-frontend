import { useState } from 'react';
import { Download, Trash2, X, Eye, FileText, Film, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { API_CONFIG } from '@/config/api';

interface FileGalleryProps {
  files: any[];
  onRemove?: (fileId: number) => void;
  readOnly?: boolean;
}

export function FileGallery({ files, onRemove, readOnly = false }: FileGalleryProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay archivos adjuntos</p>
      </div>
    );
  }

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return null; // Show image instead
    if (mime.startsWith('video/')) return <Film className="h-8 w-8" />;
    if (mime === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (mime.includes('document') || mime.includes('text')) return <FileText className="h-8 w-8 text-blue-500" />;
    return <FileIcon className="h-8 w-8" />;
  };

  const handleDownload = (file: any) => {
    window.open(`${API_CONFIG.BASE_URL}${file.url}`, '_blank');
  };

  const isImage = (mime: string) => mime.startsWith('image/');
  const isVideo = (mime: string) => mime.startsWith('video/');
  const isPDF = (mime: string) => mime === 'application/pdf';

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file: any) => (
          <Card key={file.id} className="relative group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative">
              {isImage(file.mime) ? (
                <img
                  src={`${API_CONFIG.BASE_URL}${file.url}`}
                  alt={file.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                />
              ) : isVideo(file.mime) ? (
                <video
                  src={`${API_CONFIG.BASE_URL}${file.url}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                />
              ) : (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-muted cursor-pointer p-4"
                  onClick={() => setSelectedFile(file)}
                >
                  {getFileIcon(file.mime)}
                  <p className="text-xs text-center mt-3 line-clamp-2 font-medium">
                    {file.name}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shadow-lg"
                  onClick={() => setSelectedFile(file)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shadow-lg"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!readOnly && onRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 shadow-lg"
                    onClick={() => onRemove(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* File Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
                <p className="text-xs text-white truncate font-medium">
                  {file.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-white/70">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-white/70">
                    {file.ext?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-8">
                <span className="truncate">{selectedFile.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-auto max-h-[70vh]">
              {isImage(selectedFile.mime) ? (
                <img
                  src={`${API_CONFIG.BASE_URL}${selectedFile.url}`}
                  alt={selectedFile.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : isVideo(selectedFile.mime) ? (
                <video
                  src={`${API_CONFIG.BASE_URL}${selectedFile.url}`}
                  controls
                  className="w-full h-auto rounded-lg"
                />
              ) : isPDF(selectedFile.mime) ? (
                <iframe
                  src={`${API_CONFIG.BASE_URL}${selectedFile.url}`}
                  className="w-full h-[600px] rounded-lg"
                  title={selectedFile.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  {getFileIcon(selectedFile.mime)}
                  <p className="mt-4 font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => handleDownload(selectedFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleDownload(selectedFile)}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              {!readOnly && onRemove && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onRemove(selectedFile.id);
                    setSelectedFile(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
