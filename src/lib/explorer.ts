// ============================================================
// Datos del explorador: estadísticas por departamento, feed paginado y
// suscripción a reportes nuevos.
// ============================================================

import { supabase } from './supabase';
import type { ReportWithVerifications, ReportType, RiskLevel } from '@/types';
import { riskOf } from '@/types';

export interface MunicipioStats {
  municipio:      string;
  total:          number;
  verified:       number;
  high_risk:      number;
  last_30d:       number;
  confirmations:  number;
  last_report_at: string | null;
}

export async function fetchMunicipioStats(): Promise<MunicipioStats[]> {
  const { data, error } = await supabase.from('municipio_stats').select('*');
  if (error) throw error;
  return (data ?? []) as MunicipioStats[];
}

export interface FeedFilters {
  municipios?: readonly string[] | null;   // null = toda la región
  types?:      readonly ReportType[] | null;
  risks?:      readonly RiskLevel[] | null;
}

export const FEED_PAGE_SIZE = 12;

// Paginación por fecha (keyset): más estable que offset con reportes entrando en vivo
export async function fetchFeedPage(
  filters: FeedFilters,
  before?: string,
): Promise<ReportWithVerifications[]> {
  let q = supabase
    .from('reports_with_verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (filters.municipios?.length) q = q.in('municipio', filters.municipios as string[]);
  if (filters.types?.length)      q = q.in('type', filters.types as string[]);
  if (filters.risks?.length)      q = q.in('risk', filters.risks as string[]);
  if (before)                     q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReportWithVerifications[];
}

// Puntos para el mapa: solo lo necesario para dibujar y abrir el detalle
export async function fetchMapPoints(filters: FeedFilters): Promise<ReportWithVerifications[]> {
  let q = supabase
    .from('reports_with_verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (filters.types?.length) q = q.in('type', filters.types as string[]);
  if (filters.risks?.length) q = q.in('risk', filters.risks as string[]);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReportWithVerifications[];
}

export function matchesFilters(r: ReportWithVerifications, f: FeedFilters): boolean {
  if (f.municipios?.length && !(r.municipio && f.municipios.includes(r.municipio))) return false;
  if (f.types?.length && !f.types.includes(r.type)) return false;
  const risk = riskOf(r);
  if (f.risks?.length && !(risk && f.risks.includes(risk))) return false;
  return true;
}

export function subscribeToNewReports(onInsert: (r: ReportWithVerifications) => void): () => void {
  const channel = supabase
    .channel('reports-explorer')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reports' },
      payload => onInsert({ ...(payload.new as ReportWithVerifications), verification_count: 0 }),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
