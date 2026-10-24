-- ============================================================
-- Limpiar reportes de prueba antes de la demo
-- Correr en Supabase → SQL Editor, de a un paso.
-- Las verificaciones de cada reporte se borran solas (on delete cascade).
-- ============================================================

-- ── PASO 1: mirar qué hay ───────────────────────────────────────────────
-- Lista todos los reportes; "parece_prueba" marca los sospechosos:
-- comentario con palabras de prueba, fuera de Mendoza o sin departamento.
select
  id, created_at, type, municipio, address, left(comment, 60) as comment, status,
  (
    comment ~* '\m(test|testing|prueba|probando|asdf|qwerty|demo|borrar|xxx)\M'
    or lat not between -37.6 and -32.0
    or lng not between -70.6 and -66.45
    or municipio is null
  ) as parece_prueba
from public.reports
order by parece_prueba desc, created_at;


-- ── PASO 2: borrar ──────────────────────────────────────────────────────
-- Elegí UNA de las opciones y descomentala.

-- Opción A: borrar solo los marcados como prueba en el paso 1.
-- delete from public.reports
-- where comment ~* '\m(test|testing|prueba|probando|asdf|qwerty|demo|borrar|xxx)\M'
--    or lat not between -37.6 and -32.0
--    or lng not between -70.6 and -66.45
--    or municipio is null
-- returning id, type, municipio, comment;

-- Opción B: borrar por id los que elijas a mano del paso 1.
-- delete from public.reports
-- where id in (
--   'pegá-acá-el-id-1',
--   'pegá-acá-el-id-2'
-- )
-- returning id, type, municipio, comment;

-- Opción C: empezar de cero (borra TODOS los reportes cargados antes de
-- esta fecha). Cambiá la fecha si querés conservar algo reciente.
-- delete from public.reports
-- where created_at < '2026-10-24 00:00:00-03'
-- returning id, type, municipio, comment;


-- ── PASO 3 (opcional): resetear el límite de envíos por IP ───────────────
-- Así podés cargar varios reportes seguidos al grabar el video.
-- delete from public.rate_log;
