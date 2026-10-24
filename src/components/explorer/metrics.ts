// Métricas del mapa. Archivo aparte para no arrastrar Leaflet al render del servidor.
export type Metric = 'total' | 'high_risk' | 'last_30d';

export const METRIC_LABELS: Record<Metric, string> = {
  total:     'Reportes',
  high_risk: 'Riesgo alto',
  last_30d:  'Últimos 30 días',
};

// Escala secuencial amarillo → rojo (5 pasos): se lee bien sobre el mapa oscuro
export const CHORO_STEPS = ['#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'];

// Vista "Departamentos": un color por departamento. Ángulo áureo para que
// los vecinos (orden alfabético) no queden con tonos parecidos.
export function unitColor(index: number) {
  return `hsl(${Math.round((index * 137.5) % 360)} 65% 55%)`;
}
