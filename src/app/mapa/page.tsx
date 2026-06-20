'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TreeDeciduous, Plus, Info } from 'lucide-react';

// Leaflet no funciona en SSR → carga dinámica
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-stone-950">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-green-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-stone-400 text-sm">Cargando mapa…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b border-stone-800 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-stone-100 tracking-tight">Mendoza Respira</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/tu-org/mendoza-respira"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            title="Acerca del proyecto"
          >
            <Info className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Mapa — ocupa todo el espacio restante */}
      <main className="flex-1 relative overflow-hidden">
        <MapView />

        {/* FAB: Crear reporte */}
        <Link
          href="/reportar"
          className="absolute bottom-6 right-4 z-[1000] flex items-center gap-2
                     bg-green-700 hover:bg-green-600 active:scale-95
                     text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-black/40
                     transition-all duration-150"
        >
          <Plus className="w-5 h-5" />
          <span>Reportar tocón</span>
        </Link>
      </main>

      {/* Leyenda */}
      <footer className="flex items-center gap-4 px-4 py-2 bg-stone-950 border-t border-stone-800 text-xs text-stone-500 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Tocón
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Árbol talado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Sospecha
        </span>
      </footer>
    </div>
  );
}
