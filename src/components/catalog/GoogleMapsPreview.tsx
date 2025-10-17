import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface GoogleMapsPreviewProps {
  value?: string;
  onChange: (iframe: string) => void;
  label?: string;
}

export const GoogleMapsPreview: React.FC<GoogleMapsPreviewProps> = ({
  value = '',
  onChange,
  label = 'Google Maps Embed'
}) => {
  const [iframeCode, setIframeCode] = useState(value);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');

  useEffect(() => {
    validateAndExtractIframe(iframeCode);
  }, [iframeCode]);

  const validateAndExtractIframe = (code: string) => {
    if (!code.trim()) {
      setIsValid(null);
      setPreviewSrc('');
      return;
    }

    // Check if it's an iframe tag
    const iframeRegex = /<iframe[^>]*src=["']([^"']*)["'][^>]*>/i;
    const match = code.match(iframeRegex);

    if (match && match[1]) {
      // Check if it's from Google Maps
      const src = match[1];
      const isGoogleMaps = src.includes('google.com/maps');
      
      if (isGoogleMaps) {
        setIsValid(true);
        setPreviewSrc(src);
      } else {
        setIsValid(false);
        setPreviewSrc('');
      }
    } else {
      setIsValid(false);
      setPreviewSrc('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setIframeCode(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={iframeCode}
        onChange={handleChange}
        placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
        rows={4}
        className="font-mono text-xs"
      />
      
      {isValid === true && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Iframe válido de Google Maps
          </AlertDescription>
        </Alert>
      )}
      
      {isValid === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            El código debe ser un iframe válido de Google Maps. 
            Ve a Google Maps, haz clic en "Compartir" → "Insertar un mapa" y copia el código iframe.
          </AlertDescription>
        </Alert>
      )}

      {previewSrc && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Vista previa:</Label>
          <div className="w-full h-64 rounded-md border overflow-hidden bg-muted">
            <iframe
              src={previewSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Para obtener el código iframe: Ve a Google Maps → Selecciona una ubicación → 
        Haz clic en "Compartir" → "Insertar un mapa" → Copia el código HTML
      </p>
    </div>
  );
};
