import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  addressText: string;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Map Updater Component to center map on new coordinates
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Event handler for clicking to move the marker
const LocationMarker = ({ position, setPosition, onLocationSelect }: any) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          onLocationSelect(pos.lat, pos.lng);
        },
      }}
    />
  );
};

export default function MapComponent({ addressText, onLocationSelect }: MapComponentProps) {
  // Default center: Dhaka, Bangladesh
  const [position, setPosition] = useState<[number, number]>([23.8103, 90.4125]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When addressText changes, debounce a geocoding request to update map center
  useEffect(() => {
    // Clean up empty commas and trim
    const cleanAddress = addressText.split(',').map(s => s.trim()).filter(s => s.length > 0).join(', ');
    if (!cleanAddress || cleanAddress.length < 5) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        // Try full address first
        const query = encodeURIComponent(cleanAddress);
        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        let data = await response.json();
        
        // Fallback to less specific address (e.g., City, Country) if not found
        if (!data || data.length === 0) {
          const parts = cleanAddress.split(',');
          if (parts.length > 2) {
            const fallbackQuery = encodeURIComponent(`${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`);
            response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`);
            data = await response.json();
          }
        }

        if (data && data.length > 0) {
          const newPos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          setPosition(newPos);
          onLocationSelect(newPos[0], newPos[1]);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }, 1500); // 1.5s debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [addressText]);

  return (
    <div className="w-full h-full min-h-[250px] relative rounded-md overflow-hidden border border-slate-300">
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', minHeight: '250px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
      <div className="absolute top-2 right-2 z-[1000] bg-white px-2 py-1 text-[10px] font-bold rounded shadow border border-slate-200">
        Pin or drag to select exact location
      </div>
    </div>
  );
}
