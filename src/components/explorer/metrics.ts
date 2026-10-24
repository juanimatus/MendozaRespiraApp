// Métricas del mapa. Archivo aparte para no arrastrar Leaflet al render del servidor.
export type Metric = 'total' | 'high_risk' | 'last_30d';

export const METRIC_LABELS: Record<Metric, string> = {
  total:     'Reportes',
  high_risk: 'Riesgo alto',
  last_30d:  'Últimos 30 días',
};

// Escala secuencial amarillo → rojo (5 pasos): se lee bien sobre el mapa oscuro
export const CHORO_STEPS = ['#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'];

// Colores por zona (vista "Zonas"): distintos de la escala de reportes
export const ZONE_COLORS: Record<string, string> = {
  'Zona Este':    '#22c55e',
  'Gran Mendoza': '#38bdf8',
  'Valle de Uco': '#a78bfa',
  'Zona Sur':     '#f472b6',
};
