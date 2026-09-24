'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { TreeDeciduous, AlertTriangle, CheckCircle, Clock, TrendingUp, MapPin, Leaf, BarChart3, Menu } from 'lucide-react';
import { fetchTreeStats, fetchClaimsStats, fetchTrees } from '@/lib/trees';
import type { TreeStats, ClaimsStats, Tree } from '@/types/trees';
import { HEALTH_COLORS } from '@/types/trees';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;

function StatCard({ label, value, sub, icon: Icon, color, delay, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay: number; href?: string;
}) {
  const card = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: EASE }}
      className="report-card p-4 flex items-start gap-3 hover:border-stone-700 transition-colors cursor-pointer">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-stone-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-stone-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [treeStats, setTreeStats] = useState<TreeStats | null>(null);
  const [claimsStats, setClaimsStats] = useState<ClaimsStats | null>(null);
  const [criticalTrees, setCriticalTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTreeStats(), fetchClaimsStats(), fetchTrees()])
      .then(([ts, cs, trees]) => {
        setTreeStats(ts);
        setClaimsStats(cs);
        setCriticalTrees(trees.filter(t => t.priority_score >= 70).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-950">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 sticky top-0 bg-stone-950 z-10"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-base font-semibold text-stone-100 leading-tight">Dashboard Municipal</h1>
          <p className="text-xs text-stone-500">Mendoza Respira AI</p>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto pb-10">
        {!loading && (treeStats?.critical_trees ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex items-start gap-3 bg-red-900/20 border border-red-800/50 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">{treeStats?.critical_trees} árbol{(treeStats?.critical_trees ?? 0) > 1 ? 'es' : ''} en estado crítico</p>
              <p className="text-xs text-red-500 mt-0.5">Requieren intervención inmediata.</p>
            </div>
            <Link href="/inventario" className="ml-auto text-xs font-semibold text-red-400 hover:text-red-300 shrink-0">Ver →</Link>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="report-card p-4 h-24 animate-pulse bg-stone-900" />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Árboles relevados" value={treeStats?.total_trees ?? 0} sub={`${treeStats?.neighborhoods_covered ?? 0} barrios`} icon={TreeDeciduous} color="bg-green-900/50 text-green-400" delay={0.05} href="/inventario" />
            <StatCard label="En riesgo" value={treeStats?.trees_at_risk ?? 0} sub="malo o crítico" icon={AlertTriangle} color="bg-red-900/50 text-red-400" delay={0.08} href="/inventario" />
            <StatCard label="Prioridad alta" value={treeStats?.high_priority ?? 0} sub="score ≥ 70" icon={TrendingUp} color="bg-amber-900/50 text-amber-400" delay={0.11} href="/inventario" />
            <StatCard label="Especies nativas" value={treeStats?.native_trees ?? 0} sub="patrimonio natural" icon={Leaf} color="bg-emerald-900/50 text-emerald-400" delay={0.14} />
            <StatCard label="Reclamos pendientes" value={claimsStats?.pending_claims ?? 0} sub={`${claimsStats?.urgent_claims ?? 0} urgentes`} icon={Clock} color="bg-orange-900/50 text-orange-400" delay={0.17} href="/reclamos" />
            <StatCard label="Resueltos" value={claimsStats?.resolved_claims ?? 0} sub={`de ${claimsStats?.total_claims ?? 0} totales`} icon={CheckCircle} color="bg-blue-900/50 text-blue-400" delay={0.20} href="/reclamos" />
          </div>
        )}

        {!loading && treeStats && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.22, ease: EASE }}
            className="report-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-300">Score de prioridad promedio</h2>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-stone-100">{treeStats.avg_priority_score}</span>
              <span className="text-stone-500 text-sm mb-1">/ 100</span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${treeStats.avg_priority_score}%` }}
                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                className="h-2 rounded-full"
                style={{ backgroundColor: treeStats.avg_priority_score >= 60 ? '#ef4444' : treeStats.avg_priority_score >= 40 ? '#f59e0b' : '#22c55e' }} />
            </div>
            <p className="text-xs text-stone-600">
              {treeStats.avg_priority_score >= 60 ? 'Riesgo elevado. Plan de intervención urgente recomendado.'
                : treeStats.avg_priority_score >= 40 ? 'Riesgo moderado. Mantener plan de mantenimiento preventivo.'
                : 'Arbolado en buen estado general. Continuar monitoreo regular.'}
            </p>
          </motion.section>
        )}

        {!loading && criticalTrees.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.26, ease: EASE }} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Intervención prioritaria
              </h2>
              <Link href="/inventario" className="text-xs text-green-500 hover:text-green-400">Ver todos →</Link>
            </div>
            {criticalTrees.map((tree, i) => (
              <motion.div key={tree.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: 0.28 + i * 0.04, ease: EASE }}>
                <Link href="/inventario" className="report-card p-4 flex items-start gap-3 hover:border-stone-700 transition-colors block">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ backgroundColor: HEALTH_COLORS[tree.health_status] + '25', color: HEALTH_COLORS[tree.health_status] }}>
                    {tree.priority_score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-200 truncate">{tree.common_name}</p>
                    <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />{tree.address ?? tree.neighborhood ?? 'Sin dirección'}
                    </p>
                    {tree.ai_recommendation && <p className="text-xs text-stone-600 mt-1 line-clamp-2">{tree.ai_recommendation}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.32, ease: EASE }} className="grid grid-cols-2 gap-3">
          {[
            { href: '/reclamos', emoji: '🤖', title: 'Reclamos IA', desc: 'Clasificación automática de reclamos ciudadanos' },
            { href: '/inspector', emoji: '🔍', title: 'Inspector', desc: 'Analizar imágenes con visión computacional' },
            { href: '/inventario', emoji: '🌳', title: 'Inventario', desc: 'Base de datos del arbolado municipal' },
            { href: '/mapa', emoji: '🗺️', title: 'Mapa vivo', desc: 'Reportes ciudadanos en tiempo real' },
          ].map(({ href, emoji, title, desc }) => (
            <Link key={href} href={href} className="report-card p-4 flex flex-col gap-2 hover:border-stone-700 transition-colors">
              <span className="text-2xl">{emoji}</span>
              <p className="text-sm font-semibold text-stone-200">{title}</p>
              <p className="text-xs text-stone-500">{desc}</p>
            </Link>
          ))}
        </motion.section>
      </div>
    </div>
  );
}
