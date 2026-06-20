import { supabase, getDeviceId } from './supabase';
import type { ReportWithVerifications, ReportType } from '@/types';

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
  const { data, error } = await supabase
    .from('reports')
    .insert({
      lat:         input.lat,
      lng:         input.lng,
      type:        input.type,
      comment:     input.comment ?? null,
      photo_url:   urlData.publicUrl,
      reporter_id: deviceId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

// ── Verificar un reporte ──────────────────────────────────────────────────
export async function verifyReport(reportId: string): Promise<void> {
  const deviceId = getDeviceId();

  const { error } = await supabase
    .from('verifications')
    .insert({ report_id: reportId, verifier_id: deviceId });

  // Ignorar error de duplicado (ya verificó este dispositivo)
  if (error && !error.message.includes('unique')) throw error;
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
