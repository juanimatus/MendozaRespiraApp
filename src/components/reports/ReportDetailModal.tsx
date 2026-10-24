'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { X, CheckCircle, Clock, Users, BadgeCheck, Send, Inbox, Wrench, MapPin } from 'lucide-react';

import { verifyReport, hasVerified, isRateLimited, isOwnReport, verifyErrorMessage, RATE_LIMIT_MESSAGE } from '@/lib/reports';
import type { ReportWithVerifications } from '@/types';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, STATUS_LABELS, RISK_LABELS, RISK_COLORS } from '@/types';

const EASE = [0.4, 0, 0.2, 1] as const;

interface Props {
  report: ReportWithVerifications;
  onClose: () => void;
  onVerified: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Línea de tiempo del caso, armada con los datos que ya tiene el reporte
function Timeline({ report, count }: { report: ReportWithVerifications; count: number }) {
  const steps: { icon: typeof Send; title: string; detail: React.ReactNode; date?: string; done: boolean }[] = [
    { icon: Send, title: 'Reporte enviado', done: true, date: report.created_at,
      detail: `Un vecino lo reportó${report.municipio ? ` en ${report.municipio}` : ''}.` },
    { icon: Inbox, title: 'Recibido por el municipio', done: true, date: report.created_at,
      detail: 'Quedó registrado y en la bandeja del técnico.' },
    { icon: Users, title: 'Confirmado por vecinos', done: count > 0,
      detail: count > 0
        ? `${count} ${count === 1 ? 'vecino confirmó' : 'vecinos confirmaron'} que existe.`
        : 'Esperando que otro vecino lo confirme.' },
    { icon: BadgeCheck, title: 'Revisado por el ingeniero agrónomo', done: !!report.reviewed_at,
      date: report.reviewed_at ?? undefined,
      detail: report.reviewed_at ? (
        <span className="space-y-1 block">
          {report.review_risk && (
            <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: RISK_COLORS[report.review_risk] }}>
              {RISK_LABELS[report.review_risk]}
            </span>
          )}
          {report.review_note && <span className="block">{report.review_note}</span>}
        </span>
      ) : 'En revisión.' },
    { icon: Wrench, title: 'Intervención', done: false,
      detail: 'El municipio programa la poda, extracción o plantación.' },
  ];
  const current = steps.findIndex(s => !s.done);

  return (
    <ol className="pt-1">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const last = i === steps.length - 1;
        return (
          <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && (
              <span className={`absolute left-[13px] top-7 bottom-0 w-px ${step.done && steps[i + 1].done ? 'bg-green-700' : 'bg-stone-800'}`} />
            )}
            <span className={`relative z-10 w-7 h-7 shrink-0 rounded-full flex items-center justify-center border
              ${step.done ? 'bg-green-900/60 border-green-700 text-green-400'
                : i === current ? 'bg-stone-900 border-amber-600 text-amber-400'
                : 'bg-stone-900 border-stone-700 text-stone-600'}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm font-medium ${step.done ? 'text-stone-200' : i === current ? 'text-amber-300' : 'text-stone-500'}`}>
                  {step.title}
                </p>
                {step.date && <time className="text-[11px] text-stone-500 shrink-0">{shortDate(step.date)}</time>}
              </div>
              <div className={`text-xs ${step.done ? 'text-stone-400' : 'text-stone-500'}`}>{step.detail}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ReportDetailModal({ report, onClose, onVerified }: Props) {
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [verifying, setVerifying]             = useState(false);
  const [count, setCount]                     = useState(report.verification_count);
  const [verifyError, setVerifyError]         = useState<string | null>(null);

  useEffect(() => {
    hasVerified(report.id).then(setAlreadyVerified);
  }, [report.id]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleVerify() {
    if (alreadyVerified || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await verifyReport(report.id);
      setAlreadyVerified(true);
      setCount((c) => c + 1);
      onVerified();
    } catch (err) {
      console.error(err);
      setVerifyError(isRateLimited(err) ? RATE_LIMIT_MESSAGE : verifyErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  const own = isOwnReport(report.reporter_id);
  const typeColor = REPORT_TYPE_COLORS[report.type];

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: EASE }}
      className="absolute inset-0 z-[1001] flex items-end sm:items-center justify-center
                 bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Sheet / Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto bg-stone-950 border border-stone-800
                   rounded-t-3xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Foto */}
        <div className="relative w-full aspect-video bg-stone-900">
          <Image
            src={report.photo_url}
            alt="Foto del reporte"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 384px"
          />

          {/* Cerrar */}
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.92 }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70
                       text-white transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Badge de estado */}
          <span
            className="absolute bottom-3 left-3 flex items-center gap-1
                       text-xs font-semibold px-2.5 py-1 rounded-full
                       bg-black/60 text-white"
          >
            {report.status === 'verified'
              ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              : <Clock className="w-3.5 h-3.5 text-amber-400" />
            }
            {STATUS_LABELS[report.status]}
          </span>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Tipo + fecha */}
          <div className="flex items-start justify-between gap-3">
            <span
              className="badge text-white text-sm px-3 py-1 rounded-full font-semibold"
              style={{ backgroundColor: typeColor }}
            >
              {REPORT_TYPE_LABELS[report.type]}
            </span>
            <time className="text-xs text-stone-500 shrink-0 mt-1">
              {formatDate(report.created_at)}
            </time>
          </div>

          {/* Comentario */}
          {report.comment && (
            <p className="text-stone-300 text-sm leading-relaxed">
              {report.comment}
            </p>
          )}

          {/* Solo el departamento: la dirección y las coordenadas quedan para el técnico (privacidad del vecino) */}
          {report.municipio && (
            <p className="flex items-center gap-1.5 text-sm text-stone-400">
              <MapPin className="w-4 h-4" /> {report.municipio}
            </p>
          )}

          {/* Línea de tiempo del caso */}
          <Timeline report={report} count={count} />

          {/* Verificaciones */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-800">
            <span className="flex items-center gap-2 text-sm text-stone-400">
              <Users className="w-4 h-4" />
              <span>
                <motion.strong
                  key={count}
                  initial={{ scale: 1.3, color: '#4ade80' }}
                  animate={{ scale: 1, color: '#e7e5e4' }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="inline-block text-stone-200"
                >
                  {count}
                </motion.strong>{' '}
                {count === 1 ? 'persona confirma' : 'personas confirman'} que existe
              </span>
            </span>
          </div>

          {/* Botón verificar — oculto para quien subió el reporte */}
          {own ? (
            <p className="w-full text-center text-xs text-stone-500 py-2">
              Subiste este reporte. Que otros vecinos lo confirmen le da más peso.
            </p>
          ) : (
          <motion.button
            onClick={handleVerify}
            disabled={alreadyVerified || verifying}
            whileTap={!alreadyVerified ? { scale: 0.97 } : undefined}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
                        font-semibold text-sm transition-colors duration-150
                        ${alreadyVerified
                          ? 'bg-green-900/40 text-green-400 border border-green-800 cursor-default'
                          : 'btn-primary'
                        }`}
          >
            {verifying
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />
            }
            {alreadyVerified ? 'Ya lo confirmaste' : 'Confirmo que existe'}
          </motion.button>
          )}
          {verifyError && <p className="text-xs text-red-400 text-center">{verifyError}</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}
