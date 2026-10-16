// ============================================================
// Revisión técnica: un ingeniero agrónomo (rol inspector o admin) confirma
// el nivel de riesgo de cada reporte. Requiere migración 005.
// ============================================================

import { createClient } from './supabase-browser';
import type { ReportWithVerifications, RiskLevel } from '@/types';

export const REVIEW_PAGE_SIZE = 20;

export async function fetchReviewQueue(reviewed: boolean): Promise<ReportWithVerifications[]> {
  const supabase = createClient();
  const q = supabase.from('reports_with_verifications').select('*').limit(REVIEW_PAGE_SIZE);
  const { data, error } = reviewed
    ? await q.not('reviewed_at', 'is', null).order('reviewed_at', { ascending: false })
    : await q.is('reviewed_at', null).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReportWithVerifications[];
}

// Usa la sesión del técnico: la función en la base rechaza a quien no sea inspector o admin
export async function submitReview(reportId: string, risk: RiskLevel, note: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('review_report', {
    p_report: reportId,
    p_risk:   risk,
    p_note:   note,
  });
  if (error) throw error;
}

// Descarta un reporte (foto inapropiada, duplicado, spam): deja de verse en el mapa y
// en las estadísticas, pero queda guardado. Requiere migración 007.
export async function hideReport(reportId: string, reason: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('hide_report', {
    p_report: reportId,
    p_reason: reason.trim() || null,
  });
  if (error) throw error;
}
