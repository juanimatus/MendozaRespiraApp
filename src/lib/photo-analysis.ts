// ============================================================
// Análisis de la foto de un reporte con IA: tipos y helpers para el cliente
// ============================================================

import type { ReportType } from '@/types';
export type { PhotoAnalysis } from './photo-analysis-schema';
import type { PhotoAnalysis } from './photo-analysis-schema';

// Categoría de la IA → tipo de reporte. Las dos últimas no tienen tipo:
// el ciudadano elige a mano.
export function reportTypeFor(categoria: PhotoAnalysis['categoria']): ReportType | null {
  switch (categoria) {
    case 'arbol_peligroso':
    case 'falta_frentista':
    case 'parada_sin_arbol':
    case 'tocon':
    case 'arbol_talado':
    case 'sospecha':
      return categoria;
    default:
      return null;
  }
}
