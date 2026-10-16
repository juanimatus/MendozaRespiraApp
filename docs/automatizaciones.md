# Automatizaciones con n8n o Make

Cada reporte ciudadano (`reports`) y cada reclamo (`claims`) nuevo dispara un POST a
la URL que configures. Con eso se arma, sin tocar la app, el circuito
ciudadano → municipio: aviso a la oficina de arbolado que corresponde, registro en
una planilla y resumen semanal.

## 1. Activar el webhook

1. Corré `supabase/migrations/002-webhook-nuevos-reportes.sql` en el SQL Editor.
2. Creá el disparador en tu herramienta:
   - **n8n**: nodo *Webhook*, método POST, copiá la *Production URL*.
   - **Make**: módulo *Webhooks → Custom webhook*, copiá la URL.
3. Guardá la URL y un secreto en Supabase:

```sql
insert into public.app_config (key, value) values
  ('webhook_url',    'https://TU-N8N/webhook/mendoza-respira'),
  ('webhook_secret', 'un-texto-largo-y-aleatorio')
on conflict (key) do update set value = excluded.value;
```

Para apagarlo: `delete from public.app_config where key = 'webhook_url';`

## 2. Qué llega

Header `X-Webhook-Secret` con el secreto (validalo en el primer nodo) y este cuerpo:

```json
{
  "event": "insert",
  "table": "reports",
  "record": {
    "id": "3f6c…",
    "created_at": "2026-10-20T14:03:11Z",
    "lat": -33.0489, "lng": -68.5653,
    "address": "San Martín 450, Palmira",
    "municipio": "San Martín",
    "type": "tocon",
    "comment": "Cortaron dos árboles frente a la escuela",
    "photo_url": "https://….supabase.co/storage/v1/object/public/report-photos/…",
    "status": "pending"
  },
  "maps_url": "https://www.google.com/maps?q=-33.0489,-68.5653"
}
```

`reporter_id` no se envía. Para `claims` el `record` trae `description`, `ai_category`,
`ai_urgency` y `ai_area` en lugar de `type`.

## 3. Flujo sugerido

1. **Webhook**, y después un **IF** que descarte el pedido si `X-Webhook-Secret` no coincide.
2. **Google Sheets → Append row** en una planilla "Reportes" (fecha, departamento, tipo,
   dirección, link a la foto y al mapa). Sirve de respaldo y de evidencia de impacto.
3. **Buscar el contacto del municipio** en otra hoja "Municipios"
   (`municipio`, `email`, `whatsapp`), usando `record.municipio`.
4. **Enviar el aviso** por email o WhatsApp con la foto, el tipo, la dirección y `maps_url`.
5. Opcional: un segundo flujo **programado los lunes** que lea `/api/datos/reportes?format=csv`
   y mande a cada municipio el resumen de la semana.

Los avisos salen desde la base de datos, así que funcionan igual si el reporte se
carga desde la app, desde la API o a mano.
