# Mendoza Respira como startup

> Estado: análisis (05/11/2026). No hay cifras inventadas: donde falta un número, se dice
> qué hay que medir para tenerlo.

## Respuesta corta

Hoy Mendoza Respira **no es todavía invertible** para un fondo de capital de riesgo: es un
prototipo funcionando, sin cliente que pague y sin métricas de uso sostenido. **Sí tiene lo
que un inversor busca en una etapa muy temprana**: un problema grave y documentado, un
cambio de ley que obliga a alguien a resolverlo, costos muy bajos y un producto que se
replica en otra ciudad cambiando una configuración. El camino realista es: **piloto con un
municipio → primer contrato → fondos no reembolsables y aceleradoras → recién ahí inversión.**

## Por qué invertirían

### 1. El problema es grave y está documentado

- Entre enero de 2025 y agosto de 2026 hubo **5 muertes en 4 caídas de árboles** en Mendoza
  (Santa Rosa, Maipú, Las Heras, San Carlos), según Los Andes y MDZ.
- En al menos dos casos (Maipú y San Carlos) **había avisos o expedientes previos** que se
  perdieron entre el municipio y Vialidad. El problema no es que nadie avise: es que el aviso
  no tiene trazabilidad.
- Mendoza es un oasis en zona árida: el arbolado regado por acequia es infraestructura, no
  decoración. Sin árboles, la ciudad es más caliente y más cara de habitar.

### 2. Hay un cambio de reglas que crea la demanda (timing)

- La **Ley provincial 9.702** (vigente desde fines de abril de 2026 y reglamentada en agosto de 2026)
  pasa la responsabilidad del arbolado a los municipios y crea la plataforma provincial
  "Mi Árbol".
- Cada municipio va a necesitar inventario, gestión de reclamos y prioridad de intervención,
  y la mayoría no tiene ni el equipo ni el software para eso. Esa es la ventana de mercado.

### 3. El producto ya existe y resuelve la parte difícil

- App instalable (PWA) en producción, con reporte por foto y GPS, confirmación de vecinos,
  revisión técnica por agrónomo, línea de tiempo de cada caso, mapa por departamento y datos
  abiertos (CSV y GeoJSON).
- Cada caso deja un **historial verificable**: quién avisó, cuándo, qué dijo el técnico y qué
  se hizo. Eso es exactamente lo que faltó en los casos de Maipú y San Carlos.

### 4. Escala sin rehacer el producto

- Sumar una provincia o un país es cargar su mapa de límites y una entrada de configuración
  (`src/config/region.ts`). No hay desarrollo a medida por cliente.
- El problema se repite en otras ciudades de oasis o zona árida (San Juan, San Luis, el norte
  argentino, Chile) y en cualquier municipio que herede la gestión del arbolado.

### 5. Costos muy bajos

- Infraestructura en planes gratuitos o de bajo costo (Vercel, Supabase), mapas y datos
  satelitales abiertos, automatizaciones con Make y n8n.
- El costo de sumar un municipio más es casi solo el de implementarlo y capacitar al equipo.

### 6. Los datos son la ventaja que no se copia

- Una app de reclamos se copia en semanas. **Años de reportes validados por técnicos, con
  foto, ubicación y resolución, cruzados con datos satelitales** (ver
  [hoja-de-ruta-satelital.md](hoja-de-ruta-satelital.md)), no.
- Con ese historial se puede pasar de "atender reclamos" a **predecir dónde va a caer el
  próximo árbol**, que es lo que un municipio o una aseguradora pagaría.

### 7. El fundador está en el territorio

- Técnico agropecuario, consultor de automatización (TangoScript), formación en redes y
  telecomunicaciones, viviendo en la Zona Este. Vende en persona a municipios que conoce, que
  en el sector público pesa más que cualquier campaña digital.
- Visibilidad del Polo TIC Mendoza (postulación al premio Revelación Joven 2026, pasó la
  primera etapa).

## Modelo de negocio propuesto

**Regla fija: el vecino nunca paga.** Reportar, confirmar y ver los datos abiertos es gratis
siempre. Si el vecino paga, deja de reportar y el producto pierde su fuente de datos.

| Quién paga | Qué compra | Forma de cobro |
|---|---|---|
| **Municipios** (cliente principal) | Panel de gestión: reclamos con trazabilidad, revisión técnica, inventario, prioridad de poda y reposición, informes | Suscripción anual por escalas (por habitantes o por cantidad de árboles) + implementación y capacitación |
| **Provincia** | Integración con "Mi Árbol", tablero provincial con todos los municipios | Convenio o licencia provincial |
| **Distribuidoras eléctricas y Vialidad** | Alertas de árboles y ramas en riesgo cerca de líneas y rutas | Suscripción o informe por zona |
| **Empresas y bodegas** (sostenibilidad) | Informe de cobertura verde y plantación verificable para reportes ambientales | Informe o proyecto |
| **Fondos y organismos** (BID, CAF, programas de ciudades y clima) | Pilotos de impacto ambiental medible | Subsidio o financiamiento de proyecto |

Precios: **todavía no hay precio validado.** Se fija después del primer piloto, comparando
contra lo que hoy le cuesta al municipio gestionar reclamos a mano y contra lo que cobran
otros sistemas de gestión municipal.

## Riesgos (lo que un inversor va a preguntar)

| Riesgo | Por qué importa | Cómo se responde |
|---|---|---|
| **Venta al Estado lenta** | Licitaciones, presupuestos anuales, cambios de gestión | Empezar por convenios de piloto sin costo o de bajo monto, que no necesitan licitación; sumar clientes privados (distribuidoras, empresas) para no depender solo del Estado |
| **"Mi Árbol" de la Provincia** | Puede hacer lo mismo y gratis para los municipios | Posicionarse como complemento: Mi Árbol junta denuncias, Mendoza Respira resuelve la gestión técnica del municipio. O venderle la tecnología a la Provincia |
| **Fundador único y sin perfil de programador** | Los inversores apuestan al equipo | Sumar un socio técnico y un ingeniero agrónomo como socio o asesor |
| **Seguridad y autenticación** | Hoy los roles de inspector y admin no tienen login real | Resolverlo antes de cualquier contrato |
| **Adopción de los vecinos** | Sin reportes no hay datos | Medirla en el piloto; el satélite reduce la dependencia de los reportes |
| **Licencia de Earth Engine** | Es gratis solo para uso no comercial | En un contrato pago, procesar los datos abiertos con Copernicus o QGIS |
| **Datos personales** | Fotos y ubicaciones de vecinos | Ya se publica solo el departamento, no la dirección; formalizar la política de privacidad |

## Qué falta para ser invertible

1. **Un municipio usándolo de verdad**: convenio de piloto (aunque sea sin costo) con la
   Municipalidad de San Martín u otro de la Zona Este.
2. **Métricas reales del piloto**: reportes por mes, porcentaje validado, tiempo desde el
   aviso hasta la intervención, casos cerrados. Sin esto, cualquier cifra es inventada.
3. **Una carta de intención o un primer contrato pago.**
4. **Equipo**: socio técnico y agrónomo.
5. **Sociedad formal** (por ejemplo una SAS), política de privacidad y términos de uso.
6. **Precio validado** y cuentas básicas: cuánto cuesta implementar un municipio y cuánto
   paga por año.
7. **Login real** para el personal municipal.

## Camino de financiamiento realista

1. **Ahora**: premios y visibilidad (Polo TIC), programas provinciales y nacionales para
   emprendedores, aceleradoras con foco en impacto o en tecnología para gobiernos (GovTech).
   Revisar las convocatorias vigentes en cada momento.
2. **Con piloto y métricas**: fondos no reembolsables de organismos de clima, ciudades y
   desarrollo, e inversores ángel de impacto.
3. **Con contratos en varios municipios**: ronda pre-semilla o semilla.

## El pitch en un párrafo

> "En Mendoza murieron cinco personas por caídas de árboles en un año y medio, y en varios
> casos el aviso existía pero se perdió. La nueva ley le pasa el arbolado a los municipios, que
> no tienen cómo gestionarlo. Mendoza Respira convierte cada aviso de un vecino en un caso con
> historial, revisado por un agrónomo y priorizado por riesgo, y suma datos satelitales para
> encontrar los problemas antes de que alguien los denuncie. El vecino lo usa gratis, el
> municipio paga una suscripción, y el sistema se lleva a otra ciudad cambiando una
> configuración."

## Próximos 90 días

| Paso | Resultado esperado |
|---|---|
| Reunión presencial con la Municipalidad de San Martín (área de ambiente o arbolado) | Convenio de piloto |
| Login real para inspector y admin | Producto listo para un piloto oficial |
| Etapa 0 del mapeo satelital en Palmira | Mapa y tasa de acierto para mostrar en la reunión |
| Medir el piloto durante 60 días | Primeras métricas reales |
| Buscar socio técnico y agrónomo | Equipo para presentar ante aceleradoras |
