// ============================================================
// Región que muestra la app. Hoy es la provincia de Mendoza; para sumar
// otra provincia o el país alcanza con otra entrada con su GeoJSON y sus
// unidades (departamentos, partidos o municipios).
// ============================================================

import { MUNICIPIOS, ZONAS } from '@/lib/municipios';

export interface RegionConfig {
  id:          string;
  name:        string;
  unitLabel:   string;                       // cómo se llama cada unidad del mapa
  unitLabelPlural: string;
  geojsonUrl:  string;                       // FeatureCollection con properties.nombre
  attribution: string;
  center:      [number, number];
  zoom:        number;
  bounds:      [[number, number], [number, number]];   // [[sur, oeste], [norte, este]]
  units:       readonly string[];
  zones:       Record<string, readonly string[]>;
  focus:       { label: string; units: readonly string[] };   // encuadre inicial del mapa
  pickerCenter: [number, number];            // donde arranca el mapa para marcar un reporte
}

export const MENDOZA: RegionConfig = {
  id:          'mendoza',
  name:        'Mendoza',
  unitLabel:   'departamento',
  unitLabelPlural: 'departamentos',
  geojsonUrl:  '/geo/mendoza-departamentos.geojson',
  attribution: 'Límites: IGN',
  center:      [-34.6, -68.5],
  zoom:        7,
  bounds:      [[-37.6, -70.6], [-32.0, -66.45]],
  units:       MUNICIPIOS,
  zones:       ZONAS,
  focus:       { label: 'Zona Este', units: ZONAS['Zona Este'] },
  pickerCenter: [-33.0815, -68.4705],       // San Martín
};

export const REGION = MENDOZA;
