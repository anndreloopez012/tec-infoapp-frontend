import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload } from 'lucide-react';
import { buildApiUrl, getUploadHeaders, buildImageUrl } from '@/config/api';

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (src: string, altText: string) => void;
}

export default function ImageDialog({ open, onClose, onConfirm }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(buildApiUrl('upload'), {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      if (data && data[0]) {
        const imageUrl = buildImageUrl(data[0].url);
        onConfirm(imageUrl!, altText || data[0].name);
        handleClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInsert = () => {
    if (url.trim()) {
      onConfirm(url, altText || 'Imagen');
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setAltText('');
    setFile(null);
    setUploadError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insertar imagen</DialogTitle>
          <DialogDescription>
            Sube una imagen o ingresa una URL
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Subir archivo</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="image-file">Seleccionar imagen</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Archivo: {file.name}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-alt-upload">Texto alternativo</Label>
              <Input
                id="image-alt-upload"
                placeholder="Descripción de la imagen"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={uploading}
              />
            </div>
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir e insertar
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="url" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="image-url">URL de la imagen</Label>
              <Input
                id="image-url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlInsert();
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image-alt-url">Texto alternativo</Label>
              <Input
                id="image-alt-url"
                placeholder="Descripción de la imagen"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlInsert();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleUrlInsert} disabled={!url.trim()}>
                Insertar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
