'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TreeDeciduous, Menu, MapPin, CheckCircle, Users, Map, Download } from 'lucide-react';
import { fetchReports } from '@/lib/reports';
import { computeImpact, type ImpactStats, type Count } from '@/lib/impacto';
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS, type ReportType } from '@/types';
import SideMenu from '@/components/layout/SideMenu';

const EASE = [0.4, 0, 0.2, 1] as const;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function Stat({ label, value, icon: Icon, delay }: {
  label: string; value: number; icon: React.ElementType; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: EASE }}
      className="report-card p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-green-900/40 text-green-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-2xl font-bold text-stone-100 leading-tight">{value.toLocaleString('es-AR')}</p>
      </div>
    </motion.div>
  );
}

function Bars({ title, data, highlight }: { title: string; data: Count[]; highlight?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <section className="report-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-stone-200">{title}</h2>
      {data.length === 0 && <p className="text-xs text-stone-600">Todavía no hay datos.</p>}
      {data.map(d => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={d.label === highlight ? 'text-green-400 font-medium' : 'text-stone-400'}>{d.label}</span>
            <span className="text-stone-300 tabular-nums">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
            <div className={`h-full rounded-full ${d.label === highlight ? 'bg-green-500' : 'bg-stone-500'}`}
              style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function ImpactoPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats]       = useState<ImpactStats | null>(null);
  const [error, setError]       = useState(false);

  useEffect(() => {
    fetchReports()
      .then(reports => setStats(computeImpact(reports)))
      .catch(err => { console.error(err); setError(true); });
  }, []);

  const monthly = stats?.byMonth.map(m => ({
    label: `${MONTHS[Number(m.label.slice(5)) - 1]} ${m.label.slice(2, 4)}`,
    value: m.value,
  })) ?? [];

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
          <h1 className="text-base font-semibold text-stone-100 leading-tight">Impacto</h1>
          <p className="text-xs text-stone-500">Datos abiertos y en tiempo real</p>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto pb-10">
        {error && <p className="text-sm text-red-400">No se pudieron cargar los datos. Probá de nuevo en un rato.</p>}
        {!stats && !error && [...Array(3)].map((_, i) => (
          <div key={i} className="report-card animate-pulse bg-stone-900 h-24" />
        ))}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Reportes ciudadanos"  value={stats.total}         icon={MapPin}      delay={0} />
              <Stat label="Confirmaciones"       value={stats.confirmations} icon={CheckCircle} delay={0.04} />
              <Stat label="Personas reportando"  value={stats.reporters}     icon={Users}       delay={0.08} />
              <Stat label="Departamentos"        value={stats.municipios}    icon={Map}         delay={0.12} />
            </div>
            {stats.firstReportAt && (
              <p className="text-xs text-stone-500">
                Desde el {new Date(stats.firstReportAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                {' '}{stats.verified} reportes verificados por la comunidad y {stats.highRisk} con riesgo alto o crítico.
                {' '}Personas = dispositivos anónimos distintos.
              </p>
            )}

            <Bars title="Reportes por zona" data={stats.byZona} highlight="Zona Este" />
            <Bars title="Reportes por departamento" data={stats.byMunicipio} />
            <Bars title="Reportes por mes" data={monthly} />

            <section className="report-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-200">Por tipo</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(stats.byType) as ReportType[]).map(t => (
                  <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: REPORT_TYPE_COLORS[t] }}>
                    {REPORT_TYPE_LABELS[t]}: {stats.byType[t]}
                  </span>
                ))}
              </div>
            </section>

            <section className="report-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-200">Datos abiertos</h2>
              <p className="text-xs text-stone-400">
                Descargá todos los reportes para usarlos en tu municipio, escuela u organización.
                No incluyen datos personales.
              </p>
              <div className="flex gap-2">
                <a href="/api/datos/reportes?format=csv" className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> CSV
                </a>
                <a href="/api/datos/reportes?format=geojson" className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> GeoJSON
                </a>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
