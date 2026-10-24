-- ============================================================
-- MENDOZA RESPIRA — Migración 009: origen del GPS
-- Guarda la ubicación real del GPS al crear el reporte, aparte del punto
-- que el vecino marca en el mapa. Así el técnico ve cuánto se corrió el pin.
-- Correr en Supabase → SQL Editor.
-- ============================================================

alter table public.reports add column if not exists gps_lat double precision;
alter table public.reports add column if not exists gps_lng double precision;

-- Distancia (en metros) entre el GPS y el punto marcado, para la revisión.
-- Haversine simple; null si falta el origen del GPS.
create or replace function public.gps_offset_m(r public.reports)
returns integer
language sql
stable
as $$
  select case
    when r.gps_lat is null or r.gps_lng is null then null
    else round(
      6371000 * 2 * asin(sqrt(
        power(sin(radians(r.lat - r.gps_lat) / 2), 2) +
        cos(radians(r.gps_lat)) * cos(radians(r.lat)) *
        power(sin(radians(r.lng - r.gps_lng) / 2), 2)
      ))
    )::int
  end;
$$;
