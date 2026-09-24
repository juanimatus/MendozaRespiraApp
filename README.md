# 🌳 Mendoza Respira AI

Plataforma civic/GovTech para el arbolado urbano de Mendoza, Argentina. Combina un canal
ciudadano para reportar tocones y talas ilegales con un panel municipal de inventario y
priorización del arbolado asistido por reglas de IA.

La app tiene **dos frentes** que conviven en el mismo Next.js, separados por un selector
de rol (guardado en `localStorage`, sin login):

| Rol | Qué ve |
|-----|--------|
| **Ciudadano** | Mapa de reportes, formulario para reportar un tocón/tala, página "Acerca" |
| **Inspector / Admin** (municipal) | Dashboard, inventario de árboles, reclamos clasificados por IA, herramienta de inspección |

---

## Stack

| Capa       | Tecnología                              |
|------------|------------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind |
| Animación  | Motion (Framer Motion)                  |
| Mapas      | Leaflet + react-leaflet + OpenStreetMap |
| Backend    | Supabase (PostgreSQL + Storage + RLS)   |
| Analytics  | Vercel Analytics                        |

No hay proveedor de IA externo conectado: la "IA" (`src/lib/ai-engine.ts`) es un motor de
reglas determinístico (arboricultura + heurísticas de riesgo) pensado para ser reemplazado
por un modelo real (ej. GPT-4o Vision) manteniendo las mismas firmas de entrada/salida.

### PWA / mobile

La app es instalable en el teléfono (Agregar a pantalla de inicio, Android/iOS):

- `public/manifest.json` — nombre, ícono, `display: standalone`, arranca en `/mapa`.
- `public/icons/` — íconos generados desde `public/icons/icon-source.svg` (192, 512 y
  versión maskable). Para regenerarlos: `npm install sharp --no-save && node scripts/generate-icons.js`
  (sharp no es una dependencia permanente del proyecto, se instala solo para correr el script).
- `public/sw.js` — service worker mínimo: cachea el shell y los assets hasheados de
  `/_next/static/`, deja pasar sin tocar cualquier request a Supabase, y sirve
  `public/offline.html` como fallback si no hay red. Se registra desde
  `src/components/ServiceWorkerRegister.tsx`, **solo en producción** (en `next dev` los
  chunks cambian todo el tiempo y un SW cacheando de más pelea con el hot reload).
- Todos los headers/paneles fijos (`SideMenu`, headers `sticky`, hojas modales) suman
  `env(safe-area-inset-top/bottom)` a su padding para no quedar debajo del notch o la
  home indicator cuando la app corre en modo standalone.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── mapa/page.tsx            ← Mapa ciudadano de reportes
│   ├── reportar/page.tsx        ← Formulario de nuevo reporte
│   ├── acerca/page.tsx          ← Onboarding / info del proyecto
│   ├── dashboard/page.tsx       ← Panel municipal: stats generales
│   ├── inventario/page.tsx      ← Inventario de árboles + análisis IA
│   ├── reclamos/page.tsx        ← Reclamos ciudadanos clasificados por IA
│   ├── inspector/page.tsx       ← Demo de análisis de árbol (visión + prioridad)
│   └── api/reports/route.ts     ← API REST de reportes ciudadanos
├── components/
│   ├── layout/SideMenu.tsx      ← Menú lateral + selector de rol
│   ├── map/MapView.tsx          ← Mapa Leaflet con pins
│   └── reports/ReportDetailModal.tsx
├── lib/
│   ├── supabase.ts              ← Cliente Supabase + deviceId anónimo
│   ├── reports.ts               ← Operaciones sobre reportes (MVP ciudadano)
│   ├── trees.ts                 ← Operaciones sobre árboles/reclamos (módulo AI)
│   ├── ai-engine.ts             ← Motor de reglas: visión, clasificación, prioridad
│   └── role-context.tsx         ← Contexto de rol activo (ciudadano/inspector/admin)
└── types/
    ├── index.ts                 ← Tipos del MVP (reports, verifications)
    └── trees.ts                 ← Tipos del módulo AI (trees, claims, resultados IA)
supabase/
├── schema.sql                   ← Schema base: reports, verifications
└── schema-ai.sql                ← Schema extendido: trees, claims, stats
```

> Nota: `src/app` y `src/app/api` contienen carpetas vacías con nombres literales de un
> `mkdir` con brace-expansion que no se expandió en Windows (ej. `{dashboard,inventario,...}`).
> Son basura sin uso — se pueden borrar sin afectar nada; las rutas reales son las listadas
> arriba. Los endpoints `api/trees`, `api/claims` y `api/ai/*` mencionados en versiones
> anteriores de este README nunca se implementaron: hoy `dashboard`, `inventario`, `reclamos`
> e `inspector` llaman directo a `lib/trees.ts` y `lib/ai-engine.ts` desde el cliente.

---

## Setup en 5 pasos

### 1. Clonar e instalar

```bash
git clone https://github.com/juanimatus/MendozaRespiraApp.git
cd MendozaRespiraApp
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Elegir región **South America (São Paulo)**
3. Guardar la URL y la `anon key`

### 3. Ejecutar el schema SQL

En tu proyecto de Supabase → **SQL Editor**, ejecutar en orden:

1. `supabase/schema.sql` — tablas `reports` / `verifications`, vista
   `reports_with_verifications`, políticas RLS y bucket de Storage `report-photos`.
2. `supabase/schema-ai.sql` — tablas `trees` / `claims` / `tree_interventions`, vistas
   `tree_stats` / `claims_stats` y sus políticas RLS.

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu_anon_key...
```

### 5. Correr localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El rol activo por defecto es
**ciudadano**; se cambia desde el menú lateral (ícono ☰) → selector "Perfil activo".

Otros scripts: `npm run build`, `npm run start`, `npm run lint`.

---

## Flujo ciudadano

```
Abrir app (rol: ciudadano)
   └─→ Mapa con todos los reportes
         ├─→ Click en pin → Modal con foto, tipo, fecha, verificaciones
         │     └─→ Botón "Confirmo que existe" → incrementa contador
         └─→ Botón "Reportar tocón"
               └─→ Formulario:
                     1. Tocar para agregar foto (cámara o galería)
                     2. Seleccionar tipo (tocón / árbol talado / sospecha)
                     3. Capturar ubicación GPS
                     4. Comentario opcional
                     5. Enviar → aparece en el mapa
```

## Flujo municipal (rol inspector / admin)

```
Cambiar rol → Inspector / Administrador
   ├─→ Dashboard      → stats de árboles y reclamos, priority score promedio
   ├─→ Inventario     → lista de árboles, filtro por estado sanitario,
   │                     análisis de IA (score de salud, riesgos, recomendación)
   ├─→ Reclamos IA    → reclamos ciudadanos ya clasificados (categoría, urgencia,
   │                     área) al momento de crearse, con cambio de estado
   └─→ Inspector      → demo: análisis de visión + prioridad + especies nativas
                         recomendadas sobre árboles de ejemplo
```

---

## Decisiones de diseño

- **Sin autenticación real**: los roles son un selector local, no hay backend de permisos.
  Pensado para demo/prototipo, no para producción con datos sensibles.
- **Reportes ciudadanos anónimos**: un UUID en `localStorage` identifica el dispositivo
  para evitar doble-verificación, sin recolectar datos personales.
- **Foto obligatoria** en los reportes: es la evidencia principal, se sube directo a
  Supabase Storage.
- **IA simulada, no conectada**: `ai-engine.ts` usa reglas de arboricultura reales
  (factores de riesgo, especie nativa/exótica, cercanía a escuela/hospital/acequia) en
  vez de un modelo externo. Facilita demostrar el flujo sin costo de API ni latencia.
- **Mapa abierto**: OpenStreetMap, sin costo, sin API key necesaria.

---

## Estado conocido / próximos pasos

- [ ] Limpiar las carpetas vacías con nombres literales `{...}` bajo `src/app` y `src/app/api`
- [ ] Conectar `ai-engine.ts` a un modelo de visión real (GPT-4o Vision u otro) para
      `inventario` e `inspector`, o mover la lógica a API routes server-side
- [ ] Autenticación real para los roles inspector/admin (hoy son de confianza total)
- [ ] Moderación de reportes ciudadanos (estado `pending/verified`)
- [ ] Exportar árboles/reclamos a GeoJSON / CSV para organismos ambientales
- [ ] Subir la versión del service worker (`CACHE_VERSION` en `public/sw.js`) cada vez que
      cambie qué se precachea, para forzar la limpieza de caches viejos en clientes instalados

---

## Contribuir

Proyecto de civic tech. Los PRs son bienvenidos.
