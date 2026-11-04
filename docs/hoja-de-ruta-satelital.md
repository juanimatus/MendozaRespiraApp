# Hoja de ruta: mapeo satelital del arbolado

> Estado: propuesta (04/11/2026). Módulo futuro de Mendoza Respira, junto a PASIP (sensores
> LoRa), alumbrado inteligente en San Martín y formación de jóvenes del Este.

## La idea en una línea

**El satélite sugiere, el vecino confirma, el agrónomo valida.** Usar imágenes satelitales
abiertas para detectar dónde falta arbolado y dónde se perdió verde con el tiempo, sin
esperar a que alguien lo denuncie, y cruzarlo con los reportes que ya llegan a la app.

## ¿Es viable? Sí, con matices

| Pregunta | Respuesta corta |
|---|---|
| ¿Detectar cuadras con poco o nada de arbolado? | **Sí.** Con datos de copa de 1 m de resolución se ve cuadra por cuadra. |
| ¿Detectar cada árbol que falta, uno por uno? | **Más o menos.** Se ven huecos en la línea de copas, pero hay que validarlos en el terreno. |
| ¿Ver cómo cambió la cobertura verde en el tiempo? | **Sí, y es lo más fuerte.** Hay series gratuitas desde 1984 (Landsat) y desde 2015 (Sentinel-2). |
| ¿Mapear el relieve a través del tiempo? | **No vale la pena.** El relieve casi no cambia en años. Lo que sí cambia, y conviene medir, es la cobertura: verde que se pierde, fincas que se urbanizan, terrenos que se desmontan. |
| ¿Sacar los datos de Google Earth? | **No.** Ver abajo. |

### Por qué no Google Earth (ni Google Maps, ni el satélite de Esri)

1. **Licencia**: los términos de Google Earth y Google Maps Platform prohíben extraer o
   analizar sus imágenes de forma automática. Lo mismo pasa con el fondo satelital de Esri
   que ya usa la app: sirve para **mostrar**, no para **medir**.
2. **Técnico**: esas imágenes son fotos en color (RGB) sin la banda infrarroja, que es la que
   distingue vegetación viva de un techo verde o de pasto seco.
3. **Uso válido**: sí sirven para que el agrónomo mire a ojo un caso en `/revision`, igual
   que Street View, y para comparar fechas con el historial de imágenes de Google Earth Pro.

## Fuentes que sí conviene usar

| Fuente | Qué da | Resolución | Desde | Costo y licencia |
|---|---|---|---|---|
| **Sentinel-2** (Copernicus, ESA) | NDVI: índice de verdor de la vegetación | 10 m | 2015, cada 5 días | Gratis, uso libre (incluso comercial) |
| **Dynamic World** (Google/WRI, sobre Sentinel-2) | Clase de suelo por píxel: árboles, pasto, cultivo, construido, suelo desnudo | 10 m | 2015 | Gratis, CC BY 4.0 |
| **Landsat 5/7/8/9** (NASA/USGS) | NDVI histórico y **temperatura de superficie** (islas de calor) | 30 m (térmica 100 m) | 1984 | Gratis, uso libre |
| **Altura de copas Meta/WRI** | Altura de cada copa: dónde hay árbol y dónde no | **1 m** | Imágenes 2009-2020 (80 % de 2018-2020) | Gratis, CC BY 4.0 |
| **OpenStreetMap** | Calles y veredas para saber dónde "debería" haber árbol | Vector | Actual | Gratis, ODbL |
| Ortofotos o drone (municipio, IDE Mendoza o vuelo propio) | Foto actual de alta resolución | 5-20 cm | Cuando se vuele | Pedir al municipio, o drone propio |

Lo importante:

- **Sentinel-2 a 10 m no ve árboles sueltos**: un plátano de vereda ocupa medio píxel.
  Sirve para medir el **porcentaje de verde por manzana o por zona** y su cambio en el tiempo.
- **La capa de copas de 1 m sí ve árboles**, pero es una foto de alrededor de 2018-2020:
  no muestra las talas recientes. Se usa como **línea de base**, y Sentinel-2 marca qué cambió
  después.
- **Mendoza es zona árida, y eso ayuda**: el arbolado regado por acequia contrasta fuerte con
  el suelo seco, y casi no hay nubes.
- **Ojo con la estación**: plátanos, moreras y fresnos pierden la hoja. Se comparan siempre
  imágenes de **diciembre a febrero**, nunca de invierno.
- **Ojo con viñedos, alfalfa y pasto**: el NDVI los ve verdes igual que a un árbol. Por eso se
  combina con Dynamic World (clase "árboles") y con la altura de copas.

## Herramientas, pensadas para bajo código

| Herramienta | Para qué | ¿Hay que programar? |
|---|---|---|
| **Copernicus Browser** (browser.dataspace.copernicus.eu) | Ver NDVI y comparar fechas de Sentinel-2 sin instalar nada | No |
| **Google Earth Engine** | Calcular todo en la nube y exportar resultados a Google Drive | Un script que Claude escribe; Juani lo pega y aprieta "Run" |
| **QGIS** | Mirar y retocar las capas en la compu | No (es visual) |
| **Make o n8n** | Llevar el archivo exportado de Drive a Supabase y mandar alertas | No |
| **App (Next.js + Leaflet)** | Mostrar la capa nueva en el mapa | Claude lo hace por PR |

### Aviso de licencia de Earth Engine (importante para cuando haya cliente)

Earth Engine es gratis para uso no comercial: proyectos personales, investigación, educación,
ONG. Desde el 27/04/2026 el plan gratuito "Community" da **150 horas de cómputo (EECU) por
mes**, que alcanzan de sobra para la Zona Este. Pero **si se vende como servicio a un
municipio, o el municipio lo usa para producir datos de forma continua, hace falta la licencia
comercial paga** de Google.

Por eso la regla del proyecto: **Earth Engine para el piloto y la prueba de concepto; para un
contrato municipal, procesar los mismos datos abiertos (Sentinel-2, Landsat, copas Meta) con
herramientas sin esa restricción** (Copernicus Data Space o QGIS). Los datos en sí son libres;
lo que se licencia es la plataforma de Google.

## Cómo encaja con lo que ya existe

```
Satélite (cada mes, Earth Engine)
   └─→ GeoJSON en Google Drive: % de verde por manzana, cambio vs. año anterior, huecos en vereda
         └─→ Make / n8n: "Watch files" en Drive → subir el archivo a Supabase Storage
               └─→ App: capa "Cobertura verde" en /feed  +  "Sugerencias satelitales" en /revision
                     └─→ El agrónomo valida → se convierte en caso "Espacio para árbol"
                     └─→ Pérdida fuerte de verde en una zona → alerta al municipio (n8n)
```

**Clave para no gastar operaciones en Make**: se mueve **un archivo por mes**, no cada manzana
por separado. Son 3 o 4 operaciones mensuales. Si se iterara manzana por manzana (cientos o
miles), se come el plan gratis de 1.000 operaciones en una corrida.

**Clave para no confundir al vecino**: las sugerencias del satélite **no aparecen como
reportes públicos**. Van a `/revision` como candidatas, igual que la IA de fotos: clasifica
por dentro y el vecino no ve burocracia.

## Plan por etapas

### Etapa 0: prueba de concepto en Palmira (1-2 semanas, USD 0)

- Juani crea su cuenta de Earth Engine (uso no comercial, plan Community).
- Claude escribe el script: NDVI de Sentinel-2 del verano 2025-2026 y capa de copas de 1 m,
  recortados a Palmira y San Martín.
- Juani recorre **10 cuadras de Palmira** con la app y anota cuáles tienen huecos. Se compara
  con lo que marcó el satélite. Eso da una **tasa de acierto real**, que es el dato que pide
  un jurado o un municipio.
- Entregable: 2 o 3 mapas (capturas) y el porcentaje de acierto.
- Esfuerzo de Juani: unas 6 horas (cuenta, correr el script, recorrida a pie).

### Etapa 1: capa "Cobertura verde" en la app (2-3 semanas, USD 0)

- Grilla por manzana (o hexágonos de 100 m) con el % de copa arbórea.
- Se suma como capa opcional en `/feed`, con colores de menos a más verde.
- Make: escenario "Google Drive → Watch files → Download a file → HTTP (subir a Supabase
  Storage)", una vez por mes.
- Esfuerzo: Claude hace el PR de la app; Juani arma el escenario de Make (unas 2 horas).

### Etapa 2: sugerencias de "Espacio para árbol" (3-4 semanas, USD 0)

- Cruzar calles de OpenStreetMap con la capa de copas: tramos de vereda de más de 15-20 m sin
  copa son **candidatos**.
- Aparecen en `/revision` para que el agrónomo los mire con Street View y el satélite, y los
  apruebe o descarte.
- Necesita una migración SQL nueva (tabla de sugerencias), que Juani corre en el SQL Editor.
- Métrica para mostrar: "X espacios para árbol detectados sin que nadie los denunciara".

### Etapa 3: cambio en el tiempo e islas de calor (3-4 semanas, USD 0)

- Serie anual 2016-2026 con Dynamic World y Sentinel-2: dónde se perdió verde.
- Serie larga 1985-2026 con Landsat: avance urbano sobre fincas y viñedos en la Zona Este
  (conecta con la formación agropecuaria y enológica de Juani).
- Temperatura de superficie de verano con Landsat: **las manzanas sin árboles son más calientes**.
  Es el argumento más convincente para un intendente.
- Alerta automática con n8n: si una zona pierde más de un umbral de verde entre dos veranos,
  aviso por mail o WhatsApp al municipio.

### Etapa 4: alta resolución (opcional, cuando haya convenio)

- Pedir ortofotos al municipio o a la IDE de Mendoza, o volar drone en un piloto chico.
- Con eso se cuentan árboles uno por uno y se actualiza la línea de base de 2018-2020.
- Imágenes satelitales comerciales de 30-50 cm existen, pero cuestan miles de dólares por
  zona: no tiene sentido antes de un contrato.

## Qué no hacer

- **No extraer datos de Google Earth, Google Maps ni del fondo de Esri.** Licencia y técnica.
- **No prometer conteo de árboles con Sentinel-2.** A 10 m no se puede; se miden porcentajes.
- **No publicar las sugerencias del satélite como reportes.** Un falso positivo en el mapa
  público le quita credibilidad a todo lo demás.
- **No entrenar un modelo propio de IA ahora.** Los datos de copas de Meta/WRI ya hacen ese
  trabajo gratis.
- **No usar Earth Engine gratis para un contrato pago** (ver aviso de licencia).
- **No medir "relieve en el tiempo".** El relieve (SRTM, Copernicus DEM) sí sirve una vez, para
  otra cosa: ver por dónde escurre el agua en una tormenta, en el módulo de El Niño.

## Costos resumidos

| Concepto | Costo |
|---|---|
| Datos satelitales (Sentinel-2, Landsat, Dynamic World, copas Meta, OSM) | USD 0 |
| Earth Engine, uso no comercial (plan Community) | USD 0 |
| Make (3-4 operaciones por mes) | Entra en el plan gratis |
| Supabase Storage (un GeoJSON de pocos MB por mes) | Entra en el plan actual |
| Earth Engine comercial (solo si se vende al municipio) | Pago, cotizar con Google; o reemplazar por Copernicus/QGIS |
| Drone para piloto de alta resolución | Opcional: alquiler o convenio |

## Para el pitch

> "Mendoza Respira ya no espera la denuncia: el satélite marca cada verano dónde falta
> sombra y dónde se perdió verde, el vecino lo confirma con una foto y el agrónomo lo valida.
> Todo con datos abiertos y a costo cero."

## Referencias

- Earth Engine, planes no comerciales: https://developers.google.com/earth-engine/guides/noncommercial_tiers
- Earth Engine, quién califica como no comercial: https://earthengine.google.com/noncommercial
- Altura de copas Meta/WRI (catálogo comunitario de Earth Engine): https://gee-community-catalog.org/projects/meta_trees/
- Copernicus Browser: https://browser.dataspace.copernicus.eu
