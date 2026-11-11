// ============================================================
// DEMO PRIVADO PARA DISTRIBUIDORAS ELÉCTRICAS
//
// Todo lo de este archivo es FICTICIO: la distribuidora, los alimentadores,
// los trazados de las líneas, los hallazgos y los costos. Se genera en el
// navegador con una semilla fija (siempre da lo mismo) y nunca se lee ni se
// escribe en Supabase, así que no se mezcla con los reportes reales.
// ============================================================

import type { RiskLevel } from '@/types';

export const DEMO_CLIENT = 'Distribuidora Ejemplo S.A. (ficticia)';
export const DEMO_DISCLAIMER =
  'Datos ficticios generados para demostración. No representan líneas, clientes ni casos reales.';

export type Tension = 'BT' | 'MT';
export type DemoType = 'rama_peligrosa' | 'arbol_peligroso' | 'arbol_seco';
export type DemoStatus = 'nuevo' | 'programado' | 'resuelto';
export type DemoOrigin = 'vecino' | 'cuadrilla';

export const TENSION_LABELS: Record<Tension, string> = {
  BT: 'Baja tensión',
  MT: 'Media tensión',
};

export const DEMO_TYPE_LABELS: Record<DemoType, string> = {
  rama_peligrosa:  'Rama sobre la línea',
  arbol_peligroso: 'Árbol inclinado hacia la línea',
  arbol_seco:      'Árbol seco junto a la línea',
};

export const STATUS_LABELS: Record<DemoStatus, string> = {
  nuevo:      'Nuevo',
  programado: 'Programado',
  resuelto:   'Resuelto',
};

export const STATUS_COLORS: Record<DemoStatus, string> = {
  nuevo:      '#f59e0b',
  programado: '#3b82f6',
  resuelto:   '#22c55e',
};

// Alimentadores inventados, con trazados aproximados sobre la Zona Este.
// Los nombres y recorridos NO son de ninguna red real.
export interface DemoLine {
  id:       string;
  name:     string;
  tension:  Tension;
  zona:     string;      // departamento
  usuarios: number;      // usuarios que dependen del tramo (ficticio)
  path:     [number, number][];
}

export const DEMO_LINES: DemoLine[] = [
  { id: 'A1', name: 'Alimentador Demo A1', tension: 'MT', zona: 'San Martín', usuarios: 4200,
    path: [[-33.060, -68.505], [-33.072, -68.490], [-33.081, -68.472], [-33.090, -68.455], [-33.098, -68.438]] },
  { id: 'A2', name: 'Alimentador Demo A2', tension: 'BT', zona: 'San Martín', usuarios: 900,
    path: [[-33.070, -68.462], [-33.077, -68.468], [-33.085, -68.478], [-33.094, -68.486]] },
  { id: 'A3', name: 'Alimentador Demo A3', tension: 'BT', zona: 'San Martín', usuarios: 750,
    path: [[-33.066, -68.484], [-33.074, -68.479], [-33.079, -68.461], [-33.083, -68.447]] },
  { id: 'B1', name: 'Alimentador Demo B1', tension: 'MT', zona: 'Junín', usuarios: 2600,
    path: [[-33.118, -68.520], [-33.131, -68.505], [-33.143, -68.492], [-33.152, -68.478]] },
  { id: 'B2', name: 'Alimentador Demo B2', tension: 'BT', zona: 'Junín', usuarios: 620,
    path: [[-33.138, -68.500], [-33.146, -68.497], [-33.153, -68.488]] },
  { id: 'C1', name: 'Alimentador Demo C1', tension: 'MT', zona: 'Rivadavia', usuarios: 3100,
    path: [[-33.170, -68.490], [-33.181, -68.476], [-33.191, -68.463], [-33.200, -68.447]] },
  { id: 'C2', name: 'Alimentador Demo C2', tension: 'BT', zona: 'Rivadavia', usuarios: 540,
    path: [[-33.185, -68.475], [-33.192, -68.470], [-33.198, -68.459]] },
];

export const DEMO_ZONAS = Array.from(new Set(DEMO_LINES.map(l => l.zona)));

export const SPECIES = ['Morera', 'Fresno', 'Plátano', 'Paraíso', 'Acacia visco', 'Olmo'];

export interface DemoCase {
  id:          string;
  lineId:      string;
  lineName:    string;
  tension:     Tension;
  zona:        string;
  usuarios:    number;
  lat:         number;
  lng:         number;
  type:        DemoType;
  origin:      DemoOrigin;
  risk:        RiskLevel;
  distanciaM:  number;      // distancia aproximada copa-conductor
  alturaM:     number;
  especie:     string;
  status:      DemoStatus;
  reportedAt:  string;      // ISO
  reviewedAt:  string;      // ISO: revisión del agrónomo
  resolvedAt:  string | null;
  emergencia:  boolean;     // se resolvió como poda de urgencia (no planificada)
}

// Generador pseudoaleatorio con semilla: los datos son siempre iguales
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[], weights?: number[]): T {
  if (!weights) return items[Math.floor(rand() * items.length)];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// Fecha fija de referencia: la demo no "envejece" según el día en que se abre
export const DEMO_TODAY = new Date('2026-11-20T12:00:00-03:00');
const DAY = 86_400_000;

function generate(): DemoCase[] {
  const rand = mulberry32(2026);
  const out: DemoCase[] = [];
  let n = 1;
  for (const line of DEMO_LINES) {
    const count = line.tension === 'MT' ? 14 : 8;
    for (let i = 0; i < count; i++) {
      // Punto sobre un tramo de la línea, corrido unos metros hacia la vereda
      const seg = Math.floor(rand() * (line.path.length - 1));
      const t = rand();
      const [a, b] = [line.path[seg], line.path[seg + 1]];
      const lat = a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * 0.0008;
      const lng = a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * 0.0008;

      const type = pick(rand, ['rama_peligrosa', 'arbol_peligroso', 'arbol_seco'] as const, [6, 2, 2]);
      const distanciaM = Math.round((0.2 + rand() * 2.8) * 10) / 10;
      const risk: RiskLevel =
        distanciaM < 0.6 ? (type === 'rama_peligrosa' ? 'critica' : 'alta')
        : distanciaM < 1.2 ? 'alta'
        : distanciaM < 2 ? 'media' : 'baja';

      const ageDays = Math.floor(rand() * 120);
      const reportedAt = new Date(DEMO_TODAY.getTime() - ageDays * DAY);
      const reviewedAt = new Date(reportedAt.getTime() + (1 + Math.floor(rand() * 3)) * DAY);
      const status: DemoStatus =
        ageDays > 30 ? pick(rand, ['resuelto', 'programado'] as const, [8, 2])
        : ageDays > 10 ? pick(rand, ['resuelto', 'programado', 'nuevo'] as const, [4, 4, 2])
        : pick(rand, ['programado', 'nuevo'] as const, [3, 7]);
      const resolvedAt = status === 'resuelto'
        ? new Date(reviewedAt.getTime() + (4 + Math.floor(rand() * 20)) * DAY)
        : null;

      out.push({
        id:         `D-${String(n++).padStart(3, '0')}`,
        lineId:     line.id,
        lineName:   line.name,
        tension:    line.tension,
        zona:       line.zona,
        usuarios:   line.usuarios,
        lat, lng, type,
        origin:     rand() < 0.7 ? 'vecino' : 'cuadrilla',
        risk, distanciaM,
        alturaM:    Math.round(6 + rand() * 12),
        especie:    pick(rand, SPECIES),
        status,
        reportedAt: reportedAt.toISOString(),
        reviewedAt: reviewedAt.toISOString(),
        resolvedAt: resolvedAt && resolvedAt < DEMO_TODAY ? resolvedAt.toISOString() : null,
        emergencia: status === 'resuelto' && rand() < 0.15,
      });
    }
  }
  // Un caso resuelto con fecha futura se pasa a programado
  return out.map(c => (c.status === 'resuelto' && !c.resolvedAt ? { ...c, status: 'programado' } : c));
}

export const DEMO_CASES: DemoCase[] = generate();

// ------------------------------------------------------------
// Costos de referencia (FICTICIOS, en pesos). Se pueden editar en la demo
// para mostrar cómo cambia el plan con los valores de cada distribuidora.
// ------------------------------------------------------------
export interface CostTable {
  podaBT:      number;   // poda de despeje en baja tensión
  podaMT:      number;   // poda en media tensión (con corte o equipo aislado)
  extraccion:  number;   // extracción de árbol seco o inclinado
  emergencia:  number;   // recargo por salir de urgencia (multiplicador)
}

export const DEFAULT_COSTS: CostTable = {
  podaBT:     180_000,
  podaMT:     420_000,
  extraccion: 650_000,
  emergencia: 2.5,
};

export function costOf(c: Pick<DemoCase, 'type' | 'tension'>, costs: CostTable): number {
  if (c.type === 'rama_peligrosa') return c.tension === 'MT' ? costs.podaMT : costs.podaBT;
  return costs.extraccion + (c.tension === 'MT' ? costs.podaMT - costs.podaBT : 0);
}

// ------------------------------------------------------------
// Puntaje de prioridad (0-100): riesgo del agrónomo, cercanía a la línea,
// tensión y cantidad de usuarios que dependen del tramo.
// ------------------------------------------------------------
const RISK_POINTS: Record<RiskLevel, number> = { ninguna: 0, baja: 10, media: 25, alta: 40, critica: 50 };

export function priorityOf(c: DemoCase): number {
  const cercania = Math.max(0, 20 - c.distanciaM * 7);          // hasta 20
  const tension  = c.tension === 'MT' ? 15 : 5;                 // hasta 15
  const usuarios = Math.min(15, (c.usuarios / 4200) * 15);      // hasta 15
  return Math.round(RISK_POINTS[c.risk] + cercania + tension + usuarios);
}

export function formatARS(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Resumen para el informe de evidencia
export function summarize(cases: DemoCase[], costs: CostTable) {
  const resolved = cases.filter(c => c.status === 'resuelto' && c.resolvedAt);
  const open     = cases.filter(c => c.status !== 'resuelto');
  const days = resolved.map(c =>
    (new Date(c.resolvedAt!).getTime() - new Date(c.reportedAt).getTime()) / DAY);
  const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
  const planned = resolved.filter(c => !c.emergencia);
  const urgent  = resolved.filter(c => c.emergencia);
  // Ahorro estimado: lo que hubiera costado resolver de urgencia lo que se hizo planificado
  const ahorro = planned.reduce((s, c) => s + costOf(c, costs) * (costs.emergencia - 1), 0);
  return {
    total:        cases.length,
    porVecinos:   cases.filter(c => c.origin === 'vecino').length,
    resueltos:    resolved.length,
    abiertos:     open.length,
    criticosAbiertos: open.filter(c => c.risk === 'critica' || c.risk === 'alta').length,
    avgDays,
    planificadas: planned.length,
    urgencias:    urgent.length,
    ahorro,
    invertido:    resolved.reduce((s, c) => s + costOf(c, costs) * (c.emergencia ? costs.emergencia : 1), 0),
    pendiente:    open.reduce((s, c) => s + costOf(c, costs), 0),
  };
}
