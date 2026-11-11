'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { TreeDeciduous, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

const EASE = [0.4, 0, 0.2, 1] as const;

// Acceso solo para el equipo técnico (agrónomo, inspector, admin).
// El vecino reporta, mira el mapa y sigue su caso sin cuenta.
const ROLE_REDIRECT: Record<string, string> = {
  inspector: '/revision',
  admin:     '/dashboard',
};

export default function LoginPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Email o contraseña incorrectos.'); setLoading(false); return; }

    // Obtener rol y redirigir. Una cuenta sin rol técnico no tiene nada que hacer acá.
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single();
    const target = ROLE_REDIRECT[profile?.role ?? ''];
    if (!target) {
      await supabase.auth.signOut();
      setError('Esta cuenta no tiene acceso al panel técnico. Para reportar no necesitás cuenta.');
      setLoading(false);
      return;
    }
    router.push(target);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800">
        <Link href="/" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <span className="font-semibold text-stone-100">Mendoza Respira</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="w-full max-w-sm space-y-6">

          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold text-stone-100">Acceso del equipo técnico</h1>
            <p className="text-sm text-stone-500">Para el ingeniero agrónomo, inspectores y el municipio.</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email" required className="form-input pl-9" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña" required minLength={6} className="form-input pl-9 pr-10" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</> :
                'Ingresar'}
            </motion.button>
          </form>

          {/* El vecino no necesita cuenta */}
          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-center space-y-2">
            <p className="text-sm text-stone-300">¿Sos vecino? No necesitás cuenta.</p>
            <Link href="/reportar" className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300">
              <Camera className="w-4 h-4" /> Reportar un problema
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
