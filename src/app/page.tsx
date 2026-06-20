'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TreeDeciduous, Map, PlusCircle } from 'lucide-react';

const EASE = [0.4, 0, 0.2, 1] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex flex-col items-center gap-6 max-w-sm"
      >
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-green-900/40 border border-green-800/50
                        flex items-center justify-center">
          <TreeDeciduous className="w-8 h-8 text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">
            Mendoza Respira
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Mapeo ciudadano de tocones y árboles talados.
            Cada reporte construye evidencia territorial.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3 w-full pt-2">
          <Link href="/mapa" className="btn-primary flex items-center justify-center gap-2">
            <Map className="w-4 h-4" />
            Ver mapa de reportes
          </Link>
          <Link href="/reportar" className="btn-secondary flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Reportar un tocón
          </Link>
        </div>
      </motion.div>

      <p className="absolute bottom-6 text-xs text-stone-600">
        Proyecto civic tech · sin registro necesario
      </p>
    </main>
  );
}
