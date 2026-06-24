'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Map, PlusCircle, Info, X, TreeDeciduous,
         LayoutDashboard, ClipboardList, MessageSquareWarning,
         Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useRole, ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/lib/role-context';

interface Props { open: boolean; onClose: () => void; }

const CITIZEN_LINKS = [
  { href: '/mapa',     label: 'Mapa de reportes', icon: Map },
  { href: '/reportar', label: 'Nuevo reporte',    icon: PlusCircle },
  { href: '/acerca',   label: 'Acerca del proyecto', icon: Info },
];

const MUNICIPAL_LINKS = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario',  icon: ClipboardList },
  { href: '/reclamos',   label: 'Reclamos IA', icon: MessageSquareWarning },
  { href: '/inspector',  label: 'Inspector',   icon: Search },
];

const EASE = [0.4, 0, 0.2, 1] as const;
const ROLES: UserRole[] = ['ciudadano', 'inspector', 'admin'];

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [roleOpen, setRoleOpen] = useState(false);

  const isMunicipal = role === 'inspector' || role === 'admin';
  const links = isMunicipal ? MUNICIPAL_LINKS : CITIZEN_LINKS;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"
          />
          <motion.nav
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-y-0 left-0 z-[1101] w-[78%] max-w-xs
                       bg-stone-950 border-r border-stone-800 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <TreeDeciduous className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-stone-100 text-sm">Mendoza Respira AI</span>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de rol */}
            <div className="px-4 py-3 border-b border-stone-800">
              <p className="text-xs text-stone-600 mb-2 uppercase tracking-wider font-medium">Perfil activo</p>
              <button
                onClick={() => setRoleOpen(v => !v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl
                            text-sm font-semibold transition-colors ${ROLE_COLORS[role]}`}
              >
                <span>{ROLE_LABELS[role]}</span>
                <motion.div animate={{ rotate: roleOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>

              <AnimatePresence>
                {roleOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-1">
                      {ROLES.filter(r => r !== role).map(r => (
                        <button
                          key={r}
                          onClick={() => { setRole(r); setRoleOpen(false); onClose(); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm
                                      transition-colors ${ROLE_COLORS[r]} opacity-70 hover:opacity-100`}
                        >
                          {ROLE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Links según rol */}
            <ul className="flex-1 py-3 overflow-y-auto">
              {/* Siempre: mapa ciudadano */}
              {isMunicipal && (
                <li>
                  <Link href="/mapa" onClick={onClose}
                    className={`flex items-center gap-3 px-5 py-2.5 text-xs font-medium
                                transition-colors text-stone-500 hover:bg-stone-900 hover:text-stone-300`}>
                    <Map className="w-4 h-4" /> Mapa ciudadano
                  </Link>
                </li>
              )}

              {isMunicipal && (
                <li className="px-5 pt-3 pb-1">
                  <span className="text-xs text-stone-600 uppercase tracking-wider font-medium">Municipal</span>
                </li>
              )}

              {links.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <motion.li key={href}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: 0.04 + i * 0.03, ease: EASE }}
                  >
                    <Link href={href} onClick={onClose}
                      className={`flex items-center gap-3 px-5 py-3 text-sm font-medium
                                  transition-colors duration-150
                                  ${active
                                    ? 'text-green-400 bg-green-900/20 border-r-2 border-green-500'
                                    : 'text-stone-300 hover:bg-stone-900 hover:text-stone-100'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <div className="px-5 py-4 border-t border-stone-800">
              <p className="text-xs text-stone-600">Civic tech · Mendoza, Argentina · MVP v0.1</p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
