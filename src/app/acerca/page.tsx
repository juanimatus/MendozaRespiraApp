'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronLeft, TreeDeciduous, Camera, MapPin, Users } from 'lucide-react';

const EASE = [0.4, 0, 0.2, 1] as const;

const STEPS = [
  { icon: Camera,  title: 'Sacá una foto',       text: 'Del tocón, árbol talado o sospecha de caída.' },
  { icon: MapPin,  title: 'Capturá tu ubicación', text: 'El GPS de tu celular marca el punto exacto.' },
  { icon: Users,   title: 'La comunidad valida',  text: 'Otros vecinos pueden confirmar que el reporte existe.' },
];

export default function AcercaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors duration-150"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-stone-100">Acerca del proyecto</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="p-6 space-y-8 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-14 h-14 rounded-2xl bg-green-900/40 border border-green-800/50 flex items-center justify-center">
            <TreeDeciduous className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-stone-300 text-sm leading-relaxed">
            Mendoza Respira es un proyecto de civic tech ambiental.
            Cada reporte construye evidencia territorial de la deforestación urbana
            en Mendoza, Argentina.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: 0.05 + i * 0.05, ease: EASE }}
              className="flex items-start gap-4 report-card p-4"
            >
              <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-100">{title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-stone-600 pt-4">
          Sin registro, sin recolección de datos personales.
          Identificación anónima por dispositivo.
        </p>
      </motion.div>
    </div>
  );
}
