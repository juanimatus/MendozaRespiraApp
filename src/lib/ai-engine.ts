// ============================================================
// Motor de IA simulado — Mendoza Respira AI
// Lógica determinística basada en reglas reales de arboricultura.
// Cuando conectes OpenAI/Gemini, reemplazás estas funciones
// manteniendo las mismas firmas de entrada/salida.
// ============================================================

import type {
  Tree, AIVisionResult, AIClassifyResult,
  AIPriorityResult, PriorityFactor, ClaimUrgency,
} from '@/types/trees';
import { NATIVE_SPECIES } from '@/types/trees';

// ── A) Visión computacional (análisis de imagen simulado) ─────────────────
// En producción: enviar imagen a GPT-4o Vision o modelo custom.
// Por ahora: análisis basado en metadata del árbol.

export function analyzeTreeVision(tree: Tree): AIVisionResult {
  const issues: string[] = [];
  let healthScore = 100;

  // Degradar score según estado sanitario
  const healthPenalty: Record<string, number> = {
    excellent: 0, good: 10, fair: 30, poor: 55, critical: 80,
  };
  healthScore -= healthPenalty[tree.health_status] ?? 0;

  // Factores de riesgo detectados
  const riskFactors = tree.risk_factors ?? [];

  if (riskFactors.includes('ramas_secas')) {
    issues.push('Ramas secas detectadas');
    healthScore -= 10;
  }
  if (riskFactors.includes('estres_hidrico')) {
    issues.push('Síntomas de estrés hídrico: follaje amarillento o reducido');
    healthScore -= 8;
  }
  if (riskFactors.includes('plaga_insectos')) {
    issues.push('Presencia de insectos o infestación visible');
    healthScore -= 8;
  }
  if (riskFactors.includes('cavidades_tronco')) {
    issues.push('Cavidades o pudrición en tronco');
    healthScore -= 15;
  }
  if (riskFactors.includes('inclinacion_peligrosa')) {
    issues.push('Inclinación estructural preocupante');
    healthScore -= 15;
  }
  if (riskFactors.includes('suelo_compactado')) {
    issues.push('Suelo compactado alrededor del tronco');
    healthScore -= 5;
  }
  if (riskFactors.includes('especie_exotica') && riskFactors.includes('alto_consumo_agua')) {
    issues.push('Especie exótica de alto consumo hídrico en zona árida');
    healthScore -= 5;
  }

  // Factores positivos
  if (riskFactors.includes('especie_nativa')) {
    issues.push('✓ Especie nativa bien adaptada al clima local');
    healthScore = Math.min(healthScore + 5, 100);
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Calcular riesgo estimado
  let estimatedRisk: ClaimUrgency = 'low';
  if (healthScore < 25) estimatedRisk = 'critical';
  else if (healthScore < 45) estimatedRisk = 'high';
  else if (healthScore < 65) estimatedRisk = 'medium';

  // Generar recomendación principal
  const recommendation = tree.ai_recommendation
    ?? generateRecommendation(tree, healthScore, issues);

  return {
    health_score:    healthScore,
    dry_branches:    riskFactors.includes('ramas_secas'),
    visible_damage:  riskFactors.includes('cavidades_tronco') || riskFactors.includes('inclinacion_peligrosa'),
    estimated_risk:  estimatedRisk,
    recommendation,
    detected_issues: issues,
    confidence:      0.82,  // simulado
  };
}

function generateRecommendation(tree: Tree, score: number, issues: string[]): string {
  if (score < 25) {
    return `Estado crítico. Evaluar extracción inmediata de ${tree.common_name}. Coordinar con área de emergencias.`;
  }
  if (score < 45) {
    const nativeAlt = NATIVE_SPECIES.find(s => s.drought_resistance === 'muy_alta');
    return `Estado deteriorado. ${tree.is_native ? 'Tratamiento fitosanitario urgente.' : `Considerar reemplazo por ${nativeAlt?.common_name ?? 'especie nativa'} (mayor resistencia a la sequía).`}`;
  }
  if (score < 65) {
    return `Estado regular. Intervención de mantenimiento recomendada. Aumentar frecuencia de riego y monitoreo mensual.`;
  }
  return `Estado ${tree.health_status === 'excellent' ? 'excelente' : 'bueno'}. Mantener plan de riego y poda preventiva anual.`;
}

// ── B) Clasificación de reclamos ciudadanos ───────────────────────────────
// En producción: enviar texto + foto a LLM con prompt estructurado.
// Por ahora: análisis por keywords con lógica contextual.

const KEYWORDS: Record<string, { category: string; urgency: ClaimUrgency; area: string }> = {
  // Emergencias
  'cayó':          { category: 'rama_caida',        urgency: 'critical', area: 'emergencia' },
  'caída':         { category: 'rama_caida',        urgency: 'critical', area: 'emergencia' },
  'tronco hueco':  { category: 'estructura_dañada', urgency: 'critical', area: 'emergencia' },
  'inclinado':     { category: 'inclinacion',       urgency: 'high',     area: 'emergencia' },
  'inclinada':     { category: 'inclinacion',       urgency: 'high',     area: 'emergencia' },
  'escuela':       { category: 'riesgo_escolar',    urgency: 'critical', area: 'emergencia' },
  'hospital':      { category: 'riesgo_hospital',   urgency: 'critical', area: 'emergencia' },
  // Salud del árbol
  'amarill':       { category: 'estres_hidrico',    urgency: 'medium',   area: 'riego' },
  'seco':          { category: 'estres_hidrico',    urgency: 'medium',   area: 'riego' },
  'seca':          { category: 'estres_hidrico',    urgency: 'medium',   area: 'riego' },
  'bichos':        { category: 'plaga',             urgency: 'high',     area: 'fitosanitario' },
  'insectos':      { category: 'plaga',             urgency: 'high',     area: 'fitosanitario' },
  'blancos':       { category: 'plaga',             urgency: 'high',     area: 'fitosanitario' },
  'hongos':        { category: 'enfermedad',        urgency: 'high',     area: 'fitosanitario' },
  'podrid':        { category: 'pudricion',         urgency: 'high',     area: 'fitosanitario' },
  // Infraestructura
  'raíz':          { category: 'raiz_levantada',    urgency: 'medium',   area: 'obras' },
  'vereda':        { category: 'raiz_levantada',    urgency: 'medium',   area: 'obras' },
  'levantó':       { category: 'raiz_levantada',    urgency: 'medium',   area: 'obras' },
  // Tala
  'cortaron':      { category: 'tala_ilegal',       urgency: 'high',     area: 'fiscalizacion' },
  'talaron':       { category: 'tala_ilegal',       urgency: 'high',     area: 'fiscalizacion' },
  'tocón':         { category: 'tala_ilegal',       urgency: 'medium',   area: 'fiscalizacion' },
};

const CATEGORY_SUMMARIES: Record<string, string> = {
  rama_caida:        'Rama o árbol caído en vía pública. Riesgo para transeúntes.',
  estructura_dañada: 'Árbol con estructura comprometida. Requiere evaluación urgente.',
  inclinacion:       'Árbol con inclinación anormal. Posible riesgo de caída.',
  riesgo_escolar:    'Riesgo arboricultural en zona escolar. Intervención prioritaria.',
  riesgo_hospital:   'Riesgo arboricultural frente a establecimiento sanitario.',
  estres_hidrico:    'Síntomas de déficit hídrico. Revisión de riego necesaria.',
  plaga:             'Posible infestación de insectos. Tratamiento fitosanitario recomendado.',
  enfermedad:        'Posible enfermedad fúngica o bacteriana. Diagnóstico in situ requerido.',
  pudricion:         'Pudrición interna detectada. Evaluación estructural urgente.',
  raiz_levantada:    'Raíces levantando vereda. Coordinar con área de obras públicas.',
  tala_ilegal:       'Posible tala no autorizada. Derivar a fiscalización ambiental.',
};

export function classifyClaim(description: string): AIClassifyResult {
  const text = description.toLowerCase();
  let bestMatch = { category: 'otro', urgency: 'low' as ClaimUrgency, area: 'general' };
  let urgencyScore = 0;

  // Urgencia sube si menciona niños, personas, tráfico
  const contextBoost = ['niños', 'chicos', 'persona', 'auto', 'accidente', 'lastim', 'peligro']
    .some(w => text.includes(w));

  for (const [keyword, match] of Object.entries(KEYWORDS)) {
    if (text.includes(keyword)) {
      const score = { low: 1, medium: 2, high: 3, critical: 4 }[match.urgency] ?? 0;
      if (score > urgencyScore) {
        urgencyScore = score;
        bestMatch = match;
      }
    }
  }

  // Aplicar boost de contexto
  if (contextBoost && bestMatch.urgency !== 'critical') {
    const bump: Record<ClaimUrgency, ClaimUrgency> = {
      low: 'medium', medium: 'high', high: 'critical', critical: 'critical',
    };
    bestMatch.urgency = bump[bestMatch.urgency];
  }

  const summary = CATEGORY_SUMMARIES[bestMatch.category]
    ?? 'Reclamo recibido. Requiere evaluación por inspector.';

  return {
    category:   bestMatch.category,
    urgency:    bestMatch.urgency,
    area:       bestMatch.area,
    summary,
    confidence: urgencyScore > 0 ? 0.85 + Math.random() * 0.1 : 0.55,
  };
}

// ── C) Motor de priorización (scoring 0-100) ──────────────────────────────
// Fórmula basada en criterios reales de gestión de arbolado urbano.

export function calculatePriority(tree: Partial<Tree>): AIPriorityResult {
  const factors: PriorityFactor[] = [];

  // 1. Estado sanitario (40 pts)
  const healthScores: Record<string, number> = {
    critical: 40, poor: 28, fair: 16, good: 6, excellent: 0,
  };
  const healthVal = healthScores[tree.health_status ?? 'good'] ?? 0;
  factors.push({
    name: 'estado_sanitario', weight: 40, value: healthVal,
    label: `Estado sanitario: ${tree.health_status ?? 'desconocido'}`,
  });

  // 2. Ubicación sensible (25 pts)
  let locationVal = 0;
  if (tree.near_school)   { locationVal += 15; }
  if (tree.near_hospital) { locationVal += 15; }
  locationVal = Math.min(locationVal, 25);
  if (locationVal > 0) {
    factors.push({
      name: 'ubicacion_sensible', weight: 25, value: locationVal,
      label: `Cerca de ${tree.near_school ? 'escuela' : ''}${tree.near_school && tree.near_hospital ? ' y ' : ''}${tree.near_hospital ? 'hospital' : ''}`,
    });
  }

  // 3. Tráfico (15 pts)
  const trafficScores: Record<string, number> = { high: 15, medium: 8, low: 2 };
  const trafficVal = trafficScores[tree.traffic_level ?? 'low'] ?? 0;
  if (trafficVal > 0) {
    factors.push({
      name: 'trafico', weight: 15, value: trafficVal,
      label: `Tráfico ${tree.traffic_level ?? 'bajo'} en la zona`,
    });
  }

  // 4. Factores de riesgo específicos (10 pts)
  const riskFactors = tree.risk_factors ?? [];
  const criticalRisks = ['inclinacion_peligrosa', 'cavidades_tronco', 'ramas_secas'];
  const riskCount = riskFactors.filter(r => criticalRisks.includes(r)).length;
  const riskVal = Math.min(riskCount * 4, 10);
  if (riskVal > 0) {
    factors.push({
      name: 'factores_riesgo', weight: 10, value: riskVal,
      label: `${riskCount} factor${riskCount > 1 ? 'es' : ''} de riesgo estructural`,
    });
  }

  // 5. Factor acequia mendocino (5 pts) — raíces + humedad = riesgo de levantamiento
  if (tree.near_acequia && riskFactors.includes('ramas_secas')) {
    factors.push({
      name: 'acequia', weight: 5, value: 5,
      label: 'Árbol junto a acequia con síntomas de estrés',
    });
  }

  // 6. Especie exótica de alto consumo (5 pts)
  if (!tree.is_native && riskFactors.includes('alto_consumo_agua')) {
    factors.push({
      name: 'especie_exotica', weight: 5, value: 5,
      label: 'Especie exótica de alto consumo hídrico',
    });
  }

  const score = Math.min(
    factors.reduce((sum, f) => sum + f.value, 0),
    100,
  );

  // Recomendación basada en score
  let recommendation = '';
  if (score >= 80)      recommendation = 'Intervención de emergencia. Coordinar en menos de 24 horas.';
  else if (score >= 60) recommendation = 'Prioridad alta. Programar inspección esta semana.';
  else if (score >= 40) recommendation = 'Prioridad media. Incluir en plan mensual.';
  else if (score >= 20) recommendation = 'Prioridad baja. Mantenimiento preventivo en próximo ciclo.';
  else                  recommendation = 'Sin intervención urgente. Monitoreo anual suficiente.';

  return { score, factors, recommendation };
}

// ── D) Recomendaciones de especies autóctonas ─────────────────────────────
// Dado un árbol exótico o problemático, sugerí especies de reemplazo.

export function recommendNativeSpecies(tree: Partial<Tree>): typeof NATIVE_SPECIES {
  const riskFactors = tree.risk_factors ?? [];

  // Palmeras y especies de alto consumo → priorizar las de muy alta resistencia
  if (riskFactors.includes('alto_consumo_agua') || !tree.is_native) {
    return NATIVE_SPECIES.filter(s => s.drought_resistance === 'muy_alta');
  }

  // Zonas con suelo compactado → brea y chañar resisten bien
  if (riskFactors.includes('suelo_compactado')) {
    return NATIVE_SPECIES.filter(s =>
      ['Cercidium praecox', 'Geoffroea decorticans'].includes(s.species)
    );
  }

  // Default: todas las nativas
  return NATIVE_SPECIES;
}
