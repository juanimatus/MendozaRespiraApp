# Expansión: soterrado de cables y cableado en desuso

> Estado: idea evaluada (05/11/2026). Módulo futuro de Mendoza Respira.

## La idea en una línea

Los cables aéreos y el arbolado se pelean por el mismo espacio. Mendoza Respira ya registra
dónde está el conflicto. Con eso puede **marcar qué cuadras conviene soterrar primero** y
**mapear el cableado muerto** para que el municipio obligue a retirarlo, y el cobre recuperado
se recicla por canales legales.

## Por qué encaja con la app

- **El conflicto árbol-cable es la causa de la poda drástica.** Las distribuidoras desmochan
  árboles para despejar las líneas, y eso los debilita: después se secan, se pudren o se caen.
- **La app ya junta los datos**: el tipo de reporte "Rama peligrosa", las fotos y la revisión
  del agrónomo. Solo falta un tipo nuevo y un par de campos.
- **Es el mismo cliente**: el municipio, y suma uno nuevo que paga, la distribuidora eléctrica
  (ver [startup.md](startup.md)).
- **Conecta con el alumbrado de San Martín**: el robo de cables y lámparas es el mismo
  problema visto desde otro lado.

## Parte 1: priorizar el soterrado

Soterrar cables es muy caro y lo paga la distribuidora, el municipio o la Provincia. Nadie lo
va a decidir por una app. **Lo que sí puede aportar la app es dónde rinde más cada metro
soterrado.**

| Dato | De dónde sale |
|---|---|
| Reportes de ramas sobre cables y cortes de luz por árboles | Vecinos (tipo de reporte nuevo "Árbol tocando cables") |
| Árboles grandes debajo de líneas | Capa de copas de 1 m ([hoja-de-ruta-satelital.md](hoja-de-ruta-satelital.md)) cruzada con líneas eléctricas de OpenStreetMap |
| Podas drásticas repetidas en la misma cuadra | Historial de casos en la app |
| Escuelas, hospitales, paradas de colectivo | OpenStreetMap |

**Resultado**: un ranking de cuadras de "soterrar primero acá", con el argumento de que cada
una evita podas, cortes y riesgo de caída. Es un informe que se le puede vender a la
distribuidora o presentar en un presupuesto participativo.

## Parte 2: cableado en desuso

En muchas ciudades argentinas quedan colgados cables de telefonía y de TV por cable que nadie
usa: afean, se enredan en los árboles, se caen sobre la vereda y son excusa para podar.

**Lo que hace la app:**

1. Tipo de reporte nuevo **"Cable caído o en desuso"**, con foto y ubicación.
2. El técnico (o una persona de la cooperativa o del municipio) lo valida e identifica de qué
   empresa es.
3. Make o n8n arma un reporte mensual por empresa con fotos y ubicaciones, para que el
   municipio la intime a retirarlo.
4. Cuando la empresa lo retira, el caso se cierra en la línea de tiempo.

### Sobre "vender el cableado en desuso": ojo

**No se puede vender un cable que no es tuyo.** Aunque esté abandonado, el cable sigue siendo
de la empresa dueña, salvo que una ordenanza o un convenio diga otra cosa. Retirarlo sin
autorización puede ser hurto, y además es peligroso: un cable "muerto" puede compartir poste
con uno de media tensión.

**Lo que sí se puede hacer, legalmente:**

| Opción | Cómo funciona | Quién cobra |
|---|---|---|
| **Convenio municipio + empresa + cooperativa de reciclado** | La empresa autoriza el retiro, una cooperativa lo hace con seguridad, el cobre se vende a un reciclador habilitado | Cooperativa y municipio; parte puede ir a un fondo de reposición de árboles |
| **Ordenanza de retiro obligatorio** | Si la empresa no retira en un plazo, el municipio lo hace y el material pasa a ser municipal | Municipio |
| **La empresa lo retira y lo recicla** | La app solo aporta el mapa y la presión pública | Empresa |

Para Mendoza Respira, **el negocio no es vender cobre**, que es un mercado ajeno y con
riesgo legal. El negocio es **el mapa y la gestión**: el municipio paga por saber qué hay
colgado y de quién es. Si se arma un convenio, una parte del valor del cobre puede ir a
**financiar la reposición de árboles**, y eso es un muy buen argumento público.

**Para no ayudar a robar cables:** los cables en desuso reportados **no se muestran en el
mapa público** con ubicación exacta (igual que hoy se muestra solo el departamento). Si no, la
app se convierte en un mapa para quien quiere robar cobre.

### Antecedentes para la propuesta

Otros países ya tienen leyes que obligan a las empresas a retirar el cableado en desuso.
Hay que verificar el texto vigente antes de citarlas:

- Chile: ley que obliga a retirar cables aéreos en desuso (2019), y en 2025 un proyecto para
  que los municipios puedan retirarlos.
- Perú: Ley 31595 de retiro del cableado aéreo en desuso, reglamentada en 2024.
- Argentina: hay un proyecto en la Cámara de Diputados (expediente 4352-D-2024). Falta
  revisar si Mendoza o sus municipios tienen ordenanzas propias.

## Plan por etapas

| Etapa | Qué | Esfuerzo | Costo |
|---|---|---|---|
| 0 | Sumar los tipos "Árbol tocando cables" y "Cable caído o en desuso" (migración SQL + PR), sin ubicación exacta en el mapa público | 1 semana | USD 0 |
| 1 | Recorrer 20 cuadras de Palmira y cargar los casos: es la prueba para mostrarle a la Municipalidad de San Martín | 1 o 2 tardes | USD 0 |
| 2 | Informe mensual por empresa (Make o n8n: Supabase → Google Sheets o PDF → mail al municipio) | 1 semana | Entra en el plan gratis de Make |
| 3 | Ranking de cuadras para soterrar (satélite + OSM + historial) | 3 o 4 semanas | USD 0 |
| 4 | Convenio con cooperativa de reciclado y empresa, con parte del cobre para reponer árboles | Depende del municipio | Sin costo para la app |

## Qué no hacer

- **No retirar ni vender cables por cuenta propia**, ni prometerlo en la app.
- **No mostrar la ubicación exacta de cables con cobre** en el mapa público.
- **No prometer soterrado.** La app prioriza; la obra la decide y la paga otro.
