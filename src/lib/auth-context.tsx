'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'ciudadano' | 'inspector' | 'admin';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  municipio: string | null;
}

interface AuthContextValue {
  user:    User | null;
  profile: Profile | null;
  role:    UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, profile: null, role: 'ciudadano', loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function loadProfile(u: User) {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', u.id).single();
    setProfile(data as Profile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user);
        else setProfile(null);
        setLoading(false);
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile,
      role: (profile?.role ?? 'ciudadano') as UserRole,
      loading, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
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

export const ROLE_BADGE: Record<UserRole, string> = {
  ciudadano: '👤',
  inspector: '🔍',
  admin:     '⚙️',
};
