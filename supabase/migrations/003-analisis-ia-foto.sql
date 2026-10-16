-- ============================================================
-- MENDOZA RESPIRA — Migración 003: análisis de la foto con IA
-- Nuevos tipos de reporte (árbol peligroso, falta de árboles en un frente,
-- parada de colectivo sin árbol) y columnas con el resultado del análisis.
-- ============================================================

alter table public.reports drop constraint if exists reports_type_check;
alter table public.reports add constraint reports_type_check check (type in (
  'tocon', 'arbol_talado', 'sospecha',
  'arbol_peligroso', 'falta_frentista', 'parada_sin_arbol'
));

alter table public.reports add column if not exists ai_risk text
  check (ai_risk in ('ninguna', 'baja', 'media', 'alta', 'critica'));
alter table public.reports add column if not exists ai_summary  text;
alter table public.reports add column if not exists ai_analysis jsonb;

create index if not exists reports_ai_risk_idx on public.reports (ai_risk);

-- La vista expande r.* al crearse: recrearla para sumar las columnas nuevas
drop view if exists public.reports_with_verifications;
create view public.reports_with_verifications as
  select
    r.*,
    count(v.id)::int as verification_count
  from public.reports r
  left join public.verifications v on v.report_id = r.id
  group by r.id;
