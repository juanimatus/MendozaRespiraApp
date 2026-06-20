// ============================================================
// Tipos centrales de Mendoza Respira
// ============================================================

export type ReportType = 'tocon' | 'arbol_talado' | 'sospecha';
export type ReportStatus = 'pending' | 'verified';

export interface Report {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  address: string | null;
  type: ReportType;
  comment: string | null;
  photo_url: string;
  status: ReportStatus;
  reporter_id: string | null;
}

export interface ReportWithVerifications extends Report {
  verification_count: number;
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
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  tocon:        '#ef4444',   // rojo
  arbol_talado: '#f59e0b',   // naranja
  sospecha:     '#6366f1',   // violeta
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending:  'Pendiente',
  verified: 'Verificado',
};
