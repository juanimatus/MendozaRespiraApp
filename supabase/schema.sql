-- ============================================================
-- MENDOZA RESPIRA — Schema SQL
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- TABLA: reports
-- ============================================================
create table public.reports (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),

  -- Ubicación
  lat           double precision not null,
  lng           double precision not null,
  address       text,                         -- geocodificación reversa opcional

  -- Contenido
  type          text not null check (type in ('tocon', 'arbol_talado', 'sospecha')),
  comment       text,
  photo_url     text not null,               -- URL pública de Supabase Storage

  -- Estado
  status        text not null default 'pending' check (status in ('pending', 'verified')),

  -- Autor anónimo (fingerprint simple, no auth)
  reporter_id   text                          -- localStorage UUID del dispositivo
);

-- Índice espacial simple
create index reports_location_idx on public.reports (lat, lng);
create index reports_status_idx   on public.reports (status);
create index reports_created_idx  on public.reports (created_at desc);

-- ============================================================
-- TABLA: verifications
-- ============================================================
create table public.verifications (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),

  report_id     uuid not null references public.reports(id) on delete cascade,
  verifier_id   text not null,               -- localStorage UUID del dispositivo

  -- Una verificación por dispositivo por reporte
  unique(report_id, verifier_id)
);

create index verifications_report_idx on public.verifications (report_id);

-- ============================================================
-- VISTA: reports con conteo de verificaciones
-- ============================================================
create or replace view public.reports_with_verifications as
  select
    r.*,
    count(v.id)::int as verification_count
  from public.reports r
  left join public.verifications v on v.report_id = r.id
  group by r.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Reports: lectura pública, escritura abierta (MVP sin auth)
alter table public.reports enable row level security;

create policy "Lectura pública de reportes"
  on public.reports for select using (true);

create policy "Cualquiera puede crear reportes"
  on public.reports for insert with check (true);

-- Verifications: lectura pública, escritura abierta
alter table public.verifications enable row level security;

create policy "Lectura pública de verificaciones"
  on public.verifications for select using (true);

create policy "Cualquiera puede verificar"
  on public.verifications for insert with check (true);

-- ============================================================
-- STORAGE: bucket para fotos
-- ============================================================
-- Ejecutar esto también en SQL Editor:
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict do nothing;

create policy "Fotos públicas de lectura"
  on storage.objects for select
  using (bucket_id = 'report-photos');

create policy "Upload de fotos abierto"
  on storage.objects for insert
  with check (bucket_id = 'report-photos');
