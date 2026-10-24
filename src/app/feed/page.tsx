'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, animate } from 'motion/react';
import { TreeDeciduous, Menu, MapPin, CheckCircle, Clock, X, Plus, AlertTriangle, BadgeCheck } from 'lucide-react';

import SideMenu from '@/components/layout/SideMenu';
import ReportDetailModal from '@/components/reports/ReportDetailModal';
import { METRIC_LABELS, CHORO_STEPS, ZONE_COLORS, type Metric } from '@/components/explorer/metrics';
import { REGION } from '@/config/region';
import {
  fetchFeedPage, fetchMapPoints, fetchMunicipioStats, matchesFilters, subscribeToNewReports,
  FEED_PAGE_SIZE, type FeedFilters, type MunicipioStats,
} from '@/lib/explorer';
import type { ReportWithVerifications, ReportType } from '@/types';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, RISK_LABELS, RISK_COLORS, riskOf } from '@/types';

// Leaflet no funciona en SSR
const ExplorerMap = dynamic(() => import('@/components/explorer/ExplorerMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-stone-900 animate-pulse" />,
});

const EASE = [0.4, 0, 0.2, 1] as const;
const TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];

function formatDate(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'ahora';
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

// Número que cuenta hasta su valor cuando cambia
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.8, ease: EASE,
      onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('es-AR'); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span ref={ref}>0</span>;
}

function Chip({ active, onClick, children, color }: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string;
}) {
  return (
    <button onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
        ${active ? 'bg-stone-100 border-stone-100 text-stone-900' : 'bg-stone-900 border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500'}`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}

function FeedCard({ r, isNew, onHover, onOpen }: {
  r: ReportWithVerifications; isNew: boolean;
  onHover: (id: string | null) => void; onOpen: () => void;
}) {
  const risk = riskOf(r);
  return (
    <motion.button layout
      initial={{ opacity: 0, y: isNew ? -12 : 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      onMouseEnter={() => onHover(r.id)} onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(r.id)} onBlur={() => onHover(null)}
      onClick={onOpen}
      className={`w-full text-left flex gap-3 p-3 rounded-2xl border transition-colors
        ${isNew ? 'border-green-700 bg-green-950/30' : 'border-stone-800 bg-stone-900/60 hover:border-stone-600 hover:bg-stone-900'}`}>
      {r.photo_url && (
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-800">
          <Image src={r.photo_url} alt="" fill className="object-cover" sizes="80px" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: REPORT_TYPE_COLORS[r.type] }}>
            {REPORT_TYPE_LABELS[r.type]}
          </span>
          {risk && risk !== 'ninguna' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: RISK_COLORS[risk] }}>
              {RISK_LABELS[risk]}
            </span>
          )}
          {r.reviewed_at && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-sky-300">
              <BadgeCheck className="w-3 h-3" /> Revisado
            </span>
          )}
          {isNew && <span className="text-[11px] font-semibold text-green-400">Nuevo</span>}
        </div>
        <p className="text-sm text-stone-300 line-clamp-2">
          {r.review_note ?? r.ai_summary ?? r.comment ?? 'Sin descripción'}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-stone-500">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{[r.address, r.municipio].filter(Boolean).join(' · ') || 'Sin ubicación'}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {r.status === 'verified'
              ? <CheckCircle className="w-3 h-3 text-green-600" />
              : <Clock className="w-3 h-3" />}
            {r.verification_count}
          </span>
          <span className="shrink-0 ml-auto">{formatDate(r.created_at)}</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function ExplorarPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Filtros
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [zone, setZone]                 = useState<string | null>(null);
  const [types, setTypes]               = useState<ReportType[]>([]);
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [metric, setMetric]             = useState<Metric>('total');
  const [byZone, setByZone]             = useState(false);

  // Datos
  const [stats, setStats]       = useState<Map<string, MunicipioStats>>(new Map());
  const [points, setPoints]     = useState<ReportWithVerifications[]>([]);
  const [feed, setFeed]         = useState<ReportWithVerifications[]>([]);
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [live, setLive]         = useState(false);

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReportWithVerifications | null>(null);

  const filters: FeedFilters = useMemo(() => ({
    municipios: selectedUnit ? [selectedUnit] : zone ? REGION.zones[zone] : null,
    types:      types.length ? types : null,
    risks:      onlyHighRisk ? ['alta', 'critica'] : null,
  }), [selectedUnit, zone, types, onlyHighRisk]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadStats = useCallback(() => {
    fetchMunicipioStats()
      .then(rows => setStats(new Map(rows.map(r => [r.municipio, r]))))
      .catch(err => console.error('Error cargando estadísticas', err));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Feed y puntos se recargan al cambiar filtros
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchFeedPage(filters), fetchMapPoints(filters)])
      .then(([page, pts]) => {
        if (cancelled) return;
        setFeed(page);
        setHasMore(page.length === FEED_PAGE_SIZE);
        setPoints(pts);
      })
      .catch(err => console.error('Error cargando el feed', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  // Reportes nuevos en vivo
  useEffect(() => {
    const unsubscribe = subscribeToNewReports(r => {
      setLive(true);
      loadStats();
      if (!matchesFilters(r, { ...filtersRef.current, municipios: null })) return;
      setPoints(prev => [r, ...prev]);
      if (!matchesFilters(r, filtersRef.current)) return;
      setFeed(prev => [r, ...prev]);
      setNewIds(prev => new Set(prev).add(r.id));
    });
    setLive(true);
    return unsubscribe;
  }, [loadStats]);

  async function loadMore() {
    const last = feed[feed.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage(filters, last.created_at);
      setFeed(prev => [...prev, ...page]);
      setHasMore(page.length === FEED_PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  function selectUnit(unit: string | null) {
    setSelectedUnit(unit);
    if (unit) setZone(null);
  }

  // Totales del alcance actual (departamento elegido, zona o toda la región)
  const scope = filters.municipios ?? REGION.units;
  const totals = useMemo(() => {
    let total = 0, highRisk = 0, last30 = 0, reached = 0;
    scope.forEach(u => {
      const s = stats.get(u);
      if (!s) return;
      total += s.total; highRisk += s.high_risk; last30 += s.last_30d;
      if (s.total > 0) reached++;
    });
    return { total, highRisk, last30, reached };
  }, [scope, stats]);

  const ranking = useMemo(
    () => Array.from(stats.values())
      .filter(s => s[metric] > 0 && (!zone || REGION.zones[zone].includes(s.municipio)))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 5),
    [stats, metric, zone],
  );
  const rankingMax = Math.max(1, ...ranking.map(s => s[metric]));

  const scopeName = selectedUnit ?? zone ?? REGION.name;

  return (
    <div className="h-[100dvh] flex flex-col bg-stone-950">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="flex items-center gap-3 px-4 py-3 border-b border-stone-800 shrink-0"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú"
          className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-stone-100 leading-tight">Explorar {REGION.name}</h1>
          <p className="text-xs text-stone-500">Reportes ciudadanos del arbolado</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-stone-400">
          <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-stone-600'}`} />
          En vivo
        </span>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[1fr_440px]">
        {/* ── Mapa ─────────────────────────────────────────────── */}
        <section className="relative h-[42dvh] lg:h-auto shrink-0 border-b lg:border-b-0 lg:border-r border-stone-800">
          <ExplorerMap
            stats={stats} metric={metric} byZone={byZone} points={points}
            selectedUnit={selectedUnit} highlightedId={highlightedId}
            onSelectUnit={selectUnit} onSelectReport={setSelected}
          />

          {/* Métrica del coloreado */}
          <div className="absolute top-3 left-3 z-[999] flex rounded-xl border border-stone-700 bg-stone-950/90 p-0.5 text-xs">
            {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
              <button key={m} onClick={() => { setMetric(m); setByZone(false); }}
                className={`px-2.5 py-1 rounded-lg transition-colors ${!byZone && metric === m ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
                {METRIC_LABELS[m]}
              </button>
            ))}
            <button onClick={() => setByZone(true)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${byZone ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
              Zonas
            </button>
          </div>

          {/* Leyenda */}
          {byZone ? (
          <div className="absolute bottom-6 left-3 z-[999] flex flex-wrap items-center gap-x-2.5 gap-y-1 max-w-[60%] rounded-xl border border-stone-700 bg-stone-950/90 px-2.5 py-1.5 text-[10px] text-stone-300">
            {Object.entries(ZONE_COLORS).map(([z, c]) => (
              <span key={z} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} /> {z}
              </span>
            ))}
          </div>
          ) : (
          <div className="absolute bottom-6 left-3 z-[999] flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-950/90 px-2.5 py-1.5 text-[10px] text-stone-400">
            <span>Menos</span>
            <span className="flex">
              {CHORO_STEPS.map(c => <span key={c} className="h-2.5 w-3.5 first:rounded-l last:rounded-r" style={{ backgroundColor: c }} />)}
            </span>
            <span>Más</span>
            <span className="hidden sm:flex items-center gap-1.5 border-l border-stone-700 pl-2">
              <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-stone-500" /> Sin reportes
            </span>
          </div>
          )}

          <Link href="/reportar"
            className="absolute right-3 z-[999] flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg shadow-black/40 transition-colors"
            style={{ bottom: '1.5rem' }}>
            <Plus className="w-4 h-4" /> Reportar
          </Link>
        </section>

        {/* ── Panel ────────────────────────────────────────────── */}
        <aside className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-5 pb-10">
            {/* Alcance + totales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-stone-100">{scopeName}</h2>
                {(selectedUnit || zone) && (
                  <button onClick={() => { setSelectedUnit(null); setZone(null); }}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200">
                    <X className="w-3.5 h-3.5" /> Ver toda {REGION.name}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Reportes', value: totals.total },
                  { label: 'Riesgo alto', value: totals.highRisk },
                  { label: 'Últimos 30 días', value: totals.last30 },
                ].map(t => (
                  <div key={t.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3">
                    <p className="text-2xl font-bold text-stone-100 tabular-nums"><Counter value={t.value} /></p>
                    <p className="text-[11px] text-stone-500">{t.label}</p>
                  </div>
                ))}
              </div>
              {!selectedUnit && (
                <p className="text-xs text-stone-500">
                  {totals.reached} de {scope.length} {REGION.unitLabelPlural} con reportes.
                  {' '}Tocá un {REGION.unitLabel} en el mapa para ver su detalle.
                </p>
              )}
            </div>

            {/* Filtros */}
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1 pr-10 no-scrollbar fade-right">
                {Object.keys(REGION.zones).map(z => (
                  <Chip key={z} active={zone === z && !selectedUnit}
                    onClick={() => { setSelectedUnit(null); setZone(zone === z ? null : z); }}>
                    {z}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 pr-10 no-scrollbar fade-right">
                <Chip active={onlyHighRisk} onClick={() => setOnlyHighRisk(v => !v)}>
                  <AlertTriangle className="w-3 h-3" /> Riesgo alto
                </Chip>
                {TYPES.map(t => (
                  <Chip key={t} active={types.includes(t)} color={REPORT_TYPE_COLORS[t]}
                    onClick={() => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                    {REPORT_TYPE_LABELS[t]}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Ranking */}
            {!selectedUnit && ranking.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-stone-500">
                  {METRIC_LABELS[metric]} por {REGION.unitLabel}
                </h3>
                <ol className="space-y-1">
                  {ranking.map((s, i) => (
                    <li key={s.municipio}>
                      <button onClick={() => selectUnit(s.municipio)}
                        className="w-full flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-stone-900 transition-colors text-left">
                        <span className="w-4 text-xs text-stone-500 tabular-nums">{i + 1}</span>
                        <span className="w-28 truncate text-sm text-stone-200">{s.municipio}</span>
                        <span className="flex-1 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                          <motion.span className="block h-full rounded-full bg-orange-500"
                            initial={{ width: 0 }} animate={{ width: `${(s[metric] / rankingMax) * 100}%` }}
                            transition={{ duration: 0.5, ease: EASE }} />
                        </span>
                        <span className="w-8 text-right text-xs text-stone-300 tabular-nums">{s[metric]}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Feed */}
            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-stone-500">Últimos reportes</h3>
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-stone-900 animate-pulse" />)
              ) : feed.length === 0 ? (
                <div className="text-center py-12 text-stone-500 space-y-3">
                  <TreeDeciduous className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm">Todavía no hay reportes acá.</p>
                  <Link href="/reportar" className="inline-block text-sm text-green-400 hover:text-green-300">
                    Sé la primera persona en reportar
                  </Link>
                </div>
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    {feed.map(r => (
                      <FeedCard key={r.id} r={r} isNew={newIds.has(r.id)}
                        onHover={setHighlightedId} onOpen={() => setSelected(r)} />
                    ))}
                  </AnimatePresence>
                  {hasMore && (
                    <button onClick={loadMore} disabled={loadingMore} className="btn-secondary w-full text-sm">
                      {loadingMore ? 'Cargando…' : 'Cargar más'}
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {selected && (
          <ReportDetailModal key={selected.id} report={selected}
            onClose={() => setSelected(null)} onVerified={loadStats} />
        )}
      </AnimatePresence>
    </div>
  );
}
