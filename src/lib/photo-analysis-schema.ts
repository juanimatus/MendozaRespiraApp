// ============================================================
// Esquema del análisis de la foto de un reporte con IA (solo servidor:
// el formulario importa el tipo desde ./photo-analysis para no cargar zod).
// ============================================================

import { z } from 'zod';

export const PhotoAnalysisSchema = z.object({
  categoria: z.enum([
    'arbol_peligroso',     // riesgo de caída del árbol: inclinación, tronco dañado, raíces levantadas, cables
    'rama_peligrosa',      // una o más ramas secas, quebradas o colgando con riesgo de caer
    'arbol_seco',          // árbol muerto o casi sin follaje vivo
    'falta_frentista',     // frente de propiedad sin árboles o con menos de los exigidos
    'parada_sin_arbol',    // parada de colectivo sin sombra de árboles
    'tocon',
    'arbol_talado',
    'sospecha',            // indicios de tala o anillado en curso
    'arbol_sano',          // árbol sin problemas visibles
    'no_es_arbolado',      // la foto no muestra arbolado urbano
  ]),
  peligrosidad: z.enum(['ninguna', 'baja', 'media', 'alta', 'critica']),
  motivos: z.array(z.string()),
  arboles_visibles: z.number().int(),
  arboles_faltantes: z.number().int(),
  parada_colectivo: z.boolean(),
  especie_probable: z.string().nullable(),
  especie_confianza: z.enum(['baja', 'media', 'alta']).nullable(),
  resumen: z.string(),
  recomendacion: z.string(),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;
