'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { TreeDeciduous, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

const EASE = [0.4, 0, 0.2, 1] as const;
type Mode = 'login' | 'register';

const ROLE_REDIRECT: Record<string, string> = {
  ciudadano: '/mapa',
  inspector: '/inspector',
  admin:     '/dashboard',
};

export default function LoginPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }

      // Obtener rol y redirigir
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single();
      const role = profile?.role ?? 'ciudadano';
      router.push(ROLE_REDIRECT[role] ?? '/mapa');
      router.refresh();

    } else {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role: 'ciudadano' } },
      });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('¡Cuenta creada! Revisá tu email para confirmar el registro.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800">
        <Link href="/" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <TreeDeciduous className="w-5 h-5 text-green-500" />
        <span className="font-semibold text-stone-100">Mendoza Respira AI</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="w-full max-w-sm space-y-6">

          {/* Tabs login / registro */}
          <div className="flex rounded-xl bg-stone-900 border border-stone-800 p-1">
            {(['login', 'register'] as Mode[]).map(m => (
              <motion.button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${mode === m ? 'bg-green-800 text-white' : 'text-stone-400 hover:text-stone-200'}`}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </motion.button>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div key="fullname"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15, ease: EASE }}>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Nombre completo" required className="form-input" />
                </motion.div>
              )}
            </AnimatePresence>

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
              {success && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded-xl px-4 py-3">
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</> :
                mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </motion.button>
          </form>

          {/* Usuarios de demo */}
          <div className="space-y-2">
            <p className="text-xs text-stone-600 text-center uppercase tracking-wider">Demo rápida</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '👤 Ciudadano', email: 'ciudadano@mendozarespira.ar' },
                { label: '🔍 Inspector', email: 'inspector@mendozarespira.ar' },
                { label: '⚙️ Admin',     email: 'admin@mendozarespira.ar' },
              ].map(({ label, email: e }) => (
                <button key={e} onClick={() => { setEmail(e); setPassword('Demo1234!'); setMode('login'); }}
                  className="text-xs py-2 px-1 bg-stone-900 border border-stone-700 rounded-xl
                             text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors">
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-700 text-center">Pass: Demo1234!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
