'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Map, PlusCircle, Info, X, TreeDeciduous } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LINKS = [
  { href: '/mapa',     label: 'Mapa de reportes', icon: Map },
  { href: '/reportar', label: 'Nuevo reporte',    icon: PlusCircle },
  { href: '/acerca',   label: 'Acerca del proyecto', icon: Info },
];

// Easing discreto y rápido — sin bounce, sensación de respuesta inmediata
const EASE = [0.4, 0, 0.2, 1] as const;

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"
          />

          {/* Panel lateral */}
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-y-0 left-0 z-[1101] w-[78%] max-w-xs
                       bg-stone-950 border-r border-stone-800
                       flex flex-col"
          >
            {/* Header del menú */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <TreeDeciduous className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-stone-100">Mendoza Respira</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800
                           transition-colors duration-150"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <ul className="flex-1 py-3">
              {LINKS.map(({ href, label, icon: Icon }, i) => {
                const active = pathname === href;
                return (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: 0.04 + i * 0.03, ease: EASE }}
                  >
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-5 py-3 text-sm font-medium
                                  transition-colors duration-150
                                  ${active
                                    ? 'text-green-400 bg-green-900/20 border-r-2 border-green-500'
                                    : 'text-stone-300 hover:bg-stone-900 hover:text-stone-100'
                                  }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-800">
              <p className="text-xs text-stone-600">
                Proyecto civic tech · Mendoza, Argentina
              </p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
