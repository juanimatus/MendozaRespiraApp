# Migraciones de Mendoza Respira

Se corren a mano en Supabase > SQL Editor, en orden numérico. Los archivos no se renombran una vez aplicados.

| Nº | Archivo | Qué hace | Estado |
|----|---------|----------|--------|
| 001 | 001-municipio.sql | Departamento en reportes | Aplicada |
| 002 | 002-webhook-nuevos-reportes.sql | Webhook a n8n/Make | Aplicada |
| 003 | 003-analisis-ia-foto.sql | Análisis IA de foto (en pausa, no visible al vecino) | Aplicada |
| 004 | 004-explorar.sql | Explorar Mendoza | Aplicada (16/10) |
| 005 | 005-revision-tecnica.sql | Revisión técnica por agrónomo | Aplicada (16/10) |
| 006 | 006-tipos-rama-seco.sql | Tipos "Rama peligrosa" y "Árbol seco" | Confirmada por Juani (16/10, sin verificar en BD) |
| 007 | 007-seguridad.sql | Seguridad: edición solo staff, límite por IP | Confirmada por Juani (16/10, sin verificar en BD) |
| 008 | 008-confirmaciones.sql | Confirmaciones de vecinos, 1 por IP (tabla `report_ip_guard`) | Aplicada (verificada: 5 filas) |
| 009 | 009-origen-gps.sql | Origen GPS del reporte (`gps_lat`, `gps_lng`) | Aplicada (verificada: columnas presentes) |

## Notas

- Las copias en `/mnt/project-files/mendoza-respira/sql/` usan otra numeración: `008-limpiar-reportes-prueba`, `009-confirmaciones`, `010-origen-gps` y `011-borrar-pruebas`. Mapeo: repo 008 = copia 009; repo 009 = copia 010. La limpieza de pruebas (copia 008 y 011) no es una migración: es un borrado manual que no se versiona.
- Antes de correr un SQL nuevo, revisar esta tabla.
- Verificado el 04/11/2026 por consultas de solo lectura del propio Juani. Las filas marcadas "sin verificar" no tienen confirmación en la base.
