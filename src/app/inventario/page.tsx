'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Filter, TreeDeciduous, MapPin, AlertTriangle, Leaf } from 'lucide-react';
import { fetchTrees } from '@/lib/trees';
import { analyzeTreeVision, recommendNativeSpecies } from '@/lib/ai-engine';
import type { Tree, HealthStatus } from '@/types/trees';
import { HEALTH_LABELS, HEALTH_COLORS, NATIVE_SPECIES } from '@/types/trees';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;
const FILTERS: { label: string; value: HealthStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Crítico', value: 'critical' },
  { label: 'Malo', value: 'poor' },
  { label: 'Regular', value: 'fair' },
  { label: 'Bueno', value: 'good' },
  { label: 'Excelente', value: 'excellent' },
];

export default function InventarioPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [filter, setFilter] = useState<HealthStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrees().then(t => { setTrees(t); setLoading(false); });
  }, []);

  const filtered = trees.filter(t => {
    const matchFilter = filter === 'all' || t.health_status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.common_name.toLowerCase().includes(q)
      || t.species.toLowerCase().includes(q)
      || (t.address ?? '').toLowerCase().includes(q)
      || (t.neighborhood ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 sticky top-0 bg-stone-950 z-10 shrink-0"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <h1 className="text-base font-semibold text-stone-100">Inventario de arbolado</h1>
        <span className="ml-auto text-xs text-stone-500">{filtered.length} árboles</span>
      </header>

      <div className="p-4 space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por especie, dirección, barrio…"
            className="form-input pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors
                ${filter === f.value ? 'bg-green-800 border-green-600 text-white' : 'bg-stone-900 border-stone-700 text-stone-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="report-card p-4 h-24 animate-pulse bg-stone-900" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-600">
            <TreeDeciduous className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No se encontraron árboles</p>
          </div>
        ) : (
          filtered.map((tree, i) => (
            <motion.button key={tree.id} onClick={() => setSelected(tree)} className="w-full text-left"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.03, ease: EASE }}>
              <div className="report-card p-4 flex items-start gap-3 hover:border-stone-700 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{ backgroundColor: HEALTH_COLORS[tree.health_status] + '20', color: HEALTH_COLORS[tree.health_status] }}>
                  {tree.priority_score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-200 truncate">{tree.common_name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                      style={{ backgroundColor: HEALTH_COLORS[tree.health_status] + '20', color: HEALTH_COLORS[tree.health_status] }}>
                      {HEALTH_LABELS[tree.health_status]}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 italic">{tree.species}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 shrink-0" />{tree.address ?? tree.neighborhood ?? '—'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {tree.is_native && <span className="text-xs text-emerald-500 flex items-center gap-0.5"><Leaf className="w-3 h-3" /> Nativa</span>}
                    {tree.near_school && <span className="text-xs text-amber-500 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Escuela</span>}
                    {tree.near_hospital && <span className="text-xs text-red-500 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Hospital</span>}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="fixed inset-0 z-[1001] flex items-end bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="w-full bg-stone-950 border-t border-stone-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-100">{selected.common_name}</h2>
                  <p className="text-xs text-stone-500 italic">{selected.species}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: HEALTH_COLORS[selected.health_status] }}>
                    {selected.priority_score}
                  </div>
                  <div className="text-xs text-stone-500">score</div>
                </div>
              </div>

              {/* Estado */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Estado', value: HEALTH_LABELS[selected.health_status] },
                  { label: 'Barrio', value: selected.neighborhood ?? '—' },
                  { label: 'Edad aprox.', value: selected.estimated_age ? `${selected.estimated_age} años` : '—' },
                  { label: 'Tráfico', value: selected.traffic_level ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-stone-900 rounded-xl p-3">
                    <p className="text-stone-500 mb-0.5">{label}</p>
                    <p className="text-stone-200 font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {/* Análisis IA */}
              {(() => {
                const analysis = analyzeTreeVision(selected);
                return (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                      🤖 Análisis IA
                    </h3>
                    <div className="bg-stone-900 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">Score de salud</span>
                        <span className="text-sm font-bold text-stone-200">{analysis.health_score}/100</span>
                      </div>
                      <div className="w-full bg-stone-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{
                          width: `${analysis.health_score}%`,
                          backgroundColor: analysis.health_score >= 70 ? '#22c55e' : analysis.health_score >= 45 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                      {analysis.detected_issues.map((issue, i) => (
                        <p key={i} className="text-xs text-stone-400">• {issue}</p>
                      ))}
                      <p className="text-xs text-green-400 font-medium mt-2">{analysis.recommendation}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Especies recomendadas (si es exótica problemática) */}
              {!selected.is_native && (selected.risk_factors ?? []).includes('alto_consumo_agua') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">🌱 Reemplazar por nativas</h3>
                  {recommendNativeSpecies(selected).slice(0, 2).map(sp => (
                    <div key={sp.species} className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-3">
                      <p className="text-sm font-semibold text-emerald-300">{sp.common_name}</p>
                      <p className="text-xs text-stone-500 italic">{sp.species}</p>
                      <p className="text-xs text-stone-400 mt-1">{sp.notes}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">💧 Agua: {sp.water_needs}</span>
                        <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">☀️ Sombra: {sp.shade_level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setSelected(null)} className="btn-secondary w-full">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
