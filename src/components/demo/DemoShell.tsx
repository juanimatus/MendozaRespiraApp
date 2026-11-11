'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Map, ListOrdered, FileText, LogOut } from 'lucide-react';
import { DEMO_CLIENT, DEMO_DISCLAIMER } from '@/lib/demo/data';

const TABS = [
  { href: '/demo',              label: 'Mapa de riesgo', icon: Map },
  { href: '/demo/priorizacion', label: 'Plan de poda',   icon: ListOrdered },
  { href: '/demo/informe',      label: 'Informe',        icon: FileText },
];

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/demo/ingresar') return <>{children}</>;

  return (
    <div className="min-h-screen bg-stone-950 print:bg-white">
      {/* Aviso fijo: estos datos no son reales */}
      <div className="bg-amber-500 text-stone-950 text-xs font-semibold text-center px-3 py-1.5 print:hidden"
        style={{ paddingTop: 'calc(0.375rem + env(safe-area-inset-top))' }}>
        DEMO · {DEMO_DISCLAIMER}
      </div>
      <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-[1000] print:hidden">
        <div className="max-w-6xl mx-auto px-4 pt-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-900/40 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-100 leading-tight truncate">Mendoza Respira · Arbolado y líneas</p>
            <p className="text-xs text-stone-500 truncate">{DEMO_CLIENT}</p>
          </div>
          <form action="/api/demo/salir" method="post">
            <button type="submit" className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 px-2 py-1.5 rounded-lg hover:bg-stone-800">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </form>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto no-scrollbar mt-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors
                  ${active ? 'border-amber-400 text-amber-300 font-medium' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-4 pb-12 print:p-0 print:max-w-none">{children}</main>
    </div>
  );
}
