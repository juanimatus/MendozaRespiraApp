-- ============================================================
-- MENDOZA RESPIRA AI — Schema extendido
-- Ejecutar en Supabase → SQL Editor (después del schema base)
-- ============================================================

-- ── TABLA: trees (inventario digital del arbolado) ───────────────────────
create table public.trees (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Ubicación
  lat               double precision not null,
  lng               double precision not null,
  address           text,
  neighborhood      text,                          -- barrio
  zone              text,                          -- zona/distrito municipal

  -- Especie
  species           text not null,                 -- nombre científico
  common_name       text not null,                 -- nombre común
  is_native         boolean not null default false,
  is_exotic         boolean generated always as (not is_native) stored,

  -- Estado sanitario
  health_status     text not null default 'good'
                    check (health_status in ('excellent','good','fair','poor','critical')),
  estimated_age     int,                           -- años aproximados
  trunk_diameter    numeric(6,2),                  -- cm (DAP)
  height            numeric(5,1),                  -- metros estimados
  canopy_diameter   numeric(5,1),                  -- metros

  -- Riesgo
  priority_score    int not null default 0 check (priority_score between 0 and 100),
  risk_factors      jsonb default '[]',            -- array de factores de riesgo
  near_school       boolean not null default false,
  near_hospital     boolean not null default false,
  near_acequia      boolean not null default false, -- factor local mendocino
  traffic_level     text default 'low'
                    check (traffic_level in ('low','medium','high')),

  -- IA
  last_ai_analysis  jsonb,                         -- último resultado de visión computacional
  ai_analyzed_at    timestamptz,
  ai_recommendation text,

  -- Metadatos
  surveyed_by       text,                          -- inspector que relevó
  surveyed_at       timestamptz,
  photo_url         text,
  notes             text
);

create index trees_location_idx     on public.trees (lat, lng);
create index trees_neighborhood_idx on public.trees (neighborhood);
create index trees_priority_idx     on public.trees (priority_score desc);
create index trees_health_idx       on public.trees (health_status);
create index trees_species_idx      on public.trees (species);

-- ── TABLA: tree_interventions (historial de mantenimiento) ───────────────
create table public.tree_interventions (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  tree_id       uuid not null references public.trees(id) on delete cascade,

  type          text not null
                check (type in (
                  'poda', 'riego', 'tratamiento_fitosanitario',
                  'apuntalamiento', 'extraccion', 'plantacion',
                  'relevamiento', 'otro'
                )),
  description   text,
  performed_by  text,
  cost          numeric(10,2),
  photo_url     text,
  result        text check (result in ('successful','partial','failed'))
);

create index interventions_tree_idx on public.tree_interventions (tree_id);
create index interventions_type_idx on public.tree_interventions (type);

-- ── TABLA: claims (reclamos ciudadanos con IA) ───────────────────────────
create table public.claims (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),

  -- Origen
  tree_id         uuid references public.trees(id) on delete set null,
  lat             double precision,
  lng             double precision,
  address         text,
  photo_url       text,

  -- Contenido
  description     text not null,
  reporter_id     text,

  -- Clasificación IA
  ai_category     text,   -- rama_caida | raiz_levantada | plaga | stress_hidrico | otro
  ai_urgency      text check (ai_urgency in ('low','medium','high','critical')),
  ai_area         text,   -- poda | riego | fitosanitario | obras | emergencia
  ai_summary      text,
  ai_confidence   numeric(4,2),

  -- Estado
  status          text not null default 'pending'
                  check (status in ('pending','classified','assigned','in_progress','resolved','dismissed')),
  assigned_to     text,
  resolved_at     timestamptz,
  resolution_note text
);

create index claims_status_idx  on public.claims (status);
create index claims_urgency_idx on public.claims (ai_urgency);
create index claims_tree_idx    on public.claims (tree_id);

-- ── RLS (mismo patrón que las tablas existentes) ─────────────────────────
alter table public.trees enable row level security;
create policy "Lectura pública de árboles"   on public.trees for select using (true);
create policy "Inserción abierta de árboles" on public.trees for insert with check (true);
create policy "Update abierto de árboles"    on public.trees for update using (true);

alter table public.tree_interventions enable row level security;
create policy "Lectura pública de intervenciones"   on public.tree_interventions for select using (true);
create policy "Inserción abierta de intervenciones" on public.tree_interventions for insert with check (true);

alter table public.claims enable row level security;
create policy "Lectura pública de reclamos"   on public.claims for select using (true);
create policy "Inserción abierta de reclamos" on public.claims for insert with check (true);
create policy "Update abierto de reclamos"    on public.claims for update using (true);

-- ── VISTA: stats para dashboard ──────────────────────────────────────────
create or replace view public.tree_stats as
select
  count(*)                                                    as total_trees,
  count(*) filter (where health_status in ('poor','critical')) as trees_at_risk,
  count(*) filter (where priority_score >= 70)                as high_priority,
  count(*) filter (where is_native)                           as native_trees,
  count(*) filter (where health_status = 'critical')          as critical_trees,
  round(avg(priority_score)::numeric, 1)                      as avg_priority_score,
  count(distinct neighborhood)                                as neighborhoods_covered
from public.trees;

create or replace view public.claims_stats as
select
  count(*)                                                     as total_claims,
  count(*) filter (where status = 'pending')                   as pending_claims,
  count(*) filter (where ai_urgency in ('high','critical'))    as urgent_claims,
  count(*) filter (where status = 'resolved')                  as resolved_claims,
  count(*) filter (where created_at > now() - interval '7d')  as claims_last_7_days
from public.claims;

-- ── DATOS FICTICIOS DE MENDOZA ───────────────────────────────────────────
-- Especies locales reales, barrios reales, puntos sensibles reales

insert into public.trees (
  lat, lng, address, neighborhood, zone,
  species, common_name, is_native,
  health_status, estimated_age, trunk_diameter, height, canopy_diameter,
  priority_score, risk_factors,
  near_school, near_hospital, near_acequia, traffic_level,
  ai_recommendation, surveyed_by, surveyed_at, notes
) values

-- Guaymallén: palmeras problemáticas (zona real con muchas palmeras)
(-32.8876, -68.8120, 'Av. San Martín 1240', 'Guaymallén', 'Zona Norte',
 'Phoenix canariensis', 'Palmera canaria', false,
 'poor', 35, 45.0, 12.0, 3.0,
 82, '["estres_hidrico","poca_sombra","especie_exotica","alto_consumo_agua"]',
 false, false, true, 'high',
 'Reemplazar por algarrobo blanco (Prosopis alba). Alta demanda hídrica en zona árida. Sin beneficio de sombra.',
 'Inspector García', now() - interval '15 days', 'Palmera exótica en zona de acequia. Raíces afectan infraestructura.'),

(-32.8881, -68.8118, 'Av. San Martín 1280', 'Guaymallén', 'Zona Norte',
 'Phoenix canariensis', 'Palmera canaria', false,
 'fair', 28, 38.0, 10.5, 2.8,
 74, '["estres_hidrico","poca_sombra","especie_exotica"]',
 false, false, true, 'high',
 'Candidata a extracción. Reemplazar por pimiento (Schinus molle), resistente a sequía y buena sombra.',
 'Inspector García', now() - interval '15 days', 'Segundo ejemplar del boulevard. Mismo diagnóstico.'),

-- Ciudad: frente a escuela (riesgo alto)
(-32.8932, -68.8450, 'Belgrano 456 (frente Escuela Patricias Mendocinas)', 'Ciudad', 'Zona Centro',
 'Morus alba', 'Morera blanca', false,
 'poor', 55, 68.0, 14.0, 9.0,
 91, '["ramas_secas","inclinacion_peligrosa","cerca_escuela","edad_avanzada"]',
 true, false, false, 'medium',
 'URGENTE: Árbol con inclinación de 15° hacia vereda escolar. Poda estructural inmediata o extracción preventiva.',
 'Inspector Rodríguez', now() - interval '5 days', 'Reporte ciudadano previo. Alto riesgo durante recreo.'),

-- Hospital Central: plátano en buen estado
(-32.8897, -68.8380, 'Alem 450 (frente Hospital Central)', 'Ciudad', 'Zona Centro',
 'Platanus × acerifolia', 'Plátano', false,
 'good', 40, 52.0, 16.0, 12.0,
 45, '["mantenimiento_regular"]',
 false, true, false, 'high',
 'Estado sanitario bueno. Poda de mantenimiento recomendada para ciclo otoño. Monitorear continuidad de riego.',
 'Inspector López', now() - interval '30 days', 'Ejemplar bien mantenido. Referencia para el sector.'),

-- Las Heras: algarrobo nativo excelente
(-32.8720, -68.8310, 'Boulogne Sur Mer 890', 'Las Heras', 'Zona Norte',
 'Prosopis alba', 'Algarrobo blanco', true,
 'excellent', 80, 85.0, 9.0, 14.0,
 15, '["especie_nativa","alta_resistencia"]',
 false, false, true, 'low',
 'Ejemplar nativo en excelente estado. Referencia para programa de reforestación con especies autóctonas.',
 'Inspector García', now() - interval '60 days', 'Árbol patrimonial. Evaluar declaración de protección especial.'),

-- Parque San Martín: jacarandá estresado
(-32.9012, -68.8590, 'Av. Boulogne Sur Mer (Parque San Martín)', 'Ciudad', 'Zona Oeste',
 'Jacaranda mimosifolia', 'Jacarandá', false,
 'fair', 30, 31.0, 11.0, 8.0,
 58, '["estres_hidrico","suelo_compactado","temporada_seca"]',
 false, false, false, 'low',
 'Estrés hídrico visible en follaje. Aumentar frecuencia de riego en temporada seca. Airear suelo alrededor del tronco.',
 'Inspector Rodríguez', now() - interval '20 days', 'Zona de alto tránsito peatonal. Suelo muy compactado.'),

-- Godoy Cruz: fresno en buen estado
(-32.9234, -68.8421, 'San Lorenzo 1100', 'Godoy Cruz', 'Zona Sur',
 'Fraxinus americana', 'Fresno americano', false,
 'good', 25, 28.0, 12.0, 7.0,
 32, '["crecimiento_vigoroso"]',
 false, false, true, 'medium',
 'Ejemplar joven en buen estado. Continuar riego regular. Programar poda formativa en 2 años.',
 'Inspector López', now() - interval '45 days', 'Acequia lateral ayuda al riego natural.'),

-- Maipú: chañar nativo con plaga
(-32.9810, -68.7890, 'Ozamis 234', 'Maipú', 'Zona Este',
 'Geoffroea decorticans', 'Chañar', true,
 'fair', 45, 22.0, 6.0, 5.0,
 63, '["plaga_insectos","especie_nativa","requiere_tratamiento"]',
 false, false, false, 'low',
 'Presencia de cochinilla en ramas secundarias. Tratamiento fitosanitario con aceite mineral. Especie nativa valiosa: preservar.',
 'Inspector García', now() - interval '10 days', 'Único chañar relevado en el sector. Coordinar con vecinos para tratamiento.'),

-- Ciudad: pimiento en estado crítico
(-32.8850, -68.8200, 'España 678', 'Ciudad', 'Zona Centro',
 'Schinus molle', 'Pimiento', true,
 'critical', 70, 91.0, 11.0, 10.0,
 95, '["ramas_secas","cavidades_tronco","riesgo_caida","edad_avanzada","cerca_circulacion"]',
 false, false, false, 'high',
 'CRÍTICO: Árbol con cavidades profundas en tronco y tres ramas secas de más de 10cm. Riesgo de caída inminente. Extracción urgente.',
 'Inspector Rodríguez', now() - interval '2 days', 'Vecinos reportaron caída de ramas menores. Delimitar zona de seguridad.'),

-- Guaymallén: retamo nativo nuevo
(-32.8799, -68.8067, 'Av. Acceso Este km 2.5', 'Guaymallén', 'Zona Este',
 'Bulnesia retama', 'Retamo', true,
 'good', 12, 8.0, 4.0, 2.5,
 20, '["especie_nativa","plantacion_reciente","resistente_sequia"]',
 false, false, false, 'high',
 'Plantación reciente exitosa. Especie nativa del Monte mendocino. Requiere riego de establecimiento por 2 años más.',
 'Inspector López', now() - interval '90 days', 'Parte del plan piloto de revegetación con nativas. Monitorear mensualmente.');

-- ── DATOS FICTICIOS: intervenciones ──────────────────────────────────────
-- (se insertan con referencias a los IDs generados, simplificado para el seed)
insert into public.tree_interventions (tree_id, type, description, performed_by, result)
select id, 'relevamiento', 'Relevamiento inicial del ejemplar. Registro fotográfico y medición de DAP.', 'Inspector García', 'successful'
from public.trees where common_name = 'Algarrobo blanco' limit 1;

insert into public.tree_interventions (tree_id, type, description, performed_by, result)
select id, 'poda', 'Poda de mantenimiento. Eliminación de ramas cruzadas y mejora de arquitectura.', 'Inspector López', 'successful'
from public.trees where common_name = 'Plátano' limit 1;

insert into public.tree_interventions (tree_id, type, description, performed_by, result)
select id, 'tratamiento_fitosanitario', 'Aplicación de aceite mineral al 2% en ramas afectadas por cochinilla.', 'Inspector García', 'partial'
from public.trees where common_name = 'Chañar' limit 1;

-- ── DATOS FICTICIOS: reclamos ciudadanos ─────────────────────────────────
insert into public.claims (
  lat, lng, address, description,
  ai_category, ai_urgency, ai_area, ai_summary, ai_confidence,
  status
) values
(-32.8932, -68.8450, 'Belgrano 456', 
 'Hay una rama enorme inclinada sobre la entrada de la escuela, da miedo que caiga sobre los chicos a la salida.',
 'rama_peligrosa', 'critical', 'emergencia',
 'Rama estructural con inclinación crítica en zona escolar. Intervención de emergencia requerida.',
 0.94, 'classified'),

(-32.8876, -68.8120, 'Av. San Martín 1240',
 'La palmera de la esquina tiene las hojas todas amarillas y secas desde hace meses',
 'estres_hidrico', 'medium', 'riego',
 'Síntomas de estrés hídrico severo. Especie exótica de alto consumo en zona árida.',
 0.87, 'classified'),

(-32.8850, -68.8200, 'España 678',
 'Cayó una rama grande anoche en la vereda, casi lastima a una señora. El árbol tiene el tronco hueco.',
 'rama_caida', 'critical', 'emergencia',
 'Caída de rama confirmada. Tronco comprometido. Riesgo de colapso total. Emergencia arboricultural.',
 0.96, 'assigned'),

(-32.9012, -68.8590, 'Parque San Martín sector jacarandás',
 'Los jacarandás del parque están todos con las hojas chicas y amarillentas, no están bien',
 'estres_hidrico', 'medium', 'riego',
 'Posible déficit hídrico estacional. Revisar sistema de riego en el sector.',
 0.79, 'pending'),

(-32.9810, -68.7890, 'Ozamis 234',
 'El árbol tiene unos bichos blancos pegados en las ramas que se están propagando',
 'plaga', 'high', 'fitosanitario',
 'Infestación de cochinilla detectada. Tratamiento fitosanitario urgente para prevenir propagación.',
 0.91, 'in_progress');
