'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Link2, Check, Loader2 } from 'lucide-react';

import ReportDetailModal from '@/components/reports/ReportDetailModal';
import { fetchReport, isOwnReport } from '@/lib/reports';
import type { ReportWithVerifications } from '@/types';

// Página pública de un caso: el vecino la sigue sin iniciar sesión.
// El enlace es único por reporte (el id no se puede adivinar).
export default function CasoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportWithVerifications | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    fetchReport(id).then(setReport).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function copyLink() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mi reporte en Mendoza Respira', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el vecino canceló el menú de compartir */
    }
  }

  const own = report ? isOwnReport(report.reporter_id) : false;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-stone-100">Seguimiento del caso</h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-4">
        {notFound ? (
          <div className="max-w-sm mx-auto text-center space-y-3 pt-10">
            <p className="text-stone-300">No encontramos este reporte.</p>
            <p className="text-sm text-stone-500">Puede que el enlace esté incompleto o que el reporte se haya dado de baja.</p>
            <Link href="/feed" className="btn-secondary inline-flex">Ver el mapa</Link>
          </div>
        ) : !report ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
          </div>
        ) : (
          <>
            {own && (
              <div className="max-w-sm mx-auto rounded-2xl border border-green-800/40 bg-green-900/15 px-4 py-3 space-y-2">
                <p className="text-sm text-stone-200">Este es tu reporte.</p>
                <p className="text-xs text-stone-400">
                  No necesitás cuenta: guardá este enlace para ver cómo avanza.
                  También lo encontrás en «Mis reportes» desde este teléfono.
                </p>
                <button onClick={copyLink}
                  className="flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300">
                  {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  {copied ? 'Enlace copiado' : 'Copiar o compartir el enlace'}
                </button>
              </div>
            )}
            <ReportDetailModal inline report={report} onClose={() => router.push('/feed')} onVerified={load} />
          </>
        )}
      </main>
    </div>
  );
}
