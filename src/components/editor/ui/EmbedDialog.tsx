import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EmbedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string, platform: 'instagram' | 'facebook' | 'twitter', width: number, height: number) => void;
}

export default function EmbedDialog({ open, onClose, onConfirm }: EmbedDialogProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'facebook' | 'twitter'>('instagram');
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(600);

  const handleInsert = () => {
    if (!url) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    onConfirm(url, platform, width, height);
    handleClose();
    toast.success('Publicación insertada correctamente');
  };

  const handleClose = () => {
    setUrl('');
    setPlatform('instagram');
    setWidth(500);
    setHeight(600);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insertar Publicación de Redes Sociales</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter / X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="embed-url">URL de la Publicación</Label>
            <Input
              id="embed-url"
              type="url"
              placeholder={
                platform === 'instagram' 
                  ? 'https://www.instagram.com/p/...'
                  : platform === 'facebook'
                  ? 'https://www.facebook.com/...'
                  : 'https://twitter.com/.../status/...'
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="embed-width">Ancho (px)</Label>
              <Input
                id="embed-width"
                type="number"
                min="300"
                max="800"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 500)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embed-height">Alto (px)</Label>
              <Input
                id="embed-height"
                type="number"
                min="400"
                max="1000"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert}>
            Insertar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
