'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Camera, Loader2, BadgeCheck, Users } from 'lucide-react';

import { fetchMyReports } from '@/lib/reports';
import type { ReportWithVerifications } from '@/types';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS } from '@/types';

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// En qué paso está el caso, en palabras del vecino
function stage(r: ReportWithVerifications): string {
  if (r.reviewed_at) return 'Revisado por el técnico';
  if (r.verification_count > 0) return 'Confirmado por vecinos';
  return 'Recibido, esperando revisión';
}

// Reportes enviados desde este teléfono, sin cuenta ni contraseña
export default function MisReportesPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportWithVerifications[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMyReports().then(setReports).catch(() => setError(true));
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-stone-100">Mis reportes</h1>
      </header>

      <main className="flex-1 px-4 py-5 max-w-md w-full mx-auto space-y-4">
        <p className="text-xs text-stone-500">
          Los reportes que enviaste desde este teléfono. No hace falta cuenta: si cambiás de
          teléfono o borrás los datos del navegador, usá el enlace de cada caso.
        </p>

        {error ? (
          <p className="text-sm text-red-400">No se pudieron cargar tus reportes. Revisá tu conexión.</p>
        ) : !reports ? (
          <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 text-stone-500 animate-spin" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center space-y-4 pt-8">
            <p className="text-stone-300">Todavía no enviaste reportes desde este teléfono.</p>
            <Link href="/reportar" className="btn-primary inline-flex items-center gap-2">
              <Camera className="w-4 h-4" /> Reportar un problema
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {reports.map(r => (
              <li key={r.id}>
                <Link href={`/caso/${r.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 p-2.5 hover:border-stone-600 transition-colors">
                  <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-stone-800">
                    <Image src={r.photo_url} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: REPORT_TYPE_COLORS[r.type] }}>
                      {REPORT_TYPE_LABELS[r.type]}
                    </span>
                    <p className="text-xs text-stone-400 truncate">
                      {r.municipio ?? 'Sin departamento'} · {shortDate(r.created_at)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-stone-300">
                      {r.reviewed_at ? <BadgeCheck className="w-3.5 h-3.5 text-green-400" /> : <Users className="w-3.5 h-3.5 text-stone-500" />}
                      {stage(r)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-600 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
