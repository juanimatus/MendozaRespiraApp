-- ============================================================
-- MENDOZA RESPIRA — Migración 002: webhook de reportes y reclamos nuevos
-- Cada insert en reports o claims hace un POST a una URL configurable
-- (un Webhook de n8n o un Custom webhook de Make). Ver docs/automatizaciones.md.
-- ============================================================

create extension if not exists pg_net;

-- Configuración privada: RLS activo y sin políticas, así que solo se lee
-- desde funciones security definer o desde el SQL Editor.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

create or replace function public.notify_new_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hook_url    text;
  hook_secret text;
begin
  select value into hook_url    from public.app_config where key = 'webhook_url';
  select value into hook_secret from public.app_config where key = 'webhook_secret';
  if hook_url is null or hook_url = '' then
    return new;
  end if;

  perform net.http_post(
    url     := hook_url,
    body    := jsonb_build_object(
                 'event',     'insert',
                 'table',     tg_table_name,
                 'record',    to_jsonb(new) - 'reporter_id',
                 'maps_url',  case when new.lat is not null
                                then format('https://www.google.com/maps?q=%s,%s', new.lat, new.lng)
                              end
               ),
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'X-Webhook-Secret', coalesce(hook_secret, '')
               )
  );
  return new;
exception when others then
  -- Un fallo del webhook nunca debe impedir que se guarde el reporte
  raise warning 'notify_new_record: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists reports_notify_insert on public.reports;
create trigger reports_notify_insert
  after insert on public.reports
  for each row execute function public.notify_new_record();

drop trigger if exists claims_notify_insert on public.claims;
create trigger claims_notify_insert
  after insert on public.claims
  for each row execute function public.notify_new_record();

-- Para activarlo (reemplazá la URL por la de tu Webhook de n8n o Make):
-- insert into public.app_config (key, value) values
--   ('webhook_url',    'https://TU-N8N/webhook/mendoza-respira'),
--   ('webhook_secret', 'un-texto-largo-y-aleatorio')
-- on conflict (key) do update set value = excluded.value;
