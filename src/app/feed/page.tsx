'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { TreeDeciduous, MapPin, Clock, CheckCircle, Filter, ChevronDown, Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { ReportWithVerifications } from '@/types';
import type { Claim } from '@/types/trees';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS } from '@/types';
import { URGENCY_LABELS, URGENCY_COLORS, CLAIM_STATUS_LABELS } from '@/types/trees';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;
const PAGE_SIZE = 10;

const MUNICIPIOS = ['Todos', 'Capital', 'Guaymallén', 'Las Heras', 'Godoy Cruz', 'Maipú', 'Luján de Cuyo'];
const TIPOS = ['Todos', 'tocon', 'arbol_talado', 'sospecha', 'reclamo'];

type FeedItem =
  | (ReportWithVerifications & { _kind: 'report' })
  | (Claim & { _kind: 'claim' });

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return 'ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function ReportCard({ item }: { item: ReportWithVerifications & { _kind: 'report' } }) {
  const color = REPORT_TYPE_COLORS[item.type];
  return (
    <div className="report-card overflow-hidden">
      {item.photo_url && (
        <div className="relative w-full aspect-video bg-stone-900">
          <Image src={item.photo_url} alt="Foto reporte" fill className="object-cover" sizes="(max-width: 640px) 100vw, 480px" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}>
            {REPORT_TYPE_LABELS[item.type]}
          </span>
          <span className="text-xs text-stone-500">{formatDate(item.created_at)}</span>
        </div>
        {item.comment && <p className="text-sm text-stone-300">{item.comment}</p>}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            {item.verification_count} confirmaciones
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {item.status === 'verified'
            ? <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verificado</span>
            : <span className="text-xs text-stone-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>}
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ item }: { item: Claim & { _kind: 'claim' } }) {
  const urgColor = item.ai_urgency ? URGENCY_COLORS[item.ai_urgency] : '#6b7280';
  return (
    <div className="report-card overflow-hidden">
      {item.photo_url && (
        <div className="relative w-full aspect-video bg-stone-900">
          <Image src={item.photo_url} alt="Foto reclamo" fill className="object-cover" sizes="(max-width: 640px) 100vw, 480px" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: urgColor + '25', color: urgColor }}>
            🤖 {item.ai_urgency ? URGENCY_LABELS[item.ai_urgency] : 'Reclamo'}
          </span>
          <span className="text-xs text-stone-500">{formatDate(item.created_at)}</span>
        </div>
        <p className="text-sm text-stone-300">"{item.description}"</p>
        {item.ai_summary && (
          <p className="text-xs text-stone-500 bg-stone-900 rounded-lg px-3 py-2">
            {item.ai_summary}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.address ?? 'Sin dirección'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
            {CLAIM_STATUS_LABELS[item.status]}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [items, setItems]         = useState<FeedItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  const [page, setPage]           = useState(0);
  const [municipio, setMunicipio] = useState('Todos');
  const [tipo, setTipo]           = useState('Todos');
  const [filterOpen, setFilterOpen] = useState(false);

  const supabase = createClient();

  const load = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    if (reset) setLoading(true); else setLoadingMore(true);

    const from = currentPage * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    // Cargar reports
    let reportQuery = supabase
      .from('reports_with_verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tipo !== 'Todos' && tipo !== 'reclamo') {
      reportQuery = reportQuery.eq('type', tipo);
    }

    // Cargar claims
    let claimQuery = supabase
      .from('claims')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    const promises: PromiseLike<any>[] = [];
    if (tipo === 'Todos' || tipo !== 'reclamo') promises.push(reportQuery);
    else promises.push(Promise.resolve({ data: [] }));

    if (tipo === 'Todos' || tipo === 'reclamo') promises.push(claimQuery);
    else promises.push(Promise.resolve({ data: [] }));

    const [{ data: reports }, { data: claims }] = await Promise.all(promises);

    const reportItems: FeedItem[] = (reports ?? []).map((r: any) => ({ ...r, _kind: 'report' as const }));
    const claimItems:  FeedItem[] = (claims  ?? []).map((c: any) => ({ ...c, _kind: 'claim'  as const }));

    // Merge y ordenar por fecha
    const merged = [...reportItems, ...claimItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, PAGE_SIZE);

    setItems(prev => reset ? merged : [...prev, ...merged]);
    setHasMore(merged.length === PAGE_SIZE);
    setPage(currentPage + 1);
    setLoading(false);
    setLoadingMore(false);
  }, [page, tipo, municipio]);

  useEffect(() => { load(true); }, [tipo, municipio]);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 sticky top-0 bg-stone-950 z-10">
        <button onClick={() => setMenuOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-base font-semibold text-stone-100 leading-tight">Feed de reportes</h1>
          <p className="text-xs text-stone-500">Mendoza en tiempo real</p>
        </div>
        <button onClick={() => setFilterOpen(v => !v)}
          className="ml-auto flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200
                     bg-stone-900 border border-stone-700 px-3 py-1.5 rounded-xl transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filtrar
          <motion.div animate={{ rotate: filterOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="w-3 h-3" />
          </motion.div>
        </button>
      </header>

      {/* Filtros */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: EASE }}
            className="border-b border-stone-800 bg-stone-950 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Municipio / Localidad</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {MUNICIPIOS.map(m => (
                    <button key={m} onClick={() => setMunicipio(m)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                        ${municipio === m ? 'bg-green-800 border-green-600 text-white' : 'bg-stone-900 border-stone-700 text-stone-400'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Tipo de reporte</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {TIPOS.map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors
                        ${tipo === t ? 'bg-green-800 border-green-600 text-white' : 'bg-stone-900 border-stone-700 text-stone-400'}`}>
                      {t === 'Todos' ? 'Todos' : t === 'reclamo' ? 'Reclamo municipal' : REPORT_TYPE_LABELS[t as keyof typeof REPORT_TYPE_LABELS] ?? t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="flex-1 p-4 space-y-4 pb-10 max-w-lg mx-auto w-full">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="report-card animate-pulse bg-stone-900 h-48" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-stone-600">
            <TreeDeciduous className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay reportes para este filtro</p>
          </div>
        ) : (
          <>
            {items.map((item, i) => (
              <motion.div key={`${item._kind}-${item.id}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03, ease: EASE }}>
                {item._kind === 'report'
                  ? <ReportCard item={item as any} />
                  : <ClaimCard  item={item as any} />}
              </motion.div>
            ))}

            {hasMore && (
              <motion.button onClick={() => load(false)} disabled={loadingMore}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary w-full flex items-center justify-center gap-2">
                {loadingMore
                  ? <><span className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" /> Cargando…</>
                  : 'Cargar más'}
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
