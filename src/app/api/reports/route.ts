import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint REST alternativo (útil para testing con curl / Postman)
// El frontend usa la librería de cliente directamente para mayor eficiencia.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET() {
  const { data, error } = await supabase
    .from('reports_with_verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
