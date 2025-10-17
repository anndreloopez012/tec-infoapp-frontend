import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useCapacitorGeolocation } from '@/hooks/useCapacitorGeolocation';

interface LocationMapPickerProps {
  value?: string;
  onChange: (coordinates: string) => void;
  label?: string;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  value = '',
  onChange,
  label = 'Ubicación Física'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [coordinates, setCoordinates] = useState(value);
  const { getCurrentPosition, isLoading } = useCapacitorGeolocation();

  // Parse coordinates from string "lat,lng"
  const parseCoordinates = (coordString: string): [number, number] | null => {
    if (!coordString) return null;
    const parts = coordString.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[1], parts[0]]; // mapbox uses [lng, lat]
    }
    return null;
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with a default token message
    const initialCoords = parseCoordinates(value) || [-99.1332, 19.4326]; // Default to Mexico City
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCoords,
      zoom: 12,
      accessToken: 'YOUR_MAPBOX_TOKEN' // User needs to replace this
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#3b82f6'
    })
      .setLngLat(initialCoords)
      .addTo(map.current);

    // Update coordinates when marker is dragged
    marker.current.on('dragend', () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      const coordString = `${lngLat.lat.toFixed(6)},${lngLat.lng.toFixed(6)}`;
      setCoordinates(coordString);
      onChange(coordString);
    });

    // Add click handler to move marker
    map.current.on('click', (e) => {
      if (!marker.current) return;
      marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      const coordString = `${e.lngLat.lat.toFixed(6)},${e.lngLat.lng.toFixed(6)}`;
      setCoordinates(coordString);
      onChange(coordString);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update marker when value changes externally
  useEffect(() => {
    if (value && marker.current && map.current) {
      const coords = parseCoordinates(value);
      if (coords) {
        marker.current.setLngLat(coords);
        map.current.setCenter(coords);
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCoordinates(newValue);
    onChange(newValue);
    
    const coords = parseCoordinates(newValue);
    if (coords && marker.current && map.current) {
      marker.current.setLngLat(coords);
      map.current.setCenter(coords);
    }
  };

  const handleGetCurrentLocation = async () => {
    const position = await getCurrentPosition();
    if (position) {
      const coordString = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
      setCoordinates(coordString);
      onChange(coordString);
      
      if (marker.current && map.current) {
        marker.current.setLngLat([position.coords.longitude, position.coords.latitude]);
        map.current.setCenter([position.coords.longitude, position.coords.latitude]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={coordinates}
          onChange={handleInputChange}
          placeholder="latitud,longitud (ej: 19.4326,-99.1332)"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-md border bg-muted"
      />
      <p className="text-xs text-muted-foreground">
        Haz clic en el mapa o arrastra el marcador para seleccionar una ubicación. 
        Nota: Necesitas agregar tu token de Mapbox en el código.
      </p>
    </div>
  );
};
