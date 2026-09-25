-- ============================================================
-- MENDOZA RESPIRA AI — Auth schema
-- Ejecutar en Supabase → SQL Editor DESPUÉS del schema-ai.sql
-- ============================================================

-- Tabla de perfiles: mapea auth.users → rol
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email      text,
  full_name  text,
  role       text not null default 'ciudadano'
             check (role in ('ciudadano', 'inspector', 'admin')),
  municipio  text default 'Mendoza'
);

-- RLS
alter table public.profiles enable row level security;

create policy "Perfil propio: lectura"
  on public.profiles for select using (auth.uid() = id);

-- El usuario puede editar su perfil pero NO su rol (evita escalada de privilegios)
create policy "Perfil propio: update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- Inserción automática de perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'ciudadano'  -- nunca confiar en metadata del cliente; promover a mano en el dashboard
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Usuarios de demo (ejecutar después de crear la tabla)
-- Crear en Supabase Dashboard → Authentication → Users → Add user
-- Email: ciudadano@mendozarespira.ar  / Pass: Demo1234!  / role: ciudadano
-- Email: inspector@mendozarespira.ar  / Pass: Demo1234!  / role: inspector
-- Email: admin@mendozarespira.ar      / Pass: Demo1234!  / role: admin
--
-- O via SQL (solo si usás service_role key, no la anon):
-- select auth.sign_up('admin@mendozarespira.ar', 'Demo1234!', '{"role":"admin","full_name":"Admin Municipal"}');
