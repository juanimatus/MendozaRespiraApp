# Demo privado para distribuidoras eléctricas

Vista privada de Mendoza Respira pensada para mostrarle a una distribuidora (Edeste, Edemsa,
cooperativas eléctricas) qué ganaría con la app. **Todos los datos son ficticios**: la
distribuidora, los alimentadores, los trazados de las líneas, los casos y los costos.

- Dirección: `/demo` (no aparece en el menú ni en buscadores).
- Los datos viven en el código (`src/lib/demo/data.ts`) y **no tocan Supabase**: no se mezclan
  con los reportes reales y no hace falta correr SQL.
- Cada pantalla muestra la franja amarilla "DEMO · datos ficticios" y el informe lleva marca
  de agua.

## Cómo habilitarlo

1. En Vercel: proyecto → **Settings** → **Environment Variables** → **Add**.
2. Nombre: `DEMO_PASSWORD`. Valor: la contraseña que vas a compartir (por ejemplo, una frase
   de 3 o 4 palabras). Entornos: Production y Preview.
3. **Save** y después **Deployments** → último deploy → **Redeploy** para que tome la variable.
4. Entrá a `https://<tu-dominio>/demo` y poné la contraseña.

Sin `DEMO_PASSWORD` el demo queda cerrado. Si cambiás la contraseña, se cierran todas las
sesiones abiertas. La sesión dura una semana; el botón **Salir** la cierra antes.

## Las tres pantallas

| Pantalla | Qué cuenta |
|---|---|
| **Mapa de riesgo** (`/demo`) | Dónde hay árboles en conflicto con cada alimentador, con riesgo asignado por el agrónomo, usuarios expuestos y ficha de cada caso con su historial. |
| **Plan de poda** (`/demo/priorizacion`) | Con el presupuesto del mes, qué casos atender primero. Se mueve el presupuesto y se ve cuánto riesgo se cubre; los costos se pueden ajustar. CSV para cuadrillas. |
| **Informe** (`/demo/informe`) | Hoja lista para descargar como PDF: casos, tiempos de resolución, poda planificada vs. urgencia, por alimentador y método. |

## Guion sugerido (5 minutos)

1. **Mapa**: "Estos son los árboles que vecinos y cuadrillas reportaron cerca de sus líneas,
   revisados por un agrónomo. Los rojos son ramas a menos de medio metro de media tensión."
   Tocá un punto rojo y mostrá la ficha con la línea de tiempo.
2. **Plan de poda**: "¿Cuánto tienen por mes para poda preventiva?" Mové el control hasta ese
   monto. "Con eso cubren tantos casos y la mayoría del riesgo alto. Si esperan al corte, lo
   mismo les sale 2,5 veces más." Abrí "Ajustar costos" y poné sus números si los dicen.
3. **Informe**: "Esto es lo que le llevan al directorio o al ente regulador cada mes." Descargá
   el PDF.
4. Cierre: "Esto es con datos inventados. Con un piloto de 90 días en un alimentador real lo
   armamos con sus datos."

## Qué no decir

- No es una red real ni datos de ninguna distribuidora.
- El informe aporta evidencia; **no certifica** ni calcula compensación de carbono.
- Los costos y el recargo de urgencia son de referencia, para ajustar con cada cliente.

## Para pasarlo a un piloto real

Hace falta: el trazado de los alimentadores del piloto (GeoJSON o KML de la distribuidora),
usuarios por tramo, sus costos de poda y un rol de acceso para la distribuidora en Supabase.
Eso sí lleva migración SQL y se arma cuando haya carta de intención.
