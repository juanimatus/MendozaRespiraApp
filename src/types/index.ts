// ============================================================
// Tipos centrales de Mendoza Respira
// ============================================================

export type ReportType =
  | 'tocon' | 'arbol_talado' | 'sospecha'
  | 'arbol_peligroso' | 'falta_frentista' | 'parada_sin_arbol'
  | 'rama_peligrosa' | 'arbol_seco';
export type RiskLevel = 'ninguna' | 'baja' | 'media' | 'alta' | 'critica';
export type ReportStatus = 'pending' | 'verified';

export interface Report {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  address: string | null;
  municipio: string | null;
  type: ReportType;
  comment: string | null;
  photo_url: string;
  status: ReportStatus;
  reporter_id: string | null;
  ai_risk: RiskLevel | null;
  ai_summary: string | null;
  ai_analysis: Record<string, unknown> | null;
  // Revisión técnica (ingeniero agrónomo): su riesgo prevalece sobre el de la IA
  review_risk?: RiskLevel | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  hidden?: boolean;
  hidden_reason?: string | null;
}

export interface ReportWithVerifications extends Report {
  verification_count: number;
  risk?: RiskLevel | null;      // calculado en la vista: técnico si existe, si no IA
}

// Riesgo vigente de un reporte (también para filas que llegan en vivo sin la columna calculada)
export function riskOf(r: Pick<Report, 'ai_risk' | 'review_risk'>): RiskLevel | null {
  return r.review_risk ?? r.ai_risk ?? null;
}

export interface Verification {
  id: string;
  created_at: string;
  report_id: string;
  verifier_id: string;
}

// Labels para la UI
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  tocon:        'Tocón',
  arbol_talado: 'Árbol talado',
  sospecha:     'Sospecha de tala',
  arbol_peligroso:  'Árbol peligroso',
  falta_frentista:  'Faltan árboles en el frente',
  parada_sin_arbol: 'Parada sin árbol',
  rama_peligrosa:   'Rama peligrosa',
  arbol_seco:       'Árbol seco',
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  tocon:        '#ef4444',   // rojo
  arbol_talado: '#f59e0b',   // naranja
  sospecha:     '#6366f1',   // violeta
  arbol_peligroso:  '#dc2626', // rojo intenso
  falta_frentista:  '#0ea5e9', // celeste
  parada_sin_arbol: '#14b8a6', // turquesa
  rama_peligrosa:   '#e11d48', // rosa intenso
  arbol_seco:       '#a16207', // marrón
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  ninguna: 'Sin riesgo',
  baja:    'Riesgo bajo',
  media:   'Riesgo medio',
  alta:    'Riesgo alto',
  critica: 'Riesgo crítico',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  ninguna: '#57534e',
  baja:    '#65a30d',
  media:   '#d97706',
  alta:    '#ea580c',
  critica: '#dc2626',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending:  'Pendiente',
  verified: 'Verificado',
};
