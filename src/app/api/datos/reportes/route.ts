import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ReportWithVerifications } from '@/types';
import { toCSV, toGeoJSON } from '@/lib/impacto';

// Datos abiertos: GET /api/datos/reportes?format=geojson|csv
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get('format') ?? 'geojson';
  if (format !== 'geojson' && format !== 'csv') {
    return NextResponse.json({ error: 'format debe ser geojson o csv' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reports_with_verifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const reports = (data ?? []) as ReportWithVerifications[];

  if (format === 'csv') {
    return new NextResponse('﻿' + toCSV(reports), {   // BOM para que Excel lea los acentos
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mendoza-respira-reportes.csv"',
      },
    });
  }
  return new NextResponse(JSON.stringify(toGeoJSON(reports)), {
    headers: {
      'Content-Type':        'application/geo+json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mendoza-respira-reportes.geojson"',
    },
  });
}
