'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, Pane, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { BASEMAPS, type Basemap } from '@/components/explorer/basemaps';
import { RISK_COLORS, RISK_LABELS } from '@/types';
import { DEMO_LINES, DEMO_TYPE_LABELS, type DemoCase } from '@/lib/demo/data';

export const TENSION_COLORS = { MT: '#facc15', BT: '#a8a29e' } as const;

interface Props {
  cases:      DemoCase[];
  zona:       string | null;
  selectedId: string | null;
  onSelect:   (c: DemoCase) => void;
}

function FitTo({ zona }: { zona: string | null }) {
  const map = useMap();
  useEffect(() => {
    const lines = DEMO_LINES.filter(l => !zona || l.zona === zona);
    const bounds = L.latLngBounds(lines.flatMap(l => l.path));
    map.flyToBounds(bounds, { padding: [30, 30], duration: 0.6 });
  }, [zona, map]);
  return null;
}

export default function DemoMap({ cases, zona, selectedId, onSelect }: Props) {
  const [basemap, setBasemap] = useState<Basemap>('satelite');

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[-33.13, -68.48]} zoom={12} className="h-full w-full bg-stone-950"
        zoomControl={false} attributionControl={false}>
        <TileLayer key={basemap} url={BASEMAPS[basemap].url}
          maxNativeZoom={BASEMAPS[basemap].maxNativeZoom} maxZoom={19} />
        <Pane name="labels" style={{ zIndex: 380, pointerEvents: 'none' }}>
          <TileLayer key={`${basemap}-labels`} url={BASEMAPS[basemap].labels}
            maxNativeZoom={BASEMAPS[basemap].maxNativeZoom} maxZoom={19} />
        </Pane>
        <FitTo zona={zona} />

        {DEMO_LINES.map(l => {
          const inScope = !zona || l.zona === zona;
          return (
            <Polyline key={l.id} positions={l.path}
              pathOptions={{
                color: TENSION_COLORS[l.tension],
                weight: l.tension === 'MT' ? 4 : 2.5,
                opacity: inScope ? 0.9 : 0.25,
                dashArray: l.tension === 'BT' ? '6 5' : undefined,
              }}>
              <Tooltip sticky>{l.name} · {l.tension} · {l.usuarios.toLocaleString('es-AR')} usuarios (ficticio)</Tooltip>
            </Polyline>
          );
        })}

        {cases.map(c => {
          const selected = c.id === selectedId;
          const done = c.status === 'resuelto';
          return (
            <CircleMarker key={c.id} center={[c.lat, c.lng]}
              radius={selected ? 11 : done ? 5 : 7}
              pathOptions={{
                color:       selected ? '#fafaf9' : '#0c0a09',
                weight:      selected ? 3 : 1.5,
                fillColor:   done ? '#d6d3d1' : RISK_COLORS[c.risk],
                fillOpacity: done ? 0.5 : 0.95,
              }}
              eventHandlers={{ click: () => onSelect(c) }}>
              <Tooltip direction="top" offset={[0, -6]}>
                {c.id} · {DEMO_TYPE_LABELS[c.type]} · {done ? 'Resuelto' : RISK_LABELS[c.risk]}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[999] flex rounded-xl border border-stone-700 bg-stone-950/90 p-0.5 text-xs">
        {(Object.keys(BASEMAPS) as Basemap[]).map(b => (
          <button key={b} onClick={() => setBasemap(b)}
            className={`px-2.5 py-1 rounded-lg ${basemap === b ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
            {BASEMAPS[b].label}
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 z-[999] origin-bottom-left max-sm:scale-[0.85] rounded-xl border border-stone-700 bg-stone-950/90 px-3 py-2 text-[11px] text-stone-300 space-y-1">
        <div className="flex items-center gap-2"><span className="w-5 h-1 rounded" style={{ background: TENSION_COLORS.MT }} /> Media tensión</div>
        <div className="flex items-center gap-2"><span className="w-5 h-0 border-t-2 border-dashed" style={{ borderColor: TENSION_COLORS.BT }} /> Baja tensión</div>
        <div className="flex items-center gap-2 pt-1">
          {(['critica', 'alta', 'media', 'baja'] as const).map(r => (
            <span key={r} className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[r] }} title={RISK_LABELS[r]} />
          ))}
          <span>riesgo</span>
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300/50 ml-1" /> resuelto
        </div>
        <p className="text-stone-500">Trazados ficticios · Mapa © Esri</p>
      </div>
    </div>
  );
}
