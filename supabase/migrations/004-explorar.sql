-- ============================================================
-- MENDOZA RESPIRA — Migración 004: explorador interactivo
-- Estadísticas agregadas por departamento (para colorear el mapa sin
-- descargar todos los reportes) y reportes nuevos en tiempo real.
-- ============================================================

create or replace view public.municipio_stats
with (security_invoker = true) as
  select
    r.municipio,
    count(*)::int                                                       as total,
    count(*) filter (where r.status = 'verified')::int                  as verified,
    count(*) filter (where r.ai_risk in ('alta', 'critica'))::int       as high_risk,
    count(*) filter (where r.created_at > now() - interval '30 days')::int as last_30d,
    coalesce(sum(v.n), 0)::int                                          as confirmations,
    max(r.created_at)                                                   as last_report_at
  from public.reports r
  left join (
    select report_id, count(*) as n from public.verifications group by report_id
  ) v on v.report_id = r.id
  where r.municipio is not null
  group by r.municipio;

grant select on public.municipio_stats to anon, authenticated;

-- Índice para paginar el feed por fecha dentro de un departamento
create index if not exists reports_municipio_created_idx
  on public.reports (municipio, created_at desc);

-- Tiempo real: el feed recibe los reportes nuevos sin recargar
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
end $$;
