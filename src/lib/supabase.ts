import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ID anónimo persistido en localStorage (identifica el dispositivo)
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('mr_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mr_device_id', id);
  }
  return id;
}
