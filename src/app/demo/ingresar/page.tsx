'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock } from 'lucide-react';

export default function DemoLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/demo/ingresar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setLoading(false);
    if (res?.ok) {
      router.replace('/demo');
      router.refresh();
      return;
    }
    const data = await res?.json().catch(() => null);
    setError(data?.error ?? 'No se pudo entrar. Probá de nuevo.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
      <form onSubmit={submit} className="report-card w-full max-w-sm p-6 space-y-5">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-amber-900/40 text-amber-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-stone-100">Mendoza Respira para distribuidoras</h1>
          <p className="text-sm text-stone-400">Demo privado. Ingresá con la contraseña que te compartimos.</p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs text-stone-400">Contraseña de demo</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            autoFocus required autoComplete="current-password" className="form-input w-full" />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading || !password}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Lock className="w-4 h-4" /> {loading ? 'Entrando…' : 'Entrar al demo'}
        </button>
        <p className="text-[11px] text-stone-600 text-center">Todos los datos del demo son ficticios.</p>
      </form>
    </div>
  );
}
