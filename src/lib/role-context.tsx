'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'ciudadano' | 'inspector' | 'admin';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'ciudadano',
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('ciudadano');

  useEffect(() => {
    const saved = localStorage.getItem('mr_role') as UserRole | null;
    if (saved) setRoleState(saved);
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem('mr_role', r);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ciudadano: 'Ciudadano',
  inspector: 'Inspector',
  admin:     'Administrador',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ciudadano: 'bg-stone-700 text-stone-200',
  inspector: 'bg-blue-900 text-blue-200',
  admin:     'bg-green-900 text-green-200',
};
