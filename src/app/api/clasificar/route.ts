import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { PhotoAnalysisSchema } from '@/lib/photo-analysis-schema';

// POST /api/clasificar  { image: <base64>, media_type: 'image/jpeg' | ... }
// Analiza la foto de un reporte ciudadano y devuelve un PhotoAnalysis.

export const runtime     = 'nodejs';
export const maxDuration = 60;

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_BASE64_CHARS = 5_000_000;  // ~3.7 MB de imagen; el cliente la achica antes

// Límite simple por IP para que el endpoint público no se use como proxy gratis.
// En serverless vive por instancia: frena abusos obvios, no es un rate limit exacto.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const SYSTEM = `Sos un inspector de arbolado urbano de Mendoza, Argentina. Un vecino sacó una foto para reportar un problema y tu análisis ayuda al municipio a priorizar.

Contexto local: en Mendoza el arbolado público va en la vereda junto a la acequia, y la norma local exige al menos dos árboles por frente de propiedad. Las paradas de colectivo necesitan sombra por el calor del verano. Especies frecuentes: plátano, morera, fresno, olmo, acacia visco, paraíso, aguaribay, jacarandá.

Lo que más importa, en este orden:
1. Peligrosidad: riesgo de caída del árbol o de ramas (ramas secas o quebradas, tronco ahuecado o con pudrición, inclinación marcada, raíces levantadas, árbol sobre cables, edificios o calzada).
2. Faltantes: frentes sin árboles o con menos de dos, paradas de colectivo sin árbol, tocones o espacios vacíos en la línea de arbolado. Estimá cuántos árboles faltan para cumplir.
3. Tala: tocones recientes, árboles talados o indicios de tala o anillado en curso.
Para la categoría: si el problema es una rama puntual usá rama_peligrosa; si el árbol entero está muerto o casi sin follaje vivo, arbol_seco; si el riesgo es del árbol completo (inclinación, tronco, raíces), arbol_peligroso.
La especie es secundaria: informala solo si la reconocés, con tu confianza real, y dejala en null si no.

Basate solo en lo que se ve. Si la foto no permite juzgar algo, decilo en los motivos en lugar de suponer. Si la foto no muestra arbolado urbano, usá la categoría no_es_arbolado.

"resumen" es para el vecino: una o dos oraciones simples. "recomendacion" es para el municipio: la acción concreta (poda, extracción, plantación de N árboles, inspección). Escribí todo en español rioplatense.`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'El análisis con IA no está configurado' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiados análisis seguidos, probá en un rato' }, { status: 429 });
  }

  let body: { image?: unknown; media_type?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const { image, media_type } = body;
  if (typeof image !== 'string' || image.length === 0 || image.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: 'Imagen faltante o demasiado grande' }, { status: 400 });
  }
  if (!MEDIA_TYPES.includes(media_type as MediaType)) {
    return NextResponse.json({ error: 'Formato de imagen no soportado' }, { status: 400 });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: betaZodOutputFormat(PhotoAnalysisSchema),
      },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: media_type as MediaType, data: image } },
          { type: 'text', text: 'Analizá esta foto del reporte.' },
        ],
      }],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return NextResponse.json({ error: 'No se pudo analizar la foto' }, { status: 422 });
    }
    return NextResponse.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'El servicio de IA está saturado, probá en un rato' }, { status: 503 });
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error('clasificar: request inválido', error.message);
      return NextResponse.json({ error: 'No se pudo analizar la foto' }, { status: 422 });
    }
    console.error('clasificar: error', error);
    return NextResponse.json({ error: 'Error al analizar la foto' }, { status: 502 });
  }
}
