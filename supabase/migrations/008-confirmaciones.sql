-- ============================================================
-- MENDOZA RESPIRA — Migración 008: confirmaciones confiables
-- 1. Quien subió un reporte no puede confirmarlo (ni desde su dispositivo
--    ni desde su misma IP).
-- 2. Una sola confirmación por IP en cada reporte.
-- Correr en Supabase → SQL Editor (requiere la 007).
-- ============================================================

-- Registro privado de qué IP participó en cada reporte (hash, nunca la IP en
-- claro). RLS activo y sin políticas: no se lee desde la API pública.
create table if not exists public.report_ip_guard (
  report_id  uuid not null references public.reports (id) on delete cascade,
  ip_hash    text not null,
  role       text not null check (role in ('autor', 'confirmacion')),
  created_at timestamptz not null default now(),
  primary key (report_id, ip_hash)
);
alter table public.report_ip_guard enable row level security;

create or replace function public.request_ip_hash()
returns text
language sql
stable
as $$
  select md5(trim(coalesce(
    (nullif(current_setting('request.headers', true), '')::jsonb) ->> 'cf-connecting-ip',
    split_part((nullif(current_setting('request.headers', true), '')::jsonb) ->> 'x-forwarded-for', ',', 1),
    'desconocida')));
$$;

-- Al crear un reporte se guarda la IP del autor
create or replace function public.guard_report_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_ip_guard (report_id, ip_hash, role)
  values (new.id, public.request_ip_hash(), 'autor')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists reports_ip_guard on public.reports;
create trigger reports_ip_guard
  after insert on public.reports
  for each row execute function public.guard_report_author();

-- Al confirmar: ni el autor ni una IP que ya participó
create or replace function public.guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ip_h     text := public.request_ip_hash();
  existing text;
begin
  if exists (select 1 from public.reports r
             where r.id = new.report_id and r.reporter_id = new.verifier_id) then
    raise exception 'No podés confirmar un reporte que subiste vos.'
      using errcode = 'P0001', hint = 'own_report';
  end if;

  -- Sin IP conocida (por ejemplo, desde el SQL Editor) no se limita
  if ip_h = md5('desconocida') then
    return new;
  end if;

  select role into existing from public.report_ip_guard
  where report_id = new.report_id and ip_hash = ip_h;

  if existing = 'autor' then
    raise exception 'No podés confirmar un reporte que subiste vos.'
      using errcode = 'P0001', hint = 'own_report';
  elsif existing is not null then
    raise exception 'Desde esta conexión ya se confirmó este reporte.'
      using errcode = 'P0001', hint = 'already_confirmed';
  end if;

  insert into public.report_ip_guard (report_id, ip_hash, role)
  values (new.report_id, ip_h, 'confirmacion');
  return new;
end $$;

drop trigger if exists verifications_ip_guard on public.verifications;
create trigger verifications_ip_guard
  before insert on public.verifications
  for each row execute function public.guard_verification();
