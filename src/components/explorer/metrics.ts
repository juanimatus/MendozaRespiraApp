// Métricas del mapa. Archivo aparte para no arrastrar Leaflet al render del servidor.
export type Metric = 'total' | 'high_risk' | 'last_30d';

export const METRIC_LABELS: Record<Metric, string> = {
  total:     'Reportes',
  high_risk: 'Riesgo alto',
  last_30d:  'Últimos 30 días',
};
