'use client';

import { useMemo } from 'react';
import { Printer, Download } from 'lucide-react';
import { RISK_LABELS } from '@/types';
import {
  DEMO_CASES, DEMO_CLIENT, DEMO_DISCLAIMER, DEMO_LINES, DEMO_TODAY, DEMO_TYPE_LABELS, DEFAULT_COSTS,
  STATUS_LABELS, costOf, formatARS, formatDay, summarize,
} from '@/lib/demo/data';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-stone-300 rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-2xl font-bold text-stone-900 leading-tight">{value}</p>
      {note && <p className="text-[11px] text-stone-500 mt-0.5">{note}</p>}
    </div>
  );
}

export default function DemoInformePage() {
  const costs = DEFAULT_COSTS;
  const s = useMemo(() => summarize(DEMO_CASES, costs), [costs]);
  const firstDate = DEMO_CASES.reduce((min, c) => (c.reportedAt < min ? c.reportedAt : min), DEMO_CASES[0].reportedAt);

  const byMonth = useMemo(() => {
    const m = new Map<string, { planned: number; urgent: number }>();
    for (const c of DEMO_CASES) {
      if (!c.resolvedAt) continue;
      const d = new Date(c.resolvedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const e = m.get(key) ?? { planned: 0, urgent: 0 };
      if (c.emergencia) e.urgent++; else e.planned++;
      m.set(key, e);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ label: `${MONTHS[Number(k.slice(5))]} ${k.slice(2, 4)}`, ...v }));
  }, []);
  const maxMonth = Math.max(1, ...byMonth.map(m => m.planned + m.urgent));

  const byLine = DEMO_LINES.map(l => {
    const cs = DEMO_CASES.filter(c => c.lineId === l.id);
    return {
      ...l,
      detectados: cs.length,
      resueltos:  cs.filter(c => c.status === 'resuelto').length,
      abiertosAltos: cs.filter(c => c.status !== 'resuelto' && (c.risk === 'alta' || c.risk === 'critica')).length,
    };
  });

  const recent = DEMO_CASES.filter(c => c.resolvedAt)
    .sort((a, b) => b.resolvedAt!.localeCompare(a.resolvedAt!)).slice(0, 8);

  function downloadCsv() {
    const head = ['caso', 'tipo', 'origen', 'riesgo', 'tension', 'alimentador', 'departamento', 'estado',
      'reportado', 'revisado', 'resuelto', 'urgencia', 'costo_estimado_ars'];
    const rows = DEMO_CASES.map(c => [c.id, DEMO_TYPE_LABELS[c.type], c.origin, RISK_LABELS[c.risk], c.tension,
      c.lineName, c.zona, STATUS_LABELS[c.status], c.reportedAt.slice(0, 10), c.reviewedAt.slice(0, 10),
      c.resolvedAt?.slice(0, 10) ?? '', c.emergencia ? 'si' : 'no', costOf(c, costs)]);
    const csv = ['# DEMO - datos ficticios', head.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'evidencia-casos-demo.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-stone-100">Informe de evidencia</h1>
          <p className="text-sm text-stone-400">Para el directorio, el ente regulador o el reporte de sostenibilidad. Se descarga como PDF.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCsv} className="btn-secondary text-sm flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
          <button onClick={() => window.print()} className="btn-primary text-sm flex items-center gap-2"><Printer className="w-4 h-4" /> Descargar PDF</button>
        </div>
      </div>

      {/* Hoja del informe: fondo claro para que se imprima bien */}
      <article className="relative bg-white text-stone-800 rounded-2xl p-6 sm:p-10 space-y-7 print:rounded-none print:p-8 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[120px] sm:text-[160px] font-black text-amber-500/10 -rotate-[24deg] select-none">DEMO</span>
        </div>

        <header className="relative space-y-1 border-b border-stone-300 pb-4">
          <p className="text-xs font-semibold text-amber-700">DOCUMENTO DE DEMOSTRACIÓN · DATOS FICTICIOS</p>
          <h2 className="text-2xl font-bold text-stone-900">Gestión del arbolado en conflicto con la red eléctrica</h2>
          <p className="text-sm text-stone-600">
            {DEMO_CLIENT} · Zona Este de Mendoza · del {formatDay(firstDate)} al {formatDay(DEMO_TODAY.toISOString())}
          </p>
          <p className="text-xs text-stone-500">Generado con Mendoza Respira.</p>
        </header>

        <section className="relative space-y-2">
          <h3 className="text-base font-semibold text-stone-900">Resumen</h3>
          <p className="text-sm leading-relaxed">
            En el período se registraron <strong>{s.total} casos</strong> de árboles en conflicto con la red, el{' '}
            <strong>{Math.round((s.porVecinos / s.total) * 100)}%</strong> detectados por vecinos desde la app. Cada caso
            fue revisado por un ingeniero agrónomo antes de entrar al plan. Se resolvieron <strong>{s.resueltos}</strong>,
            de los cuales <strong>{s.planificadas}</strong> con poda planificada y <strong>{s.urgencias}</strong> de urgencia,
            con un tiempo promedio de <strong>{s.avgDays} días</strong> entre el reporte y la resolución.
            Quedan <strong>{s.abiertos}</strong> casos abiertos, {s.criticosAbiertos} con riesgo alto o crítico.
          </p>
        </section>

        <section className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Figure label="Casos detectados" value={String(s.total)} note={`${s.porVecinos} por vecinos`} />
          <Figure label="Resueltos" value={String(s.resueltos)} note={`${s.planificadas} planificados`} />
          <Figure label="Días promedio" value={String(s.avgDays)} note="del reporte a la resolución" />
          <Figure label="Ahorro estimado" value={formatARS(s.ahorro)} note="si lo planificado se hacía de urgencia" />
        </section>

        <section className="relative space-y-3">
          <h3 className="text-base font-semibold text-stone-900">Intervenciones por mes</h3>
          <div className="flex items-end gap-3 h-36">
            {byMonth.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[11px] text-stone-600 tabular-nums">{m.planned + m.urgent}</span>
                <div className="w-full max-w-[48px] flex flex-col justify-end rounded overflow-hidden"
                  style={{ height: `${((m.planned + m.urgent) / maxMonth) * 100}%` }}>
                  <div className="bg-red-400" style={{ flex: m.urgent }} />
                  <div className="bg-emerald-600" style={{ flex: m.planned }} />
                </div>
                <span className="text-[11px] text-stone-500">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-stone-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Planificadas</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> De urgencia</span>
          </div>
        </section>

        <section className="relative space-y-2 break-inside-avoid">
          <h3 className="text-base font-semibold text-stone-900">Por alimentador</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-stone-500 text-left border-b border-stone-300">
              <tr>
                <th className="py-1.5 font-medium">Alimentador</th>
                <th className="py-1.5 font-medium">Tensión</th>
                <th className="py-1.5 font-medium text-right">Detectados</th>
                <th className="py-1.5 font-medium text-right">Resueltos</th>
                <th className="py-1.5 font-medium text-right">Abiertos alto/crítico</th>
              </tr>
            </thead>
            <tbody>
              {byLine.map(l => (
                <tr key={l.id} className="border-b border-stone-200">
                  <td className="py-1.5">{l.name}<span className="text-stone-500 text-xs"> · {l.zona}</span></td>
                  <td className="py-1.5">{l.tension}</td>
                  <td className="py-1.5 text-right tabular-nums">{l.detectados}</td>
                  <td className="py-1.5 text-right tabular-nums">{l.resueltos}</td>
                  <td className="py-1.5 text-right tabular-nums">{l.abiertosAltos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="relative space-y-2 break-inside-avoid">
          <h3 className="text-base font-semibold text-stone-900">Últimos casos cerrados</h3>
          <ul className="text-sm divide-y divide-stone-200">
            {recent.map(c => (
              <li key={c.id} className="py-1.5 flex flex-wrap justify-between gap-x-3">
                <span>{c.id} · {DEMO_TYPE_LABELS[c.type]} · {c.especie}, {c.zona}</span>
                <span className="text-stone-500 text-xs">
                  reportado {formatDay(c.reportedAt)} → resuelto {formatDay(c.resolvedAt!)}{c.emergencia ? ' (urgencia)' : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-500">Cada caso conserva fotos, ubicación GPS original, revisión técnica y fecha de cada paso.</p>
        </section>

        <section className="relative space-y-1.5 border-t border-stone-300 pt-4 text-xs text-stone-600 break-inside-avoid">
          <h3 className="text-sm font-semibold text-stone-900">Método y alcance</h3>
          <p>Los casos llegan por reporte ciudadano georreferenciado o por carga de cuadrillas, y un ingeniero agrónomo asigna el nivel de riesgo.
            La prioridad combina ese riesgo con la cercanía a la línea, la tensión y los usuarios del tramo.</p>
          <p>Los costos son valores de referencia y el ahorro estimado compara la poda planificada con el recargo de una intervención de urgencia
            ({costs.emergencia.toLocaleString('es-AR')}×). No incluye multas, compensaciones a usuarios ni daños evitados.</p>
          <p>Este informe aporta evidencia trazable para reportes de sostenibilidad o auditorías. No es una certificación
            ni calcula compensación de carbono.</p>
          <p className="font-semibold text-amber-700">{DEMO_DISCLAIMER}</p>
        </section>
      </article>
    </div>
  );
}
