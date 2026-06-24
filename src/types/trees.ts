// ============================================================
// Tipos del inventario de arbolado — Mendoza Respira AI
// ============================================================

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
export type TrafficLevel = 'low' | 'medium' | 'high';
export type InterventionType =
  | 'poda' | 'riego' | 'tratamiento_fitosanitario'
  | 'apuntalamiento' | 'extraccion' | 'plantacion'
  | 'relevamiento' | 'otro';
export type ClaimStatus =
  | 'pending' | 'classified' | 'assigned' | 'in_progress' | 'resolved' | 'dismissed';
export type ClaimUrgency = 'low' | 'medium' | 'high' | 'critical';

// ── Árbol ─────────────────────────────────────────────────────────────────
export interface Tree {
  id: string;
  created_at: string;
  updated_at: string;
  lat: number;
  lng: number;
  address: string | null;
  neighborhood: string | null;
  zone: string | null;
  species: string;
  common_name: string;
  is_native: boolean;
  health_status: HealthStatus;
  estimated_age: number | null;
  trunk_diameter: number | null;
  height: number | null;
  canopy_diameter: number | null;
  priority_score: number;
  risk_factors: string[];
  near_school: boolean;
  near_hospital: boolean;
  near_acequia: boolean;
  traffic_level: TrafficLevel;
  last_ai_analysis: AIVisionResult | null;
  ai_analyzed_at: string | null;
  ai_recommendation: string | null;
  surveyed_by: string | null;
  surveyed_at: string | null;
  photo_url: string | null;
  notes: string | null;
}

export interface TreeIntervention {
  id: string;
  created_at: string;
  tree_id: string;
  type: InterventionType;
  description: string | null;
  performed_by: string | null;
  cost: number | null;
  photo_url: string | null;
  result: 'successful' | 'partial' | 'failed' | null;
}

// ── Reclamo ciudadano ─────────────────────────────────────────────────────
export interface Claim {
  id: string;
  created_at: string;
  tree_id: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  photo_url: string | null;
  description: string;
  reporter_id: string | null;
  ai_category: string | null;
  ai_urgency: ClaimUrgency | null;
  ai_area: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  status: ClaimStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

// ── Resultados de IA ──────────────────────────────────────────────────────
export interface AIVisionResult {
  health_score: number;        // 0-100
  dry_branches: boolean;
  visible_damage: boolean;
  estimated_risk: ClaimUrgency;
  recommendation: string;
  detected_issues: string[];
  confidence: number;
}

export interface AIClassifyResult {
  category: string;
  urgency: ClaimUrgency;
  area: string;
  summary: string;
  confidence: number;
}

export interface AIPriorityResult {
  score: number;               // 0-100
  factors: PriorityFactor[];
  recommendation: string;
}

export interface PriorityFactor {
  name: string;
  weight: number;
  value: number;
  label: string;
}

// ── Stats para dashboard ──────────────────────────────────────────────────
export interface TreeStats {
  total_trees: number;
  trees_at_risk: number;
  high_priority: number;
  native_trees: number;
  critical_trees: number;
  avg_priority_score: number;
  neighborhoods_covered: number;
}

export interface ClaimsStats {
  total_claims: number;
  pending_claims: number;
  urgent_claims: number;
  resolved_claims: number;
  claims_last_7_days: number;
}

// ── Especies autóctonas recomendadas ──────────────────────────────────────
export interface NativeSpeciesRecommendation {
  species: string;
  common_name: string;
  drought_resistance: 'alta' | 'muy_alta';
  shade_level: 'baja' | 'media' | 'alta';
  water_needs: 'bajo' | 'medio';
  notes: string;
}

// ── Labels y colores ──────────────────────────────────────────────────────
export const HEALTH_LABELS: Record<HealthStatus, string> = {
  excellent: 'Excelente',
  good:      'Bueno',
  fair:      'Regular',
  poor:      'Malo',
  critical:  'Crítico',
};

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  excellent: '#22c55e',
  good:      '#84cc16',
  fair:      '#f59e0b',
  poor:      '#ef4444',
  critical:  '#7f1d1d',
};

export const URGENCY_LABELS: Record<ClaimUrgency, string> = {
  low:      'Baja',
  medium:   'Media',
  high:     'Alta',
  critical: 'Crítica',
};

export const URGENCY_COLORS: Record<ClaimUrgency, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#7f1d1d',
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  pending:    'Pendiente',
  classified: 'Clasificado',
  assigned:   'Asignado',
  in_progress:'En curso',
  resolved:   'Resuelto',
  dismissed:  'Descartado',
};

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  poda:                      'Poda',
  riego:                     'Riego',
  tratamiento_fitosanitario: 'Tratamiento fitosanitario',
  apuntalamiento:            'Apuntalamiento',
  extraccion:                'Extracción',
  plantacion:                'Plantación',
  relevamiento:              'Relevamiento',
  otro:                      'Otro',
};

// Especies nativas/adaptadas recomendadas para reemplazo en Mendoza
export const NATIVE_SPECIES: NativeSpeciesRecommendation[] = [
  {
    species: 'Prosopis alba',
    common_name: 'Algarrobo blanco',
    drought_resistance: 'muy_alta',
    shade_level: 'alta',
    water_needs: 'bajo',
    notes: 'Especie emblemática del Monte mendocino. Fija nitrógeno, excelente sombra, frutos comestibles.',
  },
  {
    species: 'Geoffroea decorticans',
    common_name: 'Chañar',
    drought_resistance: 'muy_alta',
    shade_level: 'media',
    water_needs: 'bajo',
    notes: 'Nativa del Monte. Florece en invierno con flores amarillas. Frutos usados por comunidades originarias.',
  },
  {
    species: 'Bulnesia retama',
    common_name: 'Retamo',
    drought_resistance: 'muy_alta',
    shade_level: 'baja',
    water_needs: 'bajo',
    notes: 'Adaptada a suelos áridos y pedregosos. Madera durísima. Flores amarillas. Ideal para zonas secas.',
  },
  {
    species: 'Schinus molle',
    common_name: 'Pimiento / Aguaribay',
    drought_resistance: 'alta',
    shade_level: 'alta',
    water_needs: 'bajo',
    notes: 'Nativa de regiones áridas sudamericanas. Muy resistente, buena sombra, apta para veredas anchas.',
  },
  {
    species: 'Cercidium praecox',
    common_name: 'Brea',
    drought_resistance: 'muy_alta',
    shade_level: 'media',
    water_needs: 'bajo',
    notes: 'Fotosintesis en tallo verde. Ideal para zonas con suelo compactado. Flores amarillas primavera.',
  },
];
