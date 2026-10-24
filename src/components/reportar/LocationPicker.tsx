'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { REGION } from '@/config/region';

// Mapas base sin API key ni marca de agua (Esri), igual que el explorador
const TILE_URL   = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

// Pin verde (sin depender de los íconos por defecto de Leaflet, que no cargan en Next)
const pin = L.divIcon({
  className: '',
  html: `<div style="transform:translate(-50%,-100%)">
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 27 15 27s15-17 15-27C30 6.7 23.3 0 15 0z" fill="#16a34a" stroke="#fafaf9" stroke-width="2"/>
      <circle cx="15" cy="15" r="5" fill="#fafaf9"/>
    </svg></div>`,
  iconSize: [0, 0],
});

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}

function Clicks({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Recentra el mapa cuando el punto cambia desde afuera (búsqueda de dirección)
function Recenter({ value }: { value: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 17));
  }, [value.lat, value.lng, map]);
  return null;
}

export default function LocationPicker({ value, onChange }: Props) {
  return (
    <div className="h-64 w-full rounded-xl overflow-hidden">
    <MapContainer
      center={value ? [value.lat, value.lng] : REGION.pickerCenter}
      zoom={value ? 17 : 14}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url={TILE_URL} maxNativeZoom={18} maxZoom={19} />
      <TileLayer url={LABELS_URL} maxNativeZoom={18} maxZoom={19} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pin}
          draggable
          eventHandlers={{ dragend: (e) => {
            const { lat, lng } = (e.target as L.Marker).getLatLng();
            onChange({ lat, lng });
          } }}
        />
      )}
      <Clicks onChange={onChange} />
      {value && <Recenter value={value} />}
    </MapContainer>
    </div>
  );
}
