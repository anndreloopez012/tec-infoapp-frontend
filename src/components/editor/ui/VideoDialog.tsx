import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { buildApiUrl, getUploadHeaders } from '@/config/api';

interface VideoDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (src: string, type: 'youtube' | 'upload', width: number, height: number) => void;
}

export default function VideoDialog({ open, onClose, onConfirm }: VideoDialogProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState(560);
  const [height, setHeight] = useState(315);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
      } else {
        toast.error('Por favor selecciona un archivo de video válido');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Por favor selecciona un video');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch(buildApiUrl('upload'), {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el video');
      }

      const data = await response.json();
      const videoUrl = `${buildApiUrl('').replace('/api/', '')}${data[0].url}`;
      
      onConfirm(videoUrl, 'upload', width, height);
      handleClose();
      toast.success('Video insertado correctamente');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Error al subir el video');
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeInsert = () => {
    if (!youtubeUrl) {
      toast.error('Por favor ingresa una URL de YouTube');
      return;
    }

    onConfirm(youtubeUrl, 'youtube', width, height);
    handleClose();
    toast.success('Video de YouTube insertado');
  };

  const handleClose = () => {
    setYoutubeUrl('');
    setFile(null);
    setWidth(560);
    setHeight(315);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insertar Video</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="youtube" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="upload">Subir Video</TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">URL de YouTube</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yt-width">Ancho (px)</Label>
                <Input
                  id="yt-width"
                  type="number"
                  min="200"
                  max="1200"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 560)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yt-height">Alto (px)</Label>
                <Input
                  id="yt-height"
                  type="number"
                  min="150"
                  max="800"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 315)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleYouTubeInsert}>
                Insertar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Archivo de Video</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-width">Ancho (px)</Label>
                <Input
                  id="upload-width"
                  type="number"
                  min="200"
                  max="1200"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 560)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-height">Alto (px)</Label>
                <Input
                  id="upload-height"
                  type="number"
                  min="150"
                  max="800"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 315)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Subiendo...' : 'Subir e Insertar'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
