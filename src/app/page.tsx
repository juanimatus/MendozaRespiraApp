'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { TreeDeciduous, Map, Camera, Sparkles, Users, LogIn, BarChart3 } from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '@/lib/auth-context';
import { fetchMunicipioStats } from '@/lib/explorer';
import { REGION } from '@/config/region';

const EASE = [0.4, 0, 0.2, 1] as const;

const STEPS = [
  { icon: Camera,   title: 'Sacá una foto',     text: 'Un árbol peligroso, un frente sin árboles, una parada sin sombra o un tocón.' },
  { icon: Sparkles, title: 'La IA la analiza',  text: 'Estima el riesgo y cuántos árboles faltan, y le sugiere al municipio qué hacer.' },
  { icon: Users,    title: 'Los vecinos confirman', text: 'Cada confirmación suma evidencia. Los datos son abiertos para todos.' },
];

export default function Home() {
  const { user, profile, role, loading } = useAuth();
  const [stats, setStats] = useState<{ total: number; units: number; confirmations: number; zonaEste: number } | null>(null);

  useEffect(() => {
    fetchMunicipioStats().then(rows => {
      const este = new Set<string>(REGION.zones['Zona Este'] ?? []);
      setStats({
        total:         rows.reduce((a, r) => a + r.total, 0),
        units:         rows.filter(r => r.total > 0).length,
        confirmations: rows.reduce((a, r) => a + r.confirmations, 0),
        zonaEste:      rows.filter(r => este.has(r.municipio)).reduce((a, r) => a + r.total, 0),
      });
    }).catch(() => setStats(null));
  }, []);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-10 flex flex-col"
      style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="flex-1 flex flex-col gap-8 max-w-md w-full mx-auto">

        {/* Marca + sesión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-900/40 border border-green-800/50 flex items-center justify-center">
              <TreeDeciduous className="w-5 h-5 text-green-500" />
            </div>
            <span className="font-semibold text-stone-100 tracking-tight">Mendoza Respira</span>
          </div>
          {!loading && (user && profile ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800 text-xs font-medium text-stone-200">
              {ROLE_BADGE[role]} {ROLE_LABELS[role]}
            </span>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-green-400 transition-colors">
              <LogIn className="w-4 h-4" /> Ingresar
            </Link>
          ))}
        </div>

        {/* Propuesta */}
        <div className="space-y-3 pt-4">
          <h1 className="text-[2rem] leading-[1.1] font-bold text-stone-50 tracking-tight">
            El arbolado de Mendoza,<br />
            <span className="text-green-500">mapeado por sus vecinos.</span>
          </h1>
          <p className="text-stone-400 leading-relaxed">
            Reportá en un minuto lo que ves en tu cuadra. Cada reporte llega al municipio
            con su ubicación, su nivel de riesgo y la evidencia de la comunidad.
          </p>
        </div>

        {/* Números en vivo */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'reportes',        value: stats?.total },
            { label: 'confirmaciones',  value: stats?.confirmations },
            { label: 'en Zona Este',    value: stats?.zonaEste },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 px-3 py-3">
              <p className="text-2xl font-bold text-stone-100 tabular-nums">
                {s.value ?? <span className="inline-block h-6 w-8 rounded bg-stone-800 animate-pulse align-middle" />}
              </p>
              <p className="text-[11px] text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <Link href="/reportar" className="btn-primary flex items-center justify-center gap-2 py-3.5 text-base">
            <Camera className="w-5 h-5" /> Reportar un problema
          </Link>
          <Link href="/feed" className="btn-secondary flex items-center justify-center gap-2">
            <Map className="w-4 h-4" /> Explorar el mapa de {REGION.name}
          </Link>
        </div>

        {/* Cómo funciona */}
        <ol className="space-y-4 border-t border-stone-800 pt-6">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-200">{i + 1}. {title}</p>
                <p className="text-sm text-stone-500 leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between text-sm">
          <Link href="/impacto" className="flex items-center gap-1.5 text-stone-400 hover:text-green-400 transition-colors">
            <BarChart3 className="w-4 h-4" /> Impacto y datos abiertos
          </Link>
          <Link href="/acerca" className="text-stone-500 hover:text-stone-300 transition-colors">Acerca</Link>
        </div>

        {/* Acceso municipal */}
        {!loading && user && (role === 'admin' || role === 'inspector') && (
          <div className="w-full border-t border-stone-800 pt-4 space-y-2">
            <p className="text-xs text-stone-600 uppercase tracking-wider">Zona municipal</p>
            <div className="grid grid-cols-2 gap-2">
              {role === 'admin' && (
                <Link href="/dashboard"
                  className="py-2 px-3 bg-stone-900 border border-stone-700 hover:border-green-700
                             text-xs font-medium text-stone-300 rounded-xl transition-colors text-center">
                  ⚙️ Dashboard
                </Link>
              )}
              <Link href="/inspector"
                className="py-2 px-3 bg-stone-900 border border-stone-700 hover:border-green-700
                           text-xs font-medium text-stone-300 rounded-xl transition-colors text-center">
                🔍 Inspector
              </Link>
              <Link href="/inventario"
                className="py-2 px-3 bg-stone-900 border border-stone-700 hover:border-green-700
                           text-xs font-medium text-stone-300 rounded-xl transition-colors text-center">
                🌳 Inventario
              </Link>
              <Link href="/reclamos"
                className="py-2 px-3 bg-stone-900 border border-stone-700 hover:border-green-700
                           text-xs font-medium text-stone-300 rounded-xl transition-colors text-center">
                📋 Reclamos
              </Link>
            </div>
          </div>
        )}

        <p className="mt-auto pt-6 text-center text-xs text-stone-600">
          Proyecto civic tech · Mendoza, Argentina · reportar no requiere datos personales
        </p>
      </motion.div>
    </main>
  );
}
