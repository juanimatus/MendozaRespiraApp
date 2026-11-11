'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertTriangle, Users, Zap, CheckCircle, ArrowRight, X } from 'lucide-react';
import { RISK_COLORS, RISK_LABELS } from '@/types';
import {
  DEMO_CASES, DEMO_ZONAS, DEMO_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, TENSION_LABELS,
  formatDay, priorityOf, type DemoCase,
} from '@/lib/demo/data';

const DemoMap = dynamic(() => import('@/components/demo/DemoMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-stone-900 animate-pulse" />,
});

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ElementType; tone: string }) {
  return (
    <div className="report-card p-3.5 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-xl font-bold text-stone-100 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function CaseDetail({ c, onClose }: { c: DemoCase; onClose: () => void }) {
  const steps = [
    { label: c.origin === 'vecino' ? 'Reportado por un vecino en la app' : 'Cargado por cuadrilla', at: c.reportedAt },
    { label: `Revisado por agrónomo: ${RISK_LABELS[c.risk].toLowerCase()}`, at: c.reviewedAt },
    ...(c.status !== 'nuevo' ? [{ label: 'Incluido en el plan de poda', at: c.reviewedAt }] : []),
    ...(c.resolvedAt ? [{ label: c.emergencia ? 'Resuelto de urgencia' : 'Resuelto con poda planificada', at: c.resolvedAt }] : []),
  ];
  return (
    <div className="report-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">{c.id} · {c.lineName}</p>
          <p className="text-base font-semibold text-stone-100">{DEMO_TYPE_LABELS[c.type]}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800" aria-label="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: RISK_COLORS[c.risk] }}>{RISK_LABELS[c.risk]}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full text-stone-950" style={{ background: STATUS_COLORS[c.status] }}>{STATUS_LABELS[c.status]}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">Prioridad {priorityOf(c)}/100</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div><dt className="text-stone-500">Tensión</dt><dd className="text-stone-200">{TENSION_LABELS[c.tension]}</dd></div>
        <div><dt className="text-stone-500">Distancia copa-línea</dt><dd className="text-stone-200">{c.distanciaM.toLocaleString('es-AR')} m</dd></div>
        <div><dt className="text-stone-500">Especie</dt><dd className="text-stone-200">{c.especie}</dd></div>
        <div><dt className="text-stone-500">Altura</dt><dd className="text-stone-200">{c.alturaM} m</dd></div>
        <div><dt className="text-stone-500">Departamento</dt><dd className="text-stone-200">{c.zona}</dd></div>
        <div><dt className="text-stone-500">Usuarios del tramo</dt><dd className="text-stone-200">{c.usuarios.toLocaleString('es-AR')}</dd></div>
      </dl>
      <ol className="border-l border-stone-700 ml-1.5 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="pl-3 relative">
            <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-400" />
            <p className="text-xs text-stone-200">{s.label}</p>
            <p className="text-[11px] text-stone-500">{formatDay(s.at)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function DemoMapaPage() {
  const [zona, setZona] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<DemoCase | null>(null);

  const inZona = useMemo(() => DEMO_CASES.filter(c => !zona || c.zona === zona), [zona]);
  const visible = useMemo(
    () => inZona.filter(c => showResolved || c.status !== 'resuelto'),
    [inZona, showResolved],
  );
  const open = inZona.filter(c => c.status !== 'resuelto');
  const urgent = open.filter(c => c.risk === 'critica' || c.risk === 'alta');
  const mtUrgent = urgent.filter(c => c.tension === 'MT').length;
  const vecinos = inZona.filter(c => c.origin === 'vecino').length;
  // Cada tramo cuenta una sola vez aunque tenga varios casos
  const usuariosExpuestos = Array.from(new Map(urgent.map(c => [c.lineId, c.usuarios])).values())
    .reduce((a, b) => a + b, 0);

  const topLines = useMemo(() => {
    const m = new Map<string, { name: string; tension: string; count: number }>();
    for (const c of urgent) {
      const e = m.get(c.lineId) ?? { name: c.lineName, tension: c.tension, count: 0 };
      e.count++; m.set(c.lineId, e);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [urgent]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-100">Árboles en conflicto con la red</h1>
          <p className="text-sm text-stone-400">Reportes de vecinos y cuadrillas, revisados por un agrónomo y cruzados con el trazado de las líneas.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-stone-700 p-0.5 text-xs">
          {[null, ...DEMO_ZONAS].map(z => (
            <button key={z ?? 'todas'} onClick={() => { setZona(z); setSelected(null); }}
              className={`px-2.5 py-1.5 rounded-lg ${zona === z ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
              {z ?? 'Zona Este'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Casos abiertos" value={open.length} icon={AlertTriangle} tone="bg-amber-900/40 text-amber-400" />
        <Kpi label="Riesgo alto o crítico" value={`${urgent.length} (${mtUrgent} en MT)`} icon={Zap} tone="bg-red-900/40 text-red-400" />
        <Kpi label="Usuarios en tramos con riesgo" value={usuariosExpuestos.toLocaleString('es-AR')} icon={Users} tone="bg-blue-900/40 text-blue-400" />
        <Kpi label="Detectados por vecinos" value={`${Math.round((vecinos / Math.max(1, inZona.length)) * 100)}%`} icon={CheckCircle} tone="bg-green-900/40 text-green-400" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="report-card overflow-hidden h-[420px] lg:h-[560px] p-0">
          <DemoMap cases={visible} zona={zona} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} className="accent-amber-500" />
            Mostrar casos ya resueltos
          </label>
          {selected ? (
            <CaseDetail c={selected} onClose={() => setSelected(null)} />
          ) : (
            <div className="report-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-stone-200">Alimentadores con más riesgo</h2>
              {topLines.map(l => (
                <div key={l.name} className="flex justify-between text-sm">
                  <span className="text-stone-300">{l.name} <span className="text-stone-500">· {l.tension}</span></span>
                  <span className="text-stone-100 tabular-nums">{l.count}</span>
                </div>
              ))}
              <p className="text-xs text-stone-500">Tocá un punto del mapa para ver la ficha del caso y su historial.</p>
            </div>
          )}
          <Link href="/demo/priorizacion" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            Ver plan de poda priorizado <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
