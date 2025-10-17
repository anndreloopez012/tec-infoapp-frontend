import { useState } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

export const useCapacitorGeolocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const { toast } = useToast();

  const getCurrentPosition = async (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
  }): Promise<Position | null> => {
    setIsLoading(true);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy || true,
        timeout: options?.timeout || 10000,
      });

      setCurrentPosition(position);
      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: 'Error de ubicación',
        description: 'No se pudo obtener la ubicación actual',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const watchPosition = async (callback: (position: Position) => void) => {
    try {
      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      }, callback);

      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      toast({
        title: 'Error de ubicación',
        description: 'No se pudo monitorear la ubicación',
        variant: 'destructive'
      });
      return null;
    }
  };

  const clearWatch = async (watchId: string) => {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing watch:', error);
    }
  };

  const requestLocationPermissions = async (): Promise<boolean> => {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  };

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
    requestLocationPermissions,
    currentPosition,
    isLoading
  };
};