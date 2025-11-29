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

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
}

export default function LinkDialog({
  open,
  onClose,
  onConfirm,
  initialUrl = '',
  initialText = '',
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url, text.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setText('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insertar enlace</DialogTitle>
          <DialogDescription>
            Ingresa la URL y el texto que deseas mostrar
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://ejemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-text">Texto (opcional)</Label>
            <Input
              id="link-text"
              placeholder="Texto del enlace"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!url.trim()}>
            Insertar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
