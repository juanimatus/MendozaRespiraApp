-- ============================================================
-- MENDOZA RESPIRA — Migración 006: nuevos tipos de reporte
-- "Rama peligrosa" y "Árbol seco".
-- ============================================================

alter table public.reports drop constraint if exists reports_type_check;
alter table public.reports add constraint reports_type_check check (type in (
  'tocon', 'arbol_talado', 'sospecha',
  'arbol_peligroso', 'falta_frentista', 'parada_sin_arbol',
  'rama_peligrosa', 'arbol_seco'
));
