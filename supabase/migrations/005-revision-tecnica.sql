-- ============================================================
-- MENDOZA RESPIRA — Migración 005: revisión técnica de reportes
-- Un ingeniero agrónomo (rol inspector o admin) revisa cada reporte y
-- fija el nivel de riesgo. Su criterio prevalece sobre el de la IA.
-- ============================================================

alter table public.reports add column if not exists review_risk text
  check (review_risk in ('ninguna', 'baja', 'media', 'alta', 'critica'));
alter table public.reports add column if not exists review_note text;
alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists reviewed_by uuid references auth.users (id);

create index if not exists reports_pending_review_idx
  on public.reports (created_at desc) where reviewed_at is null;

-- Solo inspectores y admins pueden revisar. Se hace por función para no
-- abrir el update de toda la tabla a usuarios autenticados.
create or replace function public.review_report(p_report uuid, p_risk text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('inspector', 'admin')
  ) then
    raise exception 'Solo inspectores o administradores pueden revisar reportes'
      using errcode = '42501';
  end if;

  update public.reports set
    review_risk = p_risk,
    review_note = nullif(trim(p_note), ''),
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    status      = 'verified'
  where id = p_report;

  if not found then
    raise exception 'Reporte inexistente' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.review_report(uuid, text, text) from public;
grant execute on function public.review_report(uuid, text, text) to authenticated;

-- Riesgo vigente: el del técnico si existe, si no el de la IA.
-- La vista expande r.* al crearse: recrearla para sumar las columnas nuevas.
drop view if exists public.reports_with_verifications;
create view public.reports_with_verifications as
  select
    r.*,
    coalesce(r.review_risk, r.ai_risk) as risk,
    count(v.id)::int                   as verification_count
  from public.reports r
  left join public.verifications v on v.report_id = r.id
  group by r.id;

grant select on public.reports_with_verifications to anon, authenticated;

create or replace view public.municipio_stats
with (security_invoker = true) as
  select
    r.municipio,
    count(*)::int                                                       as total,
    count(*) filter (where r.status = 'verified')::int                  as verified,
    count(*) filter (where coalesce(r.review_risk, r.ai_risk) in ('alta', 'critica'))::int as high_risk,
    count(*) filter (where r.created_at > now() - interval '30 days')::int as last_30d,
    coalesce(sum(v.n), 0)::int                                          as confirmations,
    max(r.created_at)                                                   as last_report_at
  from public.reports r
  left join (
    select report_id, count(*) as n from public.verifications group by report_id
  ) v on v.report_id = r.id
  where r.municipio is not null
  group by r.municipio;
