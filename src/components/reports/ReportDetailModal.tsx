'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { X, CheckCircle, Clock, Users } from 'lucide-react';

import { verifyReport, hasVerified } from '@/lib/reports';
import type { ReportWithVerifications } from '@/types';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, STATUS_LABELS } from '@/types';

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

export default function ReportDetailModal({ report, onClose, onVerified }: Props) {
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [verifying, setVerifying]             = useState(false);
  const [count, setCount]                     = useState(report.verification_count);

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
    try {
      await verifyReport(report.id);
      setAlreadyVerified(true);
      setCount((c) => c + 1);
      onVerified();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  }

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
        className="w-full sm:max-w-sm bg-stone-950 border border-stone-800
                   rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
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

          {/* Coordenadas */}
          <p className="text-xs text-stone-600 font-mono">
            {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
          </p>

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

          {/* Botón verificar */}
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
        </div>
      </motion.div>
    </motion.div>
  );
}
