'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Menu, Search, Camera, Loader2, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';
import { analyzeTreeVision, recommendNativeSpecies, calculatePriority } from '@/lib/ai-engine';
import type { Tree, AIVisionResult } from '@/types/trees';
import { URGENCY_LABELS, URGENCY_COLORS, NATIVE_SPECIES } from '@/types/trees';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;

// Árboles ficticios para simulación de inspector
const DEMO_TREES: Partial<Tree>[] = [
  { id: '1', common_name: 'Palmera canaria', species: 'Phoenix canariensis', is_native: false,
    health_status: 'poor', risk_factors: ['estres_hidrico','poca_sombra','especie_exotica','alto_consumo_agua'],
    near_school: false, near_hospital: false, near_acequia: true, traffic_level: 'high',
    address: 'Av. San Martín 1240, Guaymallén' },
  { id: '2', common_name: 'Morera blanca', species: 'Morus alba', is_native: false,
    health_status: 'poor', risk_factors: ['ramas_secas','inclinacion_peligrosa','cerca_escuela','edad_avanzada'],
    near_school: true, near_hospital: false, near_acequia: false, traffic_level: 'medium',
    address: 'Belgrano 456, frente a escuela' },
  { id: '3', common_name: 'Pimiento', species: 'Schinus molle', is_native: true,
    health_status: 'critical', risk_factors: ['ramas_secas','cavidades_tronco','riesgo_caida','edad_avanzada'],
    near_school: false, near_hospital: false, near_acequia: false, traffic_level: 'high',
    address: 'España 678, Ciudad' },
  { id: '4', common_name: 'Algarrobo blanco', species: 'Prosopis alba', is_native: true,
    health_status: 'excellent', risk_factors: ['especie_nativa','alta_resistencia'],
    near_school: false, near_hospital: false, near_acequia: true, traffic_level: 'low',
    address: 'Boulogne Sur Mer 890, Las Heras' },
];

export default function InspectorPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTree, setSelectedTree] = useState<Partial<Tree> | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIVisionResult | null>(null);

  async function handleAnalyze() {
    if (!selectedTree) return;
    setAnalyzing(true);
    setResult(null);
    // Simular latencia de una API real
    await new Promise(r => setTimeout(r, 1800));
    setResult(analyzeTreeVision(selectedTree as Tree));
    setAnalyzing(false);
  }

  const priority = selectedTree ? calculatePriority(selectedTree as Tree) : null;
  const nativeRecs = selectedTree && !selectedTree.is_native
    ? recommendNativeSpecies(selectedTree as Tree) : [];

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 sticky top-0 bg-stone-950 z-10">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <Search className="w-5 h-5 text-blue-400" />
        <h1 className="text-base font-semibold text-stone-100">Inspector IA</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
        {/* Selector de árbol */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">1. Seleccionar árbol</h2>
          <div className="space-y-2">
            {DEMO_TREES.map((tree, i) => (
              <motion.button key={tree.id} onClick={() => { setSelectedTree(tree); setResult(null); }}
                className={`w-full text-left report-card p-3 flex items-center gap-3 transition-colors
                  ${selectedTree?.id === tree.id ? 'border-green-700 bg-green-900/10' : 'hover:border-stone-700'}`}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04, ease: EASE }}>
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-sm">
                  {tree.is_native ? '🌿' : '🌴'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-200">{tree.common_name}</p>
                  <p className="text-xs text-stone-500 truncate">{tree.address}</p>
                </div>
                {selectedTree?.id === tree.id && <CheckCircle className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Foto (opcional para demo) */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">2. Foto del árbol (opcional en demo)</h2>
          <label className="flex items-center gap-3 report-card p-3 cursor-pointer hover:border-stone-700 transition-colors">
            <Camera className="w-5 h-5 text-stone-400" />
            <span className="text-sm text-stone-400">Agregar foto para análisis real</span>
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }} />
          </label>
          {photo && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <Image src={photo} alt="Foto árbol" fill className="object-cover" />
            </div>
          )}
        </section>

        {/* Prioridad calculada */}
        <AnimatePresence>
          {selectedTree && priority && (
            <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: EASE }}
              className="space-y-2">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Score de prioridad</h2>
              <div className="report-card p-4 space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold" style={{
                    color: priority.score >= 70 ? '#ef4444' : priority.score >= 40 ? '#f59e0b' : '#22c55e'
                  }}>{priority.score}</span>
                  <span className="text-stone-500 mb-1">/ 100</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${priority.score}%` }}
                    transition={{ duration: 0.5, ease: EASE }} className="h-2 rounded-full"
                    style={{ backgroundColor: priority.score >= 70 ? '#ef4444' : priority.score >= 40 ? '#f59e0b' : '#22c55e' }} />
                </div>
                {priority.factors.map(f => (
                  <div key={f.name} className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">{f.label}</span>
                    <span className="text-stone-300 font-medium">+{f.value} pts</span>
                  </div>
                ))}
                <p className="text-xs text-stone-400 bg-stone-900 rounded-lg px-3 py-2">{priority.recommendation}</p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Botón análisis IA */}
        {selectedTree && (
          <motion.button onClick={handleAnalyze} disabled={analyzing} whileTap={{ scale: 0.97 }}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con IA…</> : '🤖 Ejecutar análisis de visión'}
          </motion.button>
        )}

        {/* Resultado IA */}
        <AnimatePresence>
          {result && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}
              className="space-y-3">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                🤖 Resultado de visión computacional
              </h2>
              <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-400">Score de salud</span>
                  <span className="text-xl font-bold" style={{
                    color: result.health_score >= 70 ? '#22c55e' : result.health_score >= 45 ? '#f59e0b' : '#ef4444'
                  }}>{result.health_score}/100</span>
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.health_score}%` }}
                    transition={{ duration: 0.5, ease: EASE }} className="h-2 rounded-full"
                    style={{ backgroundColor: result.health_score >= 70 ? '#22c55e' : result.health_score >= 45 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium`}
                    style={{ backgroundColor: URGENCY_COLORS[result.estimated_risk] + '20', color: URGENCY_COLORS[result.estimated_risk] }}>
                    Riesgo: {URGENCY_LABELS[result.estimated_risk]}
                  </span>
                  {result.dry_branches && <span className="text-xs px-2 py-1 rounded-full bg-amber-900/30 text-amber-400">Ramas secas</span>}
                  {result.visible_damage && <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-400">Daño visible</span>}
                </div>
                <div className="space-y-1">
                  {result.detected_issues.map((issue, i) => (
                    <p key={i} className="text-xs text-stone-400">• {issue}</p>
                  ))}
                </div>
                <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-400 mb-1">Recomendación</p>
                  <p className="text-sm text-stone-200">{result.recommendation}</p>
                </div>
                <p className="text-xs text-stone-600">Confianza del modelo: {(result.confidence * 100).toFixed(0)}%</p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Especies nativas recomendadas */}
        <AnimatePresence>
          {result && nativeRecs.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1, ease: EASE }} className="space-y-2">
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Especies autóctonas recomendadas
              </h2>
              {nativeRecs.map(sp => (
                <div key={sp.species} className="bg-emerald-900/15 border border-emerald-800/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">{sp.common_name}</p>
                      <p className="text-xs text-stone-500 italic">{sp.species}</p>
                    </div>
                    <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full">Nativa</span>
                  </div>
                  <p className="text-xs text-stone-400">{sp.notes}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">💧 Agua {sp.water_needs}</span>
                    <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">☀️ Sombra {sp.shade_level}</span>
                    <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">🌵 Sequía {sp.drought_resistance}</span>
                  </div>
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
