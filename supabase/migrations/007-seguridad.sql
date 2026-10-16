-- ============================================================
-- MENDOZA RESPIRA — Migración 007: seguridad del backend
-- 1. Solo inspectores y admins editan reclamos e inventario de árboles.
-- 2. Límite de reportes y confirmaciones por IP; fotos solo imagen y ≤ 10 MB.
-- 3. El técnico puede descartar reportes (fotos con personas, spam, etc.).
-- ============================================================

-- ── Rol del usuario actual ────────────────────────────────────────────────
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('inspector', 'admin')
  );
$$;

grant execute on function public.is_staff() to anon, authenticated;

-- ── 1. Reclamos e inventario: escritura solo para staff ───────────────────
drop policy if exists "Update abierto de reclamos" on public.claims;
drop policy if exists "Staff actualiza reclamos" on public.claims;
create policy "Staff actualiza reclamos"
  on public.claims for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Update abierto de árboles" on public.trees;
drop policy if exists "Inserción abierta de árboles" on public.trees;
drop policy if exists "Staff actualiza árboles" on public.trees;
create policy "Staff actualiza árboles"
  on public.trees for update using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Staff carga árboles" on public.trees;
create policy "Staff carga árboles"
  on public.trees for insert with check (public.is_staff());

drop policy if exists "Inserción abierta de intervenciones" on public.tree_interventions;
drop policy if exists "Staff carga intervenciones" on public.tree_interventions;
create policy "Staff carga intervenciones"
  on public.tree_interventions for insert with check (public.is_staff());

-- ── 2. Límite por IP ──────────────────────────────────────────────────────
-- Registro privado (sin políticas: nadie lo lee desde la API). Guarda un
-- hash de la IP, nunca la IP en claro.
create table if not exists public.rate_log (
  ip_hash    text        not null,
  kind       text        not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_log_lookup_idx on public.rate_log (kind, ip_hash, created_at desc);
alter table public.rate_log enable row level security;

create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  headers jsonb := nullif(current_setting('request.headers', true), '')::jsonb;
  ip      text  := coalesce(
                     headers ->> 'cf-connecting-ip',
                     split_part(headers ->> 'x-forwarded-for', ',', 1),
                     'desconocida');
  ip_h    text  := md5(trim(ip));
  max_n   int   := case tg_table_name when 'reports' then 10 else 60 end;
  recent  int;
begin
  -- Staff (carga masiva del municipio) no tiene límite
  if public.is_staff() then
    return new;
  end if;

  select count(*) into recent
  from public.rate_log
  where kind = tg_table_name and ip_hash = ip_h
    and created_at > now() - interval '1 hour';

  if recent >= max_n then
    raise exception 'Demasiados envíos seguidos. Probá de nuevo en un rato.'
      using errcode = 'P0001', hint = 'rate_limit';
  end if;

  insert into public.rate_log (ip_hash, kind) values (ip_h, tg_table_name);
  delete from public.rate_log where created_at < now() - interval '1 day';
  return new;
end $$;

drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_rate_limit();

drop trigger if exists verifications_rate_limit on public.verifications;
create trigger verifications_rate_limit
  before insert on public.verifications
  for each row execute function public.enforce_rate_limit();

-- Fotos: solo imágenes y hasta 10 MB
update storage.buckets
set file_size_limit    = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
where id = 'report-photos';

-- ── 3. Descartar reportes ─────────────────────────────────────────────────
alter table public.reports add column if not exists hidden boolean not null default false;
alter table public.reports add column if not exists hidden_reason text;

drop policy if exists "Lectura pública de reportes" on public.reports;
create policy "Lectura pública de reportes"
  on public.reports for select using (not hidden or public.is_staff());

create or replace function public.hide_report(p_report uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Solo inspectores o administradores pueden descartar reportes'
      using errcode = '42501';
  end if;
  update public.reports
  set hidden = true, hidden_reason = nullif(trim(p_reason), ''),
      reviewed_at = now(), reviewed_by = auth.uid()
  where id = p_report;
  if not found then
    raise exception 'Reporte inexistente' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.hide_report(uuid, text) from public;
grant execute on function public.hide_report(uuid, text) to authenticated;

-- La revisión técnica usa el mismo chequeo de rol
create or replace function public.review_report(p_report uuid, p_risk text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
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

-- Las vistas públicas excluyen los descartados (la vista corre con permisos
-- de su dueño, así que el filtro tiene que ir acá además de en la política)
drop view if exists public.reports_with_verifications;
create view public.reports_with_verifications as
  select
    r.*,
    coalesce(r.review_risk, r.ai_risk) as risk,
    count(v.id)::int                   as verification_count
  from public.reports r
  left join public.verifications v on v.report_id = r.id
  where not r.hidden
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
  where r.municipio is not null and not r.hidden
  group by r.municipio;
