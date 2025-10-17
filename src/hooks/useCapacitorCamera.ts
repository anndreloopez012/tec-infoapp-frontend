import { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { useToast } from '@/hooks/use-toast';

export const useCapacitorCamera = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const takePicture = async (options?: {
    resultType?: CameraResultType;
    source?: CameraSource;
    quality?: number;
  }): Promise<Photo | null> => {
    setIsLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: options?.quality || 90,
        allowEditing: true,
        resultType: options?.resultType || CameraResultType.Uri,
        source: options?.source || CameraSource.Prompt,
      });

      return image;
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: 'Error de cámara',
        description: 'No se pudo tomar la foto',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  };

  return {
    takePicture,
    requestCameraPermissions,
    isLoading
  };
};