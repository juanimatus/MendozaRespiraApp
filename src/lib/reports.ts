import { supabase, getDeviceId } from './supabase';
import type { ReportWithVerifications, ReportType } from '@/types';
import type { PhotoAnalysis } from './photo-analysis';

// ── Listar todos los reportes (para el mapa) ──────────────────────────────
export async function fetchReports(): Promise<ReportWithVerifications[]> {
  const { data, error } = await supabase
    .from('reports_with_verifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReportWithVerifications[];
}

// ── Obtener un reporte por ID ─────────────────────────────────────────────
export async function fetchReport(id: string): Promise<ReportWithVerifications> {
  const { data, error } = await supabase
    .from('reports_with_verifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ReportWithVerifications;
}

// ── Crear un reporte ──────────────────────────────────────────────────────
export interface CreateReportInput {
  lat: number;
  lng: number;
  type: ReportType;
  comment?: string;
  municipio?: string | null;
  address?: string | null;
  gpsLat?: number;
  gpsLng?: number;
  analysis?: PhotoAnalysis | null;
  photo: File;
}

export async function createReport(input: CreateReportInput): Promise<string> {
  const deviceId = getDeviceId();

  // 1. Subir foto a Supabase Storage
  const ext      = input.photo.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('report-photos')
    .upload(fileName, input.photo, { contentType: input.photo.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('report-photos')
    .getPublicUrl(fileName);

  // 2. Insertar reporte
  const base = {
    lat:         input.lat,
    lng:         input.lng,
    type:        input.type,
    comment:     input.comment ?? null,
    municipio:   input.municipio ?? null,
    address:     input.address ?? null,
    ai_risk:     input.analysis?.peligrosidad ?? null,
    ai_summary:  input.analysis?.resumen ?? null,
    ai_analysis: input.analysis ?? null,
    photo_url:   urlData.publicUrl,
    reporter_id: deviceId,
  };
  // Origen del GPS, guardado aparte (migración 010). Si las columnas todavía
  // no existen en la base, se reintenta sin ellas para no romper el envío.
  const withGps = { ...base, gps_lat: input.gpsLat ?? null, gps_lng: input.gpsLng ?? null };

  let res = await supabase.from('reports').insert(withGps).select('id').single();
  if (res.error && /gps_lat|gps_lng|column/.test(res.error.message)) {
    res = await supabase.from('reports').insert(base).select('id').single();
  }
  if (res.error) throw res.error;
  return res.data.id as string;
}

// ── Límite de envíos (migración 007) ─────────────────────────────────────
// La base corta con hint 'rate_limit' si una misma IP manda demasiados envíos seguidos
export const RATE_LIMIT_MESSAGE = 'Demasiados envíos seguidos. Probá de nuevo en un rato.';

export function isRateLimited(err: unknown): boolean {
  const e = err as { hint?: string; message?: string } | null;
  return e?.hint === 'rate_limit' || !!e?.message?.includes('Demasiados envíos');
}

// Mensaje para los rechazos de confirmación (migración 008)
export function verifyErrorMessage(err: unknown): string {
  const e = err as { hint?: string; message?: string } | null;
  if (e?.hint === 'own_report' || e?.message?.includes('subiste vos'))
    return 'No podés confirmar un reporte que subiste vos.';
  if (e?.hint === 'already_confirmed' || e?.message?.includes('ya se confirmó'))
    return 'Desde esta conexión ya se confirmó este reporte.';
  return 'No se pudo confirmar. Probá de nuevo.';
}

// ── ¿Este dispositivo subió el reporte? ──────────────────────────────────
export function isOwnReport(reporterId: string | null): boolean {
  return !!reporterId && reporterId === getDeviceId();
}

// ── Verificar un reporte ──────────────────────────────────────────────────
export async function verifyReport(reportId: string): Promise<void> {
  const deviceId = getDeviceId();

  const { error } = await supabase
    .from('verifications')
    .insert({ report_id: reportId, verifier_id: deviceId });

  // Ignorar error de duplicado (ya verificó este dispositivo)
  if (error && !error.message.includes('unique') && !error.message.includes('duplicate')) throw error;
}

// ── Chequear si el dispositivo actual ya verificó un reporte ─────────────
export async function hasVerified(reportId: string): Promise<boolean> {
  const deviceId = getDeviceId();

  const { data } = await supabase
    .from('verifications')
    .select('id')
    .eq('report_id', reportId)
    .eq('verifier_id', deviceId)
    .maybeSingle();

  return !!data;
}
