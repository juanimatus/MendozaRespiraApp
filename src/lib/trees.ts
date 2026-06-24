import { supabase } from './supabase';
import type { Tree, TreeIntervention, Claim, TreeStats, ClaimsStats } from '@/types/trees';
import { calculatePriority, classifyClaim } from './ai-engine';

// ── Árboles ───────────────────────────────────────────────────────────────
export async function fetchTrees(): Promise<Tree[]> {
  const { data, error } = await supabase
    .from('trees').select('*').order('priority_score', { ascending: false });
  if (error) throw error;
  return data as Tree[];
}

export async function fetchTree(id: string): Promise<Tree> {
  const { data, error } = await supabase
    .from('trees').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Tree;
}

export async function fetchTreeInterventions(treeId: string): Promise<TreeIntervention[]> {
  const { data, error } = await supabase
    .from('tree_interventions').select('*')
    .eq('tree_id', treeId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as TreeIntervention[];
}

export async function updateTreePriority(treeId: string): Promise<void> {
  const tree = await fetchTree(treeId);
  const { score } = calculatePriority(tree);
  await supabase.from('trees').update({ priority_score: score }).eq('id', treeId);
}

// ── Reclamos ──────────────────────────────────────────────────────────────
export async function fetchClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from('claims').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Claim[];
}

export async function createClaim(input: {
  description: string;
  lat?: number;
  lng?: number;
  address?: string;
  photo_url?: string;
  tree_id?: string;
  reporter_id?: string;
}): Promise<Claim> {
  // Clasificar con IA antes de insertar
  const aiResult = classifyClaim(input.description);

  const { data, error } = await supabase
    .from('claims')
    .insert({
      ...input,
      ai_category:   aiResult.category,
      ai_urgency:    aiResult.urgency,
      ai_area:       aiResult.area,
      ai_summary:    aiResult.summary,
      ai_confidence: aiResult.confidence,
      status:        'classified',
    })
    .select().single();

  if (error) throw error;
  return data as Claim;
}

export async function updateClaimStatus(
  claimId: string,
  status: string,
  note?: string,
): Promise<void> {
  await supabase.from('claims').update({
    status,
    resolution_note: note ?? null,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
  }).eq('id', claimId);
}

// ── Stats para dashboard ──────────────────────────────────────────────────
export async function fetchTreeStats(): Promise<TreeStats> {
  const { data, error } = await supabase
    .from('tree_stats').select('*').single();
  if (error) throw error;
  return data as TreeStats;
}

export async function fetchClaimsStats(): Promise<ClaimsStats> {
  const { data, error } = await supabase
    .from('claims_stats').select('*').single();
  if (error) throw error;
  return data as ClaimsStats;
}

// ── Árboles por barrio (para mapa) ───────────────────────────────────────
export async function fetchTreesByNeighborhood(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('trees').select('neighborhood');
  if (error) throw error;
  return (data as { neighborhood: string | null }[]).reduce((acc, row) => {
    const n = row.neighborhood ?? 'Sin barrio';
    acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
