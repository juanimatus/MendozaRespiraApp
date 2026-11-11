'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { RISK_COLORS, RISK_LABELS } from '@/types';
import {
  DEMO_CASES, DEMO_ZONAS, DEMO_TYPE_LABELS, DEFAULT_COSTS, STATUS_LABELS,
  costOf, formatARS, priorityOf, type CostTable,
} from '@/lib/demo/data';

const BUDGET_STEPS = [2_000_000, 4_000_000, 6_000_000, 8_000_000, 12_000_000, 20_000_000];

function CostInput({ label, value, onChange, step = 10_000 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-stone-500">{label}</span>
      <input type="number" min={0} step={step} value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="form-input w-full text-sm tabular-nums" />
    </label>
  );
}

export default function DemoPriorizacionPage() {
  const [zona, setZona] = useState<string | null>(null);
  const [budgetIdx, setBudgetIdx] = useState(2);
  const [costs, setCosts] = useState<CostTable>(DEFAULT_COSTS);
  const [showCosts, setShowCosts] = useState(false);
  const budget = BUDGET_STEPS[budgetIdx];

  // Casos abiertos ordenados por prioridad; se cubren en orden hasta agotar el presupuesto
  const plan = useMemo(() => {
    const open = DEMO_CASES
      .filter(c => c.status !== 'resuelto' && (!zona || c.zona === zona))
      .map(c => ({ ...c, priority: priorityOf(c), cost: costOf(c, costs) }))
      .sort((a, b) => b.priority - a.priority);
    let acc = 0;
    return open.map(c => {
      const fits = acc + c.cost <= budget;
      if (fits) acc += c.cost;
      return { ...c, inPlan: fits };
    });
  }, [zona, budget, costs]);

  const inPlan = plan.filter(c => c.inPlan);
  const spent = inPlan.reduce((s, c) => s + c.cost, 0);
  const totalRisk = plan.reduce((s, c) => s + c.priority, 0);
  const coveredRisk = inPlan.reduce((s, c) => s + c.priority, 0);
  const urgentOpen = plan.filter(c => c.risk === 'critica' || c.risk === 'alta');
  const urgentCovered = urgentOpen.filter(c => c.inPlan).length;
  const emergencyCost = inPlan.reduce((s, c) => s + c.cost * costs.emergencia, 0);

  function downloadCsv() {
    const head = ['caso', 'prioridad', 'en_plan', 'tipo', 'riesgo', 'tension', 'alimentador', 'departamento',
      'distancia_m', 'especie', 'estado', 'costo_estimado_ars', 'lat', 'lng'];
    const rows = plan.map(c => [c.id, c.priority, c.inPlan ? 'si' : 'no', DEMO_TYPE_LABELS[c.type], RISK_LABELS[c.risk],
      c.tension, c.lineName, c.zona, c.distanciaM, c.especie, STATUS_LABELS[c.status], c.cost,
      c.lat.toFixed(5), c.lng.toFixed(5)]);
    const csv = ['# DEMO - datos ficticios', head.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'plan-de-poda-demo.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-100">Plan de poda priorizado</h1>
          <p className="text-sm text-stone-400">Con el presupuesto del mes, qué casos atender primero para bajar más riesgo por peso invertido.</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-stone-700 p-0.5 text-xs">
          {[null, ...DEMO_ZONAS].map(z => (
            <button key={z ?? 'todas'} onClick={() => setZona(z)}
              className={`px-2.5 py-1.5 rounded-lg ${zona === z ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-200'}`}>
              {z ?? 'Zona Este'}
            </button>
          ))}
        </div>
      </div>

      <section className="report-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-200">Presupuesto de poda del mes</h2>
          <span className="text-lg font-bold text-amber-300 tabular-nums">{formatARS(budget)}</span>
        </div>
        <input type="range" min={0} max={BUDGET_STEPS.length - 1} value={budgetIdx}
          onChange={e => setBudgetIdx(Number(e.target.value))} className="w-full accent-amber-500" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><p className="text-xs text-stone-500">Casos que entran</p><p className="text-stone-100 font-semibold">{inPlan.length} de {plan.length}</p></div>
          <div><p className="text-xs text-stone-500">Riesgo cubierto</p><p className="text-stone-100 font-semibold">{Math.round((coveredRisk / Math.max(1, totalRisk)) * 100)}%</p></div>
          <div><p className="text-xs text-stone-500">Alto o crítico atendidos</p><p className="text-stone-100 font-semibold">{urgentCovered} de {urgentOpen.length}</p></div>
          <div><p className="text-xs text-stone-500">Costo estimado</p><p className="text-stone-100 font-semibold">{formatARS(spent)}</p></div>
        </div>
        <p className="text-xs text-stone-400">
          Si estos mismos casos se resolvieran de urgencia (después de un corte o una caída), costarían
          aproximadamente <strong className="text-stone-200">{formatARS(emergencyCost)}</strong> con el recargo de {costs.emergencia.toLocaleString('es-AR')}×.
        </p>
        <button onClick={() => setShowCosts(s => !s)} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5" /> {showCosts ? 'Ocultar' : 'Ajustar'} costos de referencia (ficticios)
        </button>
        {showCosts && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CostInput label="Poda baja tensión ($)" value={costs.podaBT} onChange={v => setCosts(c => ({ ...c, podaBT: v }))} />
            <CostInput label="Poda media tensión ($)" value={costs.podaMT} onChange={v => setCosts(c => ({ ...c, podaMT: v }))} />
            <CostInput label="Extracción ($)" value={costs.extraccion} onChange={v => setCosts(c => ({ ...c, extraccion: v }))} />
            <CostInput label="Recargo urgencia (×)" value={costs.emergencia} step={0.1} onChange={v => setCosts(c => ({ ...c, emergencia: v }))} />
          </div>
        )}
      </section>

      <section className="report-card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
          <h2 className="text-sm font-semibold text-stone-200">Casos abiertos por prioridad</h2>
          <button onClick={downloadCsv} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
            <Download className="w-3.5 h-3.5" /> CSV para cuadrillas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-stone-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Caso</th>
                <th className="px-2 py-2 font-medium">Prioridad</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Riesgo</th>
                <th className="px-2 py-2 font-medium">Línea</th>
                <th className="px-2 py-2 font-medium text-right">Distancia</th>
                <th className="px-4 py-2 font-medium text-right">Costo est.</th>
              </tr>
            </thead>
            <tbody>
              {plan.map(c => (
                <tr key={c.id} className={`border-t border-stone-800/70 ${c.inPlan ? '' : 'opacity-45'}`}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${c.inPlan ? 'bg-amber-400' : 'bg-stone-600'}`} />
                    <span className="text-stone-200">{c.id}</span>
                    <span className="text-stone-500 text-xs ml-1.5">{c.zona}</span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${c.priority}%` }} />
                      </div>
                      <span className="tabular-nums text-stone-300 text-xs">{c.priority}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-stone-300 whitespace-nowrap">{DEMO_TYPE_LABELS[c.type]}</td>
                  <td className="px-2 py-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: RISK_COLORS[c.risk] }}>
                      {RISK_LABELS[c.risk]}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-stone-400 whitespace-nowrap">{c.lineId} · {c.tension}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-stone-300">{c.distanciaM.toLocaleString('es-AR')} m</td>
                  <td className="px-4 py-2 text-right tabular-nums text-stone-200 whitespace-nowrap">{formatARS(c.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-stone-500 border-t border-stone-800">
          Prioridad (0 a 100) = riesgo asignado por el agrónomo + cercanía de la copa a la línea + tensión + usuarios que dependen del tramo.
          Los pesos se ajustan con cada distribuidora.
        </p>
      </section>

      <Link href="/demo/informe" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm">
        Ver informe de evidencia <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
