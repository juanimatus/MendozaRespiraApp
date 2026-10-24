'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, BadgeCheck, MapPin, Sparkles, Loader2, ExternalLink, Inbox, EyeOff, Eye } from 'lucide-react';

import SideMenu from '@/components/layout/SideMenu';
import { fetchReviewQueue, submitReview, hideReport } from '@/lib/review';
import type { ReportWithVerifications, RiskLevel } from '@/types';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, RISK_LABELS, RISK_COLORS } from '@/types';

const EASE = [0.4, 0, 0.2, 1] as const;
const RISKS: RiskLevel[] = ['ninguna', 'baja', 'media', 'alta', 'critica'];
const RISK_SHORT: Record<RiskLevel, string> = { ninguna: 'Ninguno', baja: 'Bajo', media: 'Medio', alta: 'Alto', critica: 'Crítico' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function aiRecommendation(r: ReportWithVerifications): string | null {
  const rec = (r.ai_analysis as { recomendacion?: unknown } | null)?.recomendacion;
  return typeof rec === 'string' ? rec : null;
}

function ReviewCard({ report, onDone }: { report: ReportWithVerifications; onDone: (id: string) => void }) {
  const [risk, setRisk]     = useState<RiskLevel | null>(report.ai_risk);
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [reason, setReason] = useState('');
  const recommendation = aiRecommendation(report);

  async function save() {
    if (!risk) return;
    setSaving(true);
    setError(null);
    try {
      await submitReview(report.id, risk, note);
      onDone(report.id);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Revisá que tu usuario sea inspector o admin.');
      setSaving(false);
    }
  }

  async function discard() {
    setSaving(true);
    setError(null);
    try {
      await hideReport(report.id, reason);
      onDone(report.id);
    } catch (err) {
      console.error(err);
      setError('No se pudo descartar. ¿Corriste la migración 007 en Supabase?');
      setSaving(false);
    }
  }

  return (
    <motion.article layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2, ease: EASE }}
      className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-hidden md:grid md:grid-cols-[280px_1fr]">
      <div className="relative aspect-video md:aspect-auto md:min-h-full bg-stone-800">
        <Image src={report.photo_url} alt="Foto del reporte" fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: REPORT_TYPE_COLORS[report.type] }}>
            {REPORT_TYPE_LABELS[report.type]}
          </span>
          <span className="text-xs text-stone-500">{formatDate(report.created_at)}</span>
          <span className="text-xs text-stone-500">· {report.verification_count} confirmaciones</span>
        </div>

        <a href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-sm text-stone-300 hover:text-green-400 transition-colors">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{[report.address, report.municipio].filter(Boolean).join(' · ') || `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}</span>
          <ExternalLink className="w-3 h-3 shrink-0 text-stone-500" />
        </a>

        {/* Validación del lugar: Street View para confirmar que el árbol existe */}
        <div className="flex gap-2">
          <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${report.lat},${report.lng}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-300 border border-stone-700 rounded-lg py-1.5 hover:border-green-700 hover:text-green-400 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Street View
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-300 border border-stone-700 rounded-lg py-1.5 hover:border-green-700 hover:text-green-400 transition-colors">
            <MapPin className="w-3.5 h-3.5" /> Ver en el mapa
          </a>
        </div>

        {report.comment && <p className="text-sm text-stone-400">“{report.comment}”</p>}

        {report.ai_summary && (
          <div className="rounded-xl bg-stone-800/60 p-3 space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400">
              <Sparkles className="w-3.5 h-3.5" /> Sugerencia de la IA
              {report.ai_risk && <span style={{ color: RISK_COLORS[report.ai_risk] }}>· {RISK_LABELS[report.ai_risk]}</span>}
            </p>
            <p className="text-sm text-stone-300">{report.ai_summary}</p>
            {recommendation && <p className="text-xs text-stone-500">Recomendación: {recommendation}</p>}
          </div>
        )}

        {report.reviewed_at ? (
          <div className="rounded-xl border border-sky-900/60 bg-sky-950/30 p-3 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
              <BadgeCheck className="w-4 h-4" /> Revisado {formatDate(report.reviewed_at)}
              {report.review_risk && <span style={{ color: RISK_COLORS[report.review_risk] }}>· {RISK_LABELS[report.review_risk]}</span>}
            </p>
            {report.review_note && <p className="text-sm text-stone-300">{report.review_note}</p>}
          </div>
        ) : (
          <div className="space-y-3 border-t border-stone-800 pt-3">
            <p className="text-xs font-medium text-stone-400">Nivel de riesgo según tu revisión</p>
            <div className="grid grid-cols-5 gap-1.5">
              {RISKS.map(k => (
                <button key={k} type="button" onClick={() => setRisk(k)}
                  className={`py-2 rounded-lg text-[11px] font-semibold border transition-colors
                    ${risk === k ? 'text-white border-transparent' : 'text-stone-400 border-stone-700 hover:border-stone-500'}`}
                  style={risk === k ? { backgroundColor: RISK_COLORS[k] } : undefined}>
                  {RISK_SHORT[k]}
                </button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500}
              placeholder="Observación técnica y acción sugerida (opcional)"
              className="form-input resize-none text-sm" />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button onClick={save} disabled={!risk || saving}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              Confirmar revisión
            </button>

            {discarding ? (
              <div className="space-y-2 rounded-xl border border-red-900/60 bg-red-950/20 p-3">
                <p className="text-xs text-stone-400">
                  El reporte deja de verse en el mapa y en las estadísticas, pero queda guardado.
                </p>
                <input value={reason} onChange={e => setReason(e.target.value)} maxLength={200}
                  placeholder="Motivo (ej. foto con personas, duplicado, no es arbolado)"
                  className="form-input text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setDiscarding(false)} disabled={saving}
                    className="flex-1 py-2 rounded-lg text-sm text-stone-400 border border-stone-700 hover:border-stone-500">
                    Cancelar
                  </button>
                  <button onClick={discard} disabled={saving}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-red-700 hover:bg-red-600 disabled:opacity-50">
                    Descartar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setDiscarding(true)} disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition-colors">
                <EyeOff className="w-3.5 h-3.5" /> Descartar reporte (spam, duplicado o foto inapropiada)
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default function RevisionPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab]           = useState<'pendientes' | 'revisados'>('pendientes');
  const [reports, setReports]   = useState<ReportWithVerifications[] | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setReports(null);
    setLoadError(false);
    try {
      setReports(await fetchReviewQueue(tab === 'revisados'));
    } catch (err) {
      console.error(err);
      setLoadError(true);
      setReports([]);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function handleDone(id: string) {
    setReports(prev => prev?.filter(r => r.id !== id) ?? null);
    setDoneCount(c => c + 1);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="flex items-center gap-3 px-4 py-3 border-b border-stone-800 sticky top-0 bg-stone-950/95 backdrop-blur z-10"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú"
          className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <BadgeCheck className="w-5 h-5 text-sky-400" />
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-stone-100 leading-tight">Revisión técnica</h1>
          <p className="text-xs text-stone-500">El riesgo que confirmes reemplaza al de la IA</p>
        </div>
        {doneCount > 0 && (
          <span className="ml-auto text-xs text-sky-300">{doneCount} resuelto{doneCount === 1 ? '' : 's'}</span>
        )}
      </header>

      <div className="flex-1 w-full max-w-3xl mx-auto p-4 space-y-4 pb-10">
        <div className="flex rounded-xl border border-stone-800 bg-stone-900/60 p-0.5 text-sm w-fit">
          {(['pendientes', 'revisados'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {reports === null ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-stone-500" /></div>
        ) : loadError ? (
          <p className="text-sm text-red-400 py-10 text-center">
            No se pudo cargar la lista. ¿Corriste la migración 005 en Supabase?
          </p>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-stone-500">
            <Inbox className="w-8 h-8" />
            <p className="text-sm">{tab === 'pendientes' ? 'No hay reportes pendientes de revisión.' : 'Todavía no hay reportes revisados.'}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {reports.map(r => <ReviewCard key={r.id} report={r} onDone={handleDone} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
