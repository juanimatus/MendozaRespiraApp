// ============================================================
// Departamentos de Mendoza y detección por geocodificación reversa
// ============================================================

export const MUNICIPIOS = [
  'Capital', 'General Alvear', 'Godoy Cruz', 'Guaymallén', 'Junín', 'La Paz',
  'Las Heras', 'Lavalle', 'Luján de Cuyo', 'Maipú', 'Malargüe', 'Rivadavia',
  'San Carlos', 'San Martín', 'San Rafael', 'Santa Rosa', 'Tunuyán', 'Tupungato',
] as const;

export type Municipio = (typeof MUNICIPIOS)[number];

export const ZONAS: Record<string, readonly Municipio[]> = {
  'Zona Este':    ['San Martín', 'Junín', 'Rivadavia', 'Santa Rosa', 'La Paz'],
  'Gran Mendoza': ['Capital', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'Lavalle'],
  'Valle de Uco': ['Tunuyán', 'Tupungato', 'San Carlos'],
  'Zona Sur':     ['San Rafael', 'General Alvear', 'Malargüe'],
};

// Localidades que OpenStreetMap suele devolver sin el departamento
const ALIASES: Record<string, Municipio> = {
  'mendoza':           'Capital',
  'ciudad de mendoza': 'Capital',
  'palmira':           'San Martín',
  'villa nueva':       'Guaymallén',
  'dorrego':           'Guaymallén',
  'chacras de coria':  'Luján de Cuyo',
  'rodeo del medio':   'Maipú',
  'el algarrobal':     'Las Heras',
};

function normalize(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^(departamento|depto\.?|municipio)( de)?\s+/, '')
    .replace(/\s+department$/, '')
    .trim();
}

const BY_NORMALIZED = new Map<string, Municipio>(
  MUNICIPIOS.map(m => [normalize(m), m]),
);

export function matchMunicipio(name: string | null | undefined): Municipio | null {
  if (!name) return null;
  const n = normalize(name);
  return BY_NORMALIZED.get(n) ?? ALIASES[n] ?? null;
}

export interface GeoResult {
  municipio: Municipio | null;
  address:   string | null;
}

// Geocodificación reversa con Nominatim (OpenStreetMap, sin API key).
// Política de uso: 1 request/seg como máximo; acá se llama una vez por reporte.
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=es`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const a = data.address ?? {};

  // Del más específico al más general: el departamento suele venir en
  // county o state_district; la localidad en city / town / village.
  const candidates = [
    a.county, a.state_district, a.municipality,
    a.city, a.town, a.village, a.suburb, a.city_district,
  ];
  const municipio = candidates.map(matchMunicipio).find(Boolean) ?? null;

  const street  = [a.road, a.house_number].filter(Boolean).join(' ');
  const place   = a.city ?? a.town ?? a.village ?? a.suburb;
  const address = [street, place].filter(Boolean).join(', ') || null;

  return { municipio, address };
}
