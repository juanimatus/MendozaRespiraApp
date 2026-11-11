// Mapas base sin API key ni marca de agua (Esri). Se elige con
// NEXT_PUBLIC_MAP_BASE=oscuro|satelite; el usuario puede alternar en el mapa.
export const BASEMAPS = {
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
export type Basemap = keyof typeof BASEMAPS;
export const DEFAULT_BASEMAP: Basemap =
  process.env.NEXT_PUBLIC_MAP_BASE === 'satelite' ? 'satelite' : 'oscuro';
