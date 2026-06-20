# 🌿 Mendoza Respira — MVP

Aplicación de civic tech para mapear tocones de árboles talados ilegalmente en Mendoza, Argentina.

## Stack

| Capa      | Tecnología                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14 (App Router), Tailwind |
| Mapas     | Leaflet + OpenStreetMap           |
| Backend   | Supabase (PostgreSQL + Storage)   |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── mapa/page.tsx          ← Vista principal del mapa
│   ├── reportar/page.tsx      ← Formulario de nuevo reporte
│   └── api/reports/route.ts   ← API REST opcional
├── components/
│   ├── map/MapView.tsx        ← Mapa Leaflet con pins
│   └── reports/
│       └── ReportDetailModal.tsx  ← Modal al clickear un pin
├── lib/
│   ├── supabase.ts            ← Cliente Supabase + deviceId
│   └── reports.ts             ← Todas las operaciones de BD
└── types/index.ts             ← Tipos TypeScript centrales
supabase/
└── schema.sql                 ← Schema completo para ejecutar en Supabase
```

---

## Setup en 5 pasos

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-org/mendoza-respira.git
cd mendoza-respira
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Elegir región **South America (São Paulo)**
3. Guardar la URL y la `anon key`

### 3. Ejecutar el schema SQL

En tu proyecto de Supabase → **SQL Editor** → pegar y ejecutar el contenido de `supabase/schema.sql`.

Esto crea:
- Tabla `reports`
- Tabla `verifications`
- Vista `reports_with_verifications`
- Políticas de Row Level Security
- Bucket de Storage `report-photos`

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

Abrir [http://localhost:3000](http://localhost:3000) → redirige automáticamente al mapa.

---

## Flujo de usuario

```
Abrir app
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

---

## Decisiones de diseño del MVP

- **Sin autenticación**: Los reportes son anónimos. Un UUID en `localStorage` identifica el dispositivo para evitar doble-verificación.
- **Foto obligatoria**: Es la evidencia principal. Se sube directamente a Supabase Storage.
- **Sin roles**: Cualquiera puede reportar y verificar. Los estados `pending/verified` son para iteraciones futuras.
- **Mapa abierto**: OpenStreetMap, sin costo, sin API key necesaria.

---

## Próximos pasos post-MVP

- [ ] Moderación: panel para marcar reportes como verificados
- [ ] Autenticación opcional (para reportes más confiables)
- [ ] Notificaciones push cuando hay nuevos reportes en tu zona
- [ ] Exportar reportes a GeoJSON / CSV para organismos ambientales
- [ ] PWA completa para instalar en celular

---

## Contribuir

Este es un proyecto civic tech. Los PRs son bienvenidos.
Contacto: [info@mendozarespira.ar](mailto:info@mendozarespira.ar)
