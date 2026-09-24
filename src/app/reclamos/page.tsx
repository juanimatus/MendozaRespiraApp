'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, MessageSquareWarning, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import { fetchClaims, updateClaimStatus } from '@/lib/trees';
import type { Claim, ClaimUrgency, ClaimStatus } from '@/types/trees';
import { URGENCY_LABELS, URGENCY_COLORS, CLAIM_STATUS_LABELS } from '@/types/trees';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;

const URGENCY_ICONS: Record<ClaimUrgency, React.ElementType> = {
  low: Clock, medium: Clock, high: AlertTriangle, critical: Zap,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ReclamosPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchClaims().then(c => { setClaims(c); setLoading(false); });
  }, []);

  async function handleStatus(claimId: string, status: ClaimStatus) {
    setUpdating(true);
    await updateClaimStatus(claimId, status);
    const updated = await fetchClaims();
    setClaims(updated);
    setSelected(updated.find(c => c.id === claimId) ?? null);
    setUpdating(false);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 sticky top-0 bg-stone-950 z-10"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <MessageSquareWarning className="w-5 h-5 text-amber-500" />
        <h1 className="text-base font-semibold text-stone-100">Reclamos IA</h1>
        <span className="ml-auto text-xs text-stone-500">{claims.length} total</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="report-card p-4 h-28 animate-pulse bg-stone-900" />)
        ) : claims.length === 0 ? (
          <div className="text-center py-16 text-stone-600">
            <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay reclamos todavía</p>
          </div>
        ) : (
          claims.map((claim, i) => {
            const UrgIcon = claim.ai_urgency ? URGENCY_ICONS[claim.ai_urgency] : Clock;
            return (
              <motion.button key={claim.id} onClick={() => setSelected(claim)} className="w-full text-left"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04, ease: EASE }}>
                <div className="report-card p-4 space-y-2 hover:border-stone-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {claim.ai_urgency && (
                        <UrgIcon className="w-4 h-4 shrink-0"
                          style={{ color: URGENCY_COLORS[claim.ai_urgency] }} />
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={claim.ai_urgency ? {
                          backgroundColor: URGENCY_COLORS[claim.ai_urgency] + '20',
                          color: URGENCY_COLORS[claim.ai_urgency],
                        } : {}}>
                        {claim.ai_urgency ? URGENCY_LABELS[claim.ai_urgency] : 'Sin clasificar'}
                      </span>
                    </div>
                    <span className="text-xs text-stone-600">{formatDate(claim.created_at)}</span>
                  </div>
                  <p className="text-sm text-stone-300 line-clamp-2">{claim.description}</p>
                  {claim.ai_summary && (
                    <p className="text-xs text-stone-500 bg-stone-900 rounded-lg px-3 py-2">
                      🤖 {claim.ai_summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">{claim.address ?? 'Sin dirección'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                      {CLAIM_STATUS_LABELS[claim.status]}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })
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
              <h2 className="text-base font-bold text-stone-100">Detalle del reclamo</h2>
              <div className="bg-stone-900 rounded-xl p-4 space-y-1">
                <p className="text-xs text-stone-500">Descripción original</p>
                <p className="text-sm text-stone-200">"{selected.description}"</p>
              </div>
              {selected.ai_summary && (
                <div className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">🤖 Clasificación IA</p>
                  <p className="text-sm text-stone-200">{selected.ai_summary}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: 'Categoría', value: selected.ai_category ?? '—' },
                      { label: 'Urgencia', value: selected.ai_urgency ? URGENCY_LABELS[selected.ai_urgency] : '—' },
                      { label: 'Área', value: selected.ai_area ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-stone-900 rounded-lg p-2 text-center">
                        <p className="text-xs text-stone-600">{label}</p>
                        <p className="text-xs font-semibold text-stone-300 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selected.ai_confidence && (
                    <p className="text-xs text-stone-600">Confianza: {(selected.ai_confidence * 100).toFixed(0)}%</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Actualizar estado</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['assigned', 'in_progress', 'resolved', 'dismissed'] as ClaimStatus[]).map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.97 }} disabled={updating || selected.status === s}
                      onClick={() => handleStatus(selected.id, s)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors
                        ${selected.status === s
                          ? 'bg-green-800 border-green-600 text-white'
                          : 'bg-stone-900 border-stone-700 text-stone-400 hover:border-stone-500'}`}>
                      {CLAIM_STATUS_LABELS[s]}
                    </motion.button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-secondary w-full">Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
