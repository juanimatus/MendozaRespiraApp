// ============================================================
// Métricas públicas de impacto y exportación de datos abiertos
// ============================================================

import type { ReportWithVerifications, ReportType } from '@/types';
import { REPORT_TYPE_LABELS, riskOf } from '@/types';
import { ZONAS } from './municipios';

export interface Count { label: string; value: number }

export interface ImpactStats {
  total:          number;
  verified:       number;
  confirmations:  number;
  reporters:      number;   // dispositivos distintos (anónimos)
  municipios:     number;   // departamentos con al menos un reporte
  highRisk:       number;   // riesgo alto o crítico según la IA
  firstReportAt:  string | null;
  byZona:         Count[];
  byMunicipio:    Count[];
  byType:         Record<ReportType, number>;
  byMonth:        Count[];  // últimos 6 meses, del más viejo al más nuevo
}

function zonaOf(municipio: string | null): string {
  if (!municipio) return 'Sin departamento';
  return Object.entries(ZONAS).find(([, ms]) => (ms as readonly string[]).includes(municipio))?.[0]
    ?? 'Sin departamento';
}

function tally(values: string[]): Count[] {
  const map = new Map<string, number>();
  values.forEach(v => map.set(v, (map.get(v) ?? 0) + 1));
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeImpact(reports: ReportWithVerifications[], now = new Date()): ImpactStats {
  const byType = Object.fromEntries(
    Object.keys(REPORT_TYPE_LABELS).map(t => [t, 0]),
  ) as Record<ReportType, number>;
  reports.forEach(r => { byType[r.type] = (byType[r.type] ?? 0) + 1; });

  const months: Count[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ label: key, value: 0 });
  }
  reports.forEach(r => {
    const m = months.find(x => r.created_at.startsWith(x.label));
    if (m) m.value++;
  });

  const withMunicipio = reports.filter(r => r.municipio).map(r => r.municipio as string);
  const dates = reports.map(r => r.created_at).sort();

  return {
    total:         reports.length,
    verified:      reports.filter(r => r.status === 'verified').length,
    confirmations: reports.reduce((s, r) => s + (r.verification_count ?? 0), 0),
    reporters:     new Set(reports.map(r => r.reporter_id).filter(Boolean)).size,
    municipios:    new Set(withMunicipio).size,
    highRisk:      reports.filter(r => { const k = riskOf(r); return k === 'alta' || k === 'critica'; }).length,
    firstReportAt: dates[0] ?? null,
    byZona:        tally(reports.map(r => zonaOf(r.municipio))),
    byMunicipio:   tally(withMunicipio),
    byType,
    byMonth:       months,
  };
}

// ── Datos abiertos ────────────────────────────────────────────────────────
// No se exporta reporter_id: es un identificador de dispositivo.
const EXPORT_FIELDS = [
  'id', 'created_at', 'type', 'status', 'municipio', 'address', 'ai_risk', 'review_risk', 'review_note', 'reviewed_at', 'ai_summary',
  'comment', 'photo_url', 'verification_count',
] as const;

export function toGeoJSON(reports: ReportWithVerifications[]) {
  return {
    type: 'FeatureCollection',
    features: reports.map(r => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: Object.fromEntries(EXPORT_FIELDS.map(f => [f, r[f] ?? null])),
    })),
  };
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(reports: ReportWithVerifications[]): string {
  const header = ['lat', 'lng', ...EXPORT_FIELDS];
  const rows = reports.map(r =>
    [r.lat, r.lng, ...EXPORT_FIELDS.map(f => r[f])].map(csvCell).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
