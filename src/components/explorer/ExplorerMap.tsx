'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, Pane, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { REGION } from '@/config/region';
import type { MunicipioStats } from '@/lib/explorer';
import type { ReportWithVerifications } from '@/types';
import { CHORO_STEPS, ZONE_COLORS, type Metric } from './metrics';
import { REPORT_TYPE_COLORS, REPORT_TYPE_LABELS } from '@/types';

function colorFor(value: number, max: number) {
  const i = Math.min(CHORO_STEPS.length - 1, Math.floor((value / max) * CHORO_STEPS.length));
  return CHORO_STEPS[Math.max(0, i)];
}

interface Props {
  stats:            Map<string, MunicipioStats>;
  metric:           Metric;
  byZone:           boolean;                 // pintar cada departamento con el color de su zona
  points:           ReportWithVerifications[];
  selectedUnit:     string | null;
  highlightedId:    string | null;
  onSelectUnit:     (unit: string | null) => void;
  onSelectReport:   (report: ReportWithVerifications) => void;
}

type UnitFeature = Feature<Geometry, { nombre: string }>;

// Mapas base sin API key ni marca de agua (Esri). Se elige con
// NEXT_PUBLIC_MAP_BASE=oscuro|satelite; el usuario puede alternar en el mapa.
const BASEMAPS = {
  oscuro: {
    label: 'Mapa',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 16,
  },
  satelite: {
    label: 'Satélite',
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 18,
  },
} as const;
type Basemap = keyof typeof BASEMAPS;
const DEFAULT_BASEMAP: Basemap =
  process.env.NEXT_PUBLIC_MAP_BASE === 'satelite' ? 'satelite' : 'oscuro';

function Toggle<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl border border-stone-700 bg-stone-950/90 p-0.5 text-xs">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-2.5 py-1 rounded-lg transition-colors ${value === v ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// Créditos del mapa (obligatorios por licencia de Esri):
// plegados en un botón "i" para que no tapen el mapa
function Credits() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      {open && (
        <span className="rounded-lg bg-stone-950/90 border border-stone-700 px-2 py-1 text-[10px] text-stone-400">
          Mapa base © Esri y colaboradores · {REGION.attribution}
        </span>
      )}
      <button onClick={() => setOpen(o => !o)} aria-label="Créditos del mapa" aria-expanded={open}
        className="w-6 h-6 rounded-full bg-stone-950/90 border border-stone-700 text-[11px] font-semibold text-stone-400 hover:text-stone-200">
        i
      </button>
    </div>
  );
}

// Encuadra la región o el departamento elegido
// (sin departamento elegido: la zona foco o toda la región)
function FitTo({ geo, unit, focus }: { geo: FeatureCollection | null; unit: string | null; focus: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!geo) return;
    const names = unit ? [unit] : focus ? REGION.focus.units : null;
    const features = names
      ? geo.features.filter(f => names.includes((f as UnitFeature).properties.nombre))
      : geo.features;
    if (!features.length) return;
    const bounds = L.geoJSON({ type: 'FeatureCollection', features } as FeatureCollection).getBounds();
    map.flyToBounds(bounds, { padding: [24, 24], duration: 0.6 });
  }, [geo, unit, focus, map]);
  return null;
}

export default function ExplorerMap({
  stats, metric, byZone, points, selectedUnit, highlightedId, onSelectUnit, onSelectReport,
}: Props) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const [basemap, setBasemap] = useState<Basemap>(DEFAULT_BASEMAP);
  const [focus, setFocus] = useState(true);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const handlers = useRef({ onSelectUnit, selectedUnit });
  handlers.current = { onSelectUnit, selectedUnit };

  useEffect(() => {
    fetch(REGION.geojsonUrl).then(r => r.json()).then(setGeo).catch(console.error);
  }, []);

  const max = useMemo(
    () => Math.max(1, ...Array.from(stats.values()).map(s => s[metric])),
    [stats, metric],
  );

  function styleFor(feature?: Feature) {
    const name  = (feature as UnitFeature | undefined)?.properties.nombre ?? '';
    const value = stats.get(name)?.[metric] ?? 0;
    const isSelected = name === selectedUnit;
    const isHovered  = name === hoveredUnit;
    const dimmed     = selectedUnit !== null && !isSelected;
    if (byZone) {
      const zone = Object.keys(REGION.zones).find(z => REGION.zones[z].includes(name));
      return {
        color:       isSelected ? '#fafaf9' : isHovered ? '#e7e5e4' : '#1c1917',
        weight:      isSelected ? 2.5 : isHovered ? 2 : 1,
        dashArray:   undefined,
        fillColor:   zone ? ZONE_COLORS[zone] : '#78716c',
        fillOpacity: dimmed ? 0.12 : isSelected ? 0.6 : 0.4,
      };
    }
    return {
      color:       isSelected ? '#fafaf9' : isHovered ? '#d6d3d1' : '#57534e',
      weight:      isSelected ? 2.5 : isHovered ? 2 : 1,
      dashArray:   value === 0 ? '3 4' : undefined,
      fillColor:   value === 0 ? '#78716c' : colorFor(value, max),
      fillOpacity: value === 0 ? 0.04 : dimmed ? 0.15 : isSelected ? 0.85 : 0.65,
    };
  }

  function tooltipFor(name: string) {
    const s = stats.get(name);
    return `<strong>${name}</strong><br/>${s?.total ?? 0} reportes · ${s?.high_risk ?? 0} con riesgo alto`;
  }

  // Restilar sin recrear las capas (recrearlas en cada hover corta el tooltip)
  useEffect(() => {
    layerRef.current?.eachLayer(layer => {
      const path = layer as L.Path & { feature?: UnitFeature };
      path.setStyle(styleFor(path.feature));
      if (path.feature) path.setTooltipContent(tooltipFor(path.feature.properties.nombre));
      if (path.feature?.properties.nombre === selectedUnit) path.bringToFront();
    });
  });

  return (
    <div className="relative h-full w-full">
    <MapContainer
      center={REGION.center}
      zoom={REGION.zoom}
      minZoom={6}
      maxBounds={L.latLngBounds(REGION.bounds).pad(0.3)}
      className="h-full w-full bg-stone-950"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer key={basemap} url={BASEMAPS[basemap].url}
        maxNativeZoom={BASEMAPS[basemap].maxNativeZoom} maxZoom={19} />
      {/* Nombres de calles y localidades por encima de los departamentos */}
      <Pane name="labels" style={{ zIndex: 380, pointerEvents: 'none' }}>
        <TileLayer key={`${basemap}-labels`} url={BASEMAPS[basemap].labels}
          maxNativeZoom={BASEMAPS[basemap].maxNativeZoom} maxZoom={19} />
      </Pane>
      <FitTo geo={geo} unit={selectedUnit} focus={focus} />

      {/* Los departamentos van en un panel debajo de los puntos */}
      <Pane name="choropleth" style={{ zIndex: 350 }}>
      {geo && (
        <GeoJSON
          ref={layerRef}
          data={geo}
          style={styleFor}
          onEachFeature={(feature, layer) => {
            const name = (feature as UnitFeature).properties.nombre;
            layer.bindTooltip(tooltipFor(name), { sticky: true, className: 'explorer-tooltip' });
            layer.on({
              mouseover: () => setHoveredUnit(name),
              mouseout:  () => setHoveredUnit(h => (h === name ? null : h)),
              click: () => {
                const { onSelectUnit, selectedUnit } = handlers.current;
                onSelectUnit(selectedUnit === name ? null : name);
              },
            });
          }}
        />
      )}
      </Pane>

      {points.map(r => {
        const highlighted = r.id === highlightedId;
        const inScope = !selectedUnit || r.municipio === selectedUnit;
        return (
          <CircleMarker
            key={r.id}
            center={[r.lat, r.lng]}
            radius={highlighted ? 11 : 7}
            pathOptions={{
              color:       highlighted ? '#fafaf9' : '#0c0a09',
              fillColor:   REPORT_TYPE_COLORS[r.type],
              fillOpacity: inScope ? 0.95 : 0.25,
              weight:      highlighted ? 3 : 1.5,
              opacity:     inScope ? 1 : 0.3,
            }}
            eventHandlers={{ click: () => onSelectReport(r) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {REPORT_TYPE_LABELS[r.type]}{r.address ? ` · ${r.address}` : ''}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
    <div className="absolute top-3 right-3 z-[999] flex flex-col items-end gap-1.5">
      <Credits />
      <Toggle value={basemap} onChange={setBasemap}
        options={(Object.keys(BASEMAPS) as Basemap[]).map(b => [b, BASEMAPS[b].label])} />
      <Toggle value={focus ? 'focus' : 'all'} onChange={v => { setFocus(v === 'focus'); onSelectUnit(null); }}
        options={[['focus', REGION.focus.label], ['all', REGION.name]]} />
    </div>
    </div>
  );
}
