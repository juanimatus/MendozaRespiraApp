'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TreeDeciduous, Map, PlusCircle, Rss, LogIn } from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '@/lib/auth-context';

const EASE = [0.4, 0, 0.2, 1] as const;

export default function Home() {
  const { user, profile, role, loading } = useAuth();

  return (
    <main className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 py-10 text-center">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="flex flex-col items-center gap-6 max-w-sm w-full">

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-green-900/40 border border-green-800/50
                        flex items-center justify-center">
          <TreeDeciduous className="w-8 h-8 text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Mendoza Respira AI</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Plataforma de gestión inteligente del arbolado urbano.
            Cada reporte construye evidencia territorial.
          </p>
        </div>

        {/* Estado de sesión */}
        {!loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1, ease: EASE }}
            className="w-full">
            {user && profile ? (
              <div className="bg-green-900/20 border border-green-800/40 rounded-2xl p-4 space-y-3">
                <p className="text-sm text-stone-300">
                  Bienvenido, <strong className="text-stone-100">{profile.full_name || profile.email}</strong>
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800 text-xs font-semibold text-stone-200">
                  <span>{ROLE_BADGE[role]}</span>
                  <span>{ROLE_LABELS[role]}</span>
                </div>
              </div>
            ) : (
              <Link href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 px-5
                           bg-stone-900 border border-stone-700 hover:border-green-700
                           text-stone-300 hover:text-green-400 rounded-xl text-sm font-medium
                           transition-colors duration-150">
                <LogIn className="w-4 h-4" />
                Iniciar sesión / Registrarse
              </Link>
            )}
          </motion.div>
        )}

        {/* Acciones principales */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15, ease: EASE }}
          className="flex flex-col gap-3 w-full">
          <Link href="/mapa" className="btn-primary flex items-center justify-center gap-2">
            <Map className="w-4 h-4" /> Ver mapa de reportes
          </Link>
          <Link href="/feed" className="btn-secondary flex items-center justify-center gap-2">
            <Rss className="w-4 h-4" /> Feed de reportes
          </Link>
          <Link href="/reportar" className="btn-secondary flex items-center justify-center gap-2">
            <PlusCircle className="w-4 h-4" /> Reportar un tocón
          </Link>
        </motion.div>

        {/* Acceso municipal */}
        {!loading && user && (role === 'admin' || role === 'inspector') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.2, ease: EASE }}
            className="w-full border-t border-stone-800 pt-4 space-y-2">
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
          </motion.div>
        )}
      </motion.div>

      <p className="absolute bottom-6 text-xs text-stone-700"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        Proyecto civic tech · Mendoza, Argentina · sin datos personales requeridos para reportar
      </p>
    </main>
  );
}
