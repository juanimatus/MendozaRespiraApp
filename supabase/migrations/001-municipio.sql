-- ============================================================
-- MENDOZA RESPIRA — Migración 001: municipio en reportes y reclamos
-- Ejecutar en Supabase → SQL Editor sobre una base que ya tiene
-- schema.sql, schema-ai.sql y schema-auth.sql aplicados.
-- ============================================================

alter table public.reports add column if not exists municipio text;
alter table public.claims  add column if not exists municipio text;

create index if not exists reports_municipio_idx on public.reports (municipio);
create index if not exists claims_municipio_idx  on public.claims  (municipio);

-- La vista expande r.* al momento de crearse: hay que recrearla para que
-- incluya la columna nueva (create or replace no permite insertar columnas
-- antes de verification_count).
drop view if exists public.reports_with_verifications;
create view public.reports_with_verifications as
  select
    r.*,
    count(v.id)::int as verification_count
  from public.reports r
  left join public.verifications v on v.report_id = r.id
  group by r.id;
