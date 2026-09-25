'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  Map, PlusCircle, Info, X, TreeDeciduous,
  LayoutDashboard, ClipboardList, MessageSquareWarning,
  Search, LogIn, LogOut, Rss,
} from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_COLORS, ROLE_BADGE } from '@/lib/auth-context';

interface Props { open: boolean; onClose: () => void; }

const EASE = [0.4, 0, 0.2, 1] as const;

const PUBLIC_LINKS = [
  { href: '/mapa',     label: 'Mapa de reportes',    icon: Map },
  { href: '/feed',     label: 'Feed de reportes',    icon: Rss },
  { href: '/reportar', label: 'Nuevo reporte',       icon: PlusCircle },
  { href: '/acerca',   label: 'Acerca del proyecto', icon: Info },
];

const INSPECTOR_LINKS = [
  { href: '/inspector',  label: 'Inspector IA',  icon: Search },
  { href: '/inventario', label: 'Inventario',    icon: ClipboardList },
  { href: '/reclamos',   label: 'Reclamos',      icon: MessageSquareWarning },
];

const ADMIN_LINKS = [
  { href: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/inspector',  label: 'Inspector IA',  icon: Search },
  { href: '/inventario', label: 'Inventario',    icon: ClipboardList },
  { href: '/reclamos',   label: 'Reclamos',      icon: MessageSquareWarning },
];

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, profile, role, signOut } = useAuth();

  const municipalLinks =
    role === 'admin'     ? ADMIN_LINKS :
    role === 'inspector' ? INSPECTOR_LINKS : [];

  async function handleSignOut() {
    await signOut();
    onClose();
    router.push('/');
    router.refresh();
  }

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = pathname === href;
    return (
      <Link href={href} onClick={onClose}
        className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors duration-150
          ${active
            ? 'text-green-400 bg-green-900/20 border-r-2 border-green-500'
            : 'text-stone-300 hover:bg-stone-900 hover:text-stone-100'}`}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-y-0 left-0 z-[1101] w-[78%] max-w-xs
                       bg-stone-950 border-r border-stone-800 flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800"
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
              <div className="flex items-center gap-2">
                <TreeDeciduous className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-stone-100 text-sm">Mendoza Respira AI</span>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Perfil / sesión */}
            <div className="px-4 py-3 border-b border-stone-800">
              {user && profile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[role]}`}>
                      {ROLE_BADGE[role]} {ROLE_LABELS[role]}
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 truncate">
                    {profile.full_name || profile.email}
                  </p>
                </div>
              ) : (
                <Link href="/login" onClick={onClose}
                  className="flex items-center gap-2 text-sm text-stone-400 hover:text-green-400 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión
                </Link>
              )}
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto py-2">
              {/* Zona pública */}
              <div className="pb-2">
                <p className="px-5 pt-3 pb-1 text-xs text-stone-600 uppercase tracking-wider font-medium">
                  Público
                </p>
                {PUBLIC_LINKS.map(l => (
                  <motion.div key={l.href}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, ease: EASE }}>
                    <NavLink {...l} />
                  </motion.div>
                ))}
              </div>

              {/* Zona municipal (solo si autenticado con rol) */}
              {municipalLinks.length > 0 && (
                <div className="border-t border-stone-800 pt-2">
                  <p className="px-5 pt-3 pb-1 text-xs text-stone-600 uppercase tracking-wider font-medium">
                    Municipal
                  </p>
                  {municipalLinks.map((l, i) => (
                    <motion.div key={l.href}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: 0.03 + i * 0.03, ease: EASE }}>
                      <NavLink {...l} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: logout */}
            <div className="px-4 py-4 border-t border-stone-800 space-y-3"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              {user ? (
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl
                             text-sm text-stone-400 hover:text-red-400 hover:bg-red-900/20
                             border border-stone-800 hover:border-red-800/40 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              ) : null}
              <p className="text-xs text-stone-700">Civic tech · Mendoza · MVP v0.2</p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
