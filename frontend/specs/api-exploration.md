# Exploración de la API para las specs del frontend

> Fase 1 del proyecto de especificaciones. Fuente: contrato OpenAPI 3.1.0 en vivo ("Financial Metrics API" v0.1.0), leído en `http://localhost:8000/docs` y `http://localhost:8000/openapi.json` el 2026-11-13, sobre el commit `8022d3e`.
>
> Leyenda: ✅ verificado en `/docs` · ❌ lo que se suponía es incorrecto · ❓ sin verificar todavía.

## 1. Mapa de endpoints por funcionalidad

| Funcionalidad | Endpoint | Para qué |
|---|---|---|
| 1 · Filtro de fechas | `GET /api/metrics/facets` | Rango de fechas disponible (`min_date`, `max_date`) |
| 1 · Filtro de fechas | `GET /api/metrics` | Movimientos filtrados por `start_date`/`end_date`. Es el único endpoint que usa hoy el dashboard |
| 2 · Tabla de anomalías | `GET /api/metrics/alerts` | Períodos con gasto anómalo |
| 3 · B2B vs B2C | `GET /api/metrics/categories/top` | Top de categorías por línea de negocio |
| 3 · B2B vs B2C | `GET /api/metrics/facets` | Categorías y líneas de negocio disponibles |
| 3 · B2B vs B2C (candidato) | `GET /api/metrics/summary` | Totales de ingresos por línea de negocio, por si sirve para la gráfica |

Todas las rutas son `GET` y devuelven JSON. ✅

## 2. Parámetros de query

Ningún parámetro es obligatorio en estos cinco endpoints. ✅

Las fechas se declaran como `string` con `format: "date"` (ISO 8601, `YYYY-MM-DD`) o `null`. ✅

### `GET /api/metrics`

| Parámetro | Tipo | Valor por defecto | Valores válidos |
|---|---|---|---|
| `start_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `end_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `category` | enum o `null` | sin filtro | `suppliers`, `sales`, `operational`, `administrative`, `others` |
| `operation_type` | enum o `null` | sin filtro | `income`, `outcome` |

❌ **No tiene `business_type`.** Para filtrar por B2B/B2C existen `/api/metrics/b2b` y `/api/metrics/b2c`.

### `GET /api/metrics/facets`

No tiene parámetros. ✅ Siempre describe el dataset completo: no se puede pedir por fechas ni por línea de negocio.

### `GET /api/metrics/alerts`

| Parámetro | Tipo | Valor por defecto | Valores válidos |
|---|---|---|---|
| `threshold` | `number` | `0.3` | `≥ 0` (`minimum: 0`). **Sin máximo** |
| `group_by` | enum | `month` | `day`, `week`, `month` |
| `start_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `end_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `business_type` | enum o `null` | sin filtro | `B2B`, `B2C` |

### `GET /api/metrics/categories/top`

| Parámetro | Tipo | Valor por defecto | Valores válidos |
|---|---|---|---|
| `operation_type` | enum | **`outcome`** | `income`, `outcome` |
| `limit` | `integer` | `5` | `1` a `20` |
| `start_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `end_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `business_type` | enum o `null` | sin filtro | `B2B`, `B2C` |

⚠️ El valor por defecto de `operation_type` es `outcome`. Para la funcionalidad 3 hay que enviar `operation_type=income` siempre.

### `GET /api/metrics/summary`

| Parámetro | Tipo | Valor por defecto | Valores válidos |
|---|---|---|---|
| `group_by` | enum | `month` | `day`, `week`, `month` |
| `start_date` / `end_date` | `date` o `null` | sin filtro | `YYYY-MM-DD` |
| `category` | enum o `null` | sin filtro | las 5 categorías |
| `operation_type` | enum o `null` | sin filtro | `income`, `outcome` |
| `business_type` | enum o `null` | sin filtro | `B2B`, `B2C` |

## 3. Formas de respuesta

Todos los campos de estos esquemas son obligatorios (`required`). Solo `MetricsComparison.delta_pct` admite `null`, y no lo usa ninguna funcionalidad. ✅

| Endpoint | Forma | Esquema |
|---|---|---|
| `/api/metrics` | **lista** | `FinancialMovement[]` |
| `/api/metrics/facets` | **objeto** | `MetricsFacets` |
| `/api/metrics/alerts` | **lista** | `MetricsAlert[]` |
| `/api/metrics/categories/top` | **lista** | `TopCategoryItem[]` |
| `/api/metrics/summary` | **lista** | `MetricsSummaryItem[]` |

❌ No existen objetos que envuelvan las listas. Lo que el ejercicio llama `AlertsResponse` y `TopCategoriesResponse` son, en la API, listas sin envolver.

### `FinancialMovement`

| Campo | Tipo |
|---|---|
| `create_date` | `string` (`format: date`) |
| `amount` | `number` |
| `operation_type` | `"income"` \| `"outcome"` |
| `category` | `"suppliers"` \| `"sales"` \| `"operational"` \| `"administrative"` \| `"others"` |
| `business_type` | `"B2B"` \| `"B2C"` |

### `MetricsFacets`

| Campo | Tipo |
|---|---|
| `operation_types` | lista de `"income"` \| `"outcome"` |
| `business_types` | lista de `"B2B"` \| `"B2C"` |
| `categories` | lista de las 5 categorías |
| `min_date` | `string` (`format: date`) |
| `max_date` | `string` (`format: date`) |

### `MetricsAlert`

| Campo | Tipo |
|---|---|
| `period` | `string` (el contrato **no** documenta su formato) ❓ |
| `outcome_total` | `number` |
| `baseline_average` | `number` |
| `increase_ratio` | `number` (ratio, no porcentaje) ❓ |

### `TopCategoryItem`

| Campo | Tipo |
|---|---|
| `category` | una de las 5 categorías |
| `operation_type` | `"income"` \| `"outcome"` |
| `total_amount` | `number` |

### `MetricsSummaryItem`

| Campo | Tipo |
|---|---|
| `period` | `string` (formato sin documentar) ❓ |
| `income` | `number` |
| `outcome` | `number` |
| `net` | `number` |

## 4. Errores

Todos los endpoints con parámetros declaran una respuesta **422** con el esquema `HTTPValidationError`. ✅ `facets` no la declara, porque no tiene parámetros.

```text
HTTPValidationError { detail?: ValidationError[] }   // opcional en el contrato; en la práctica siempre llega
ValidationError     { loc: (string | integer)[], msg: string, type: string, input?, ctx? }
```

Cuándo se produce exactamente y cómo es el cuerpo real: ❓ se comprueba en el Paso 4.

## 5. Casos límite probados con peticiones reales

Peticiones con `curl` a `http://localhost:8000` el 2026-11-13. Dataset: 360 movimientos entre `2025-11-01` y `2026-10-28`. Las fechas dependen del día en que arranca el backend (regla FE-10), así que las cifras exactas de esta sección cambian con el tiempo. Las reglas de comportamiento no cambian.

### Fechas (`start_date` / `end_date`)

Probadas en `/api/metrics`. `alerts` y `categories/top` usan el mismo filtro (`filter_movements_by_date`, `backend/app/routes.py:107`) y se comportan igual.

| Petición | Respuesta | Qué significa |
|---|---|---|
| Sin fechas | 200, 360 movimientos | Sin filtro = dataset completo ✅ |
| Solo `start_date=2026-03-01` | 200, 240 movimientos (hasta `2026-10-28`) | Solo inicio = desde esa fecha hasta el final ✅ |
| Solo `end_date=2026-03-31` | 200, 150 movimientos (desde `2025-11-01`) | Solo fin = desde el principio hasta esa fecha ✅ |
| `2026-03-01` → `2026-03-31` | 200, 30 movimientos | Los dos extremos están **incluidos** (`>=` y `<=`) ✅ |
| `2026-03-15` → `2026-03-15` | 200, 1 movimiento | Inicio = fin es válido: un solo día ✅ |
| Inicio > fin (`2026-04-01` → `2026-03-01`) | **200, lista vacía** | ❌ La API **no** da error: devuelve `[]` sin avisar |
| Fuera del dataset (`2020`) | 200, lista vacía | Rango válido pero sin datos |
| `start_date=` (vacío) | **422** | ❌ Un campo vacío **no** equivale a "sin filtro": hay que **omitir** el parámetro |
| `13/01/2026` | 422 `date_from_datetime_parsing` | No acepta otros formatos de fecha ✅ |
| `2026-03-01T00:00:00` | 200 | También acepta un *datetime* con hora `00:00:00` |
| `2026-03-01T10:00:00` | 422 `date_from_datetime_inexact` | Un *datetime* con hora distinta de cero no se acepta |
| `2026-3-1` | 422 (`input is too short`) | Mes y día necesitan dos dígitos ✅ |
| `2026-02-30` | 422 (`day value is outside expected range`) | Valida que la fecha exista ✅ |

### Parámetros desconocidos o repetidos

| Petición | Respuesta | Qué significa |
|---|---|---|
| `/api/metrics?business_type=B2B` | 200, 360 movimientos | Un parámetro que el endpoint no conoce se **ignora sin error** (pasa lo mismo con `facets?start_date=…`) |
| `start_date=2026-03-01&start_date=2026-05-01` | 200, 180 movimientos desde `2026-05-01` | Si se repite un parámetro, **gana el último**, sin error |

La spec no debe confiar en la API para detectar parámetros mal escritos: un error de nombre devolvería datos sin filtrar.

### Facetas

`GET /api/metrics/facets` → 200:

```json
{"operation_types": ["income", "outcome"], "business_types": ["B2B", "B2C"],
 "categories": ["administrative", "operational", "others", "sales", "suppliers"],
 "min_date": "2025-11-01", "max_date": "2026-10-28"}
```

- `min_date` y `max_date` son la fecha del primer y del último movimiento, no el principio y el fin de mes. ✅
- Las listas vienen ordenadas alfabéticamente. ✅
- `categories` mezcla categorías de ingreso y de gasto, y no dice cuáles son de B2B ni de B2C. ❌

### Alertas (`/api/metrics/alerts`)

| Petición | Respuesta |
|---|---|
| `threshold=0` | 200, 6 alertas |
| `threshold=0.01` | 200, 5 alertas |
| `threshold=0.3` (por defecto) | 200, 4 alertas (`2025-12`, `2026-03`, `2026-06`, `2026-08`) |
| `threshold=1` | 200, 1 alerta (`2025-12`, `increase_ratio` 1.4968) |
| `threshold=1.5` | **200, lista vacía**: sin anomalías |
| `threshold=-1` | 422 `greater_than_equal` |
| `threshold=abc` | 422 `float_parsing` |
| `threshold=0.3`, rango `2026-03-01` → `2026-06-30` | 200, 1 alerta (`2026-06`) |
| `threshold=0.3`, rango dentro de un solo mes natural | **200, lista vacía siempre** |
| `threshold=0`, rango `2026-03-15` → `2026-04-15` | 200, 1 alerta (`2026-04`, 26757.76 frente a 18254.17): se comparan **dos medios meses** |
| Inicio > fin | 200, lista vacía |

**Formato de `period`** ✅ (resuelve el ❓ de la sección 3). Depende de `group_by`:

| `group_by` | Formato | Ejemplo |
|---|---|---|
| `month` (por defecto) | `YYYY-MM` | `2026-03` |
| `week` | `YYYY-Www` (semana ISO) | `2025-W46` |
| `day` | `YYYY-MM-DD` | `2025-11-12` |

**`increase_ratio` es un ratio, no un porcentaje** ✅ (resuelve el ❓ de la sección 3). Para `2025-12`: `(103378.98 − 41404.44) / 41404.44 = 1.4968`, es decir, un **+149.68 %**. Viene redondeado a 4 decimales, y `outcome_total` y `baseline_average` a 2.

**Cómo calcula la API la media (`baseline_average`)**. Lo comprobamos recalculándola con los datos de `/api/metrics/summary`:

| Período | `baseline_average` de la API | Media de **todos** los meses anteriores | Media de los **3** meses anteriores |
|---|---|---|---|
| `2026-03` | 55334.29 | **55334.29** | 59977.58 |
| `2026-06` | 57416.50 | **57416.50** | 60192.76 |
| `2026-07` | 60265.93 | **60265.93** | 57571.13 |
| `2026-09` | 62481.64 | **62481.64** | 74300.30 |

- ❌ **La API usa la media de todos los períodos anteriores**, no la de los 3 anteriores que pide el PM (`detect_outcome_alerts`, `routes.py:219-240`).
- La media se calcula **solo con los períodos dentro del rango de fechas**. Por eso `2026-06` tiene `baseline_average` 57416.50 sin filtro y 60192.76 con el rango marzo-junio. **El mismo mes puede dar cifras distintas según el rango.**
- El **primer período del rango nunca puede ser una alerta**, porque no tiene períodos anteriores. Con un rango dentro de un solo mes natural (y `group_by=month`), la respuesta es siempre `[]`.
- Si el rango empieza o acaba a mitad de mes, el primer y el último período son **meses parciales**: su `outcome_total` es menor y distorsiona la media y el ratio (ejemplo en la tabla de arriba).
- Si la media es `0` o negativa, el período no se evalúa (`routes.py:228`).
- La media se calcula con los gastos de cada período ya redondeados a 2 decimales (`routes.py:183`).
- Con `business_type`, el filtro se aplica antes de calcular la media: las alertas de B2B (`2025-12`, `2026-03`, `2026-08`, `2026-09` con `0.3`) no son las del total. La funcionalidad 2 no lo usa.
- La comparación es estricta (`increase_ratio > threshold`, `routes.py:230`): un aumento exactamente igual al umbral no es alerta.

### Top de categorías (`/api/metrics/categories/top`)

| Petición | Respuesta |
|---|---|
| `operation_type=income&limit=5` | 200, **solo 2 elementos**: `sales` (1132097.38) y `others` (126049.49) |
| `operation_type=income&limit=20` | 200, también 2 elementos |
| `operation_type=income&limit=1` | 200, 1 elemento (`sales`) |
| `limit=0` / `limit=21` / `limit=abc` | 422 (`greater_than_equal` / `less_than_equal` / `int_parsing`) |
| Sin `operation_type` | 200, 4 categorías de **gasto** (`others`, …, `suppliers`) ❌ no sirve para la funcionalidad 3 |
| `income` + `B2B` | 200, 2 elementos: `sales` 557903.97, `others` 57636.75 |
| `income` + `B2C` | 200, 2 elementos: `sales` 574193.41, `others` 68412.74 |
| `income` + `B2B` + rango de marzo de 2026 | 200, 2 elementos (`sales` 25952.85, `others` 2799.96) |
| `income` + `B2B` + rango sin datos (`2020`) | **200, lista vacía** |
| `business_type=b2b` (minúsculas) | 422 `literal_error` ("Input should be 'B2B' or 'B2C'") |

- Viene ordenado de **mayor a menor** `total_amount`, redondeado a 2 decimales (`routes.py:200-205`). ✅
- ❌ Los ingresos solo tienen dos categorías posibles, `sales` y `others` (`routes.py:79`). El "top 5" mostrará **como mucho 2 filas** por línea de negocio.
- ❌ La respuesta **no** trae el porcentaje sobre el total del grupo.

### Resumen (`/api/metrics/summary`), candidato para la gráfica B2B vs B2C

- `operation_type=income&business_type=B2B` → 200, 12 períodos `YYYY-MM` con `income`, `outcome` (a `0.0` por el filtro) y `net`.
- `group_by=week` → 53 períodos; `group_by=day` → 215 (solo los días con movimientos).
- Para el total de ingresos de cada grupo, sirve tanto sumar los `total_amount` del top (si devuelve todas las categorías) como sumar `income` del resumen. Lo decidirá la spec (Paso 6).

### Cuerpo del error 422

Siempre tiene esta forma (ejemplo real):

```json
{"detail": [{"type": "greater_than_equal", "loc": ["query", "threshold"],
  "msg": "Input should be greater than or equal to 0", "input": "-1", "ctx": {"ge": 0.0}}]}
```

- `loc[1]` indica qué parámetro falló.
- `msg` está en inglés y pensado para desarrolladores.
- `ctx` no siempre aparece (falta, por ejemplo, en `float_parsing`).

## 6. Cómo llama hoy el frontend a la API

Revisado en `frontend/src` sobre el commit `8022d3e`. Sirve para que la spec reutilice los patrones que ya existen en lugar de inventar otros.

### Patrón de `fetch` actual

| Aspecto | Qué hace hoy | Evidencia |
|---|---|---|
| URL base | `import.meta.env.VITE_API_BASE_URL ?? ""` + ruta. Vacío = ruta relativa, que pasa por el proxy de Vite | `App.tsx:13`, `vite.config.ts` (proxy `/api` → `http://backend:8000`) |
| Llamadas | **Una sola**: `GET /api/metrics`, **sin parámetros** | `App.tsx:16` |
| Errores | Si `!response.ok`, lanza un `Error` genérico. El cuerpo del 422 **no se lee** | `App.tsx:17-19` |
| Mensaje al usuario | Un único texto fijo: `"Could not load financial data. Check the backend API."` | `App.tsx:37` |
| Estado | `useState` para datos, `loading` y `error`. Sin librería de datos ni caché | `App.tsx:24-27` |
| Cuándo pide | Una vez al montar (`useEffect(..., [])`). En desarrollo pide dos veces por `StrictMode` | `App.tsx:29-43`, `main.tsx` |
| Cancelación | No usa `AbortController`: si cambian los filtros, una respuesta antigua podría llegar después de la nueva | `App.tsx:29-43` |
| Cálculos | KPIs y serie mensual se calculan **en el cliente** a partir de los movimientos | `lib/financial-utils.ts` (`computeKPIs`, `computeMonthlyData`) |

### Tipos que ya existen

`frontend/src/lib/financial-types.ts` ya define `OperationType`, `Category`, `BusinessType` y `FinancialMovement`, y coinciden con el contrato ✅ (sección 3). Los tipos de la Fase 2 deben **reutilizar** estos nombres y valores, no crear otros distintos.

`FinancialMovement.create_date` solo está documentado con el comentario `// ISO date`. En `/docs` es `format: date`, es decir, `YYYY-MM-DD`.

### Formato y componentes reutilizables

| Utilidad | Qué hace | Implicación para la spec |
|---|---|---|
| `formatCurrency(value)` | `Intl.NumberFormat("en-US")`, USD, **sin decimales** | Sirve para `outcome_total`, `baseline_average` y `total_amount` |
| `formatPercent(value)` | `` `${value.toFixed(1)}%` `` | ⚠️ Espera un valor **ya en porcentaje**: hay que pasarle `increase_ratio * 100`, no el ratio tal cual |
| `formatMonthYearLabel` (privada) | `"2026-03"` → `"Mar 2026"` | Sirve para mostrar `period` en formato `YYYY-MM`. Hoy no se exporta |
| `components/ui/` | Solo `card.tsx` y `skeleton.tsx` | ❓ No hay componentes de tabla, input ni botón: la spec debe decir si se usan elementos HTML nativos o si se añaden de shadcn |
| Estados de carga y vacío | `loading` → `Skeleton`. Sin datos → `"No data available to display"` | Patrón a repetir en las tablas nuevas |

### Lo que el frontend actual no tiene

- ❌ **No hay router.** `package.json` no incluye `react-router` ni similar, y `App.tsx` es una sola página. La "nueva página" B2B vs B2C (funcionalidad 3) obliga a decidir cómo se llega a ella.
- ❌ **La cabecera dice `"2024 - Full Year"` fijo** (`App.tsx:49`, hallazgo A6). Con el filtro de fechas de la funcionalidad 1, esa etiqueta seguiría siendo incorrecta.
- ❌ **No hay ninguna llamada con parámetros de query.** No existe un patrón para construir la query string ni para omitir los parámetros vacíos, que es necesario porque `start_date=` da 422 (sección 5).
- Las facetas, las alertas y el top de categorías **no se usan todavía** en el frontend (hallazgo A5).

## 7. Desajustes entre el PM y la API

Cada fila compara una frase del PM con lo que hace la API, con la evidencia de las secciones anteriores. Las decisiones se resuelven **en la spec**: el backend no se modifica.

Estado: ✅ coincide · ❌ no coincide (la spec lo resuelve). Las tres decisiones que dependían del usuario (F1-9, F2-1 y F3-1) están resueltas e indicadas como **Decidido (usuario)**.

### Funcionalidad 1 — Filtro de rango de fechas

| # | Lo que dice el PM | Lo que hace la API | Estado | Decisión para la spec |
|---|---|---|---|---|
| F1-1 | "Las fechas se envían a la API en formato YYYY-MM-DD" | `format: date`. Acepta `YYYY-MM-DD` con dos dígitos (y también un *datetime* a las `00:00:00`); otros formatos dan 422 (§5) | ✅ | Enviar siempre `YYYY-MM-DD`. El `<input type="date">` nativo ya entrega ese formato |
| F1-2 | "Ambos inputs son opcionales; cuando están vacíos, el dashboard muestra todos los datos" | Sin parámetro = sin filtro ✅. Pero `start_date=` (vacío) da **422** (§5) | ❌ | Un input vacío **no se envía**: se omite el parámetro de la query |
| F1-3 | Solo uno de los dos inputs relleno (el PM no lo dice) | Solo inicio = desde esa fecha hasta el final. Solo fin = desde el principio hasta esa fecha (§5) | ✅ | Se permite. Se envía solo el parámetro relleno, y el rango abierto se aplica a todo |
| F1-4 | Inicio posterior al fin (el PM no lo dice) | 200 con lista vacía, sin error (§5) | ❌ | Validar en el frontend: no se hace la petición y se muestra un error junto a los inputs |
| F1-5 | "El rango de fechas disponible… debe mostrarse cerca de los inputs" | `facets` devuelve `min_date` y `max_date` del dataset completo y no acepta parámetros (§2) | ✅ | Mostrar `min_date` – `max_date` y usarlos como `min`/`max` de los inputs |
| F1-6 | Fechas fuera del rango disponible | 200 con lista vacía (§5) | ❌ | Los atributos `min`/`max` de F1-5 limitan el selector. Si aun así no hay datos, se muestra el estado vacío existente |
| F1-7 | "Filtren todos los datos que se muestran actualmente en la página" | El dashboard pide `/api/metrics` sin parámetros y calcula KPIs y gráficas en el cliente (§6) | ✅ | Enviar `start_date`/`end_date` a `/api/metrics`. KPIs y gráficas se recalculan con el resultado |
| F1-8 | "La extensión de filtros sobre el endpoint de métricas existente" | `/api/metrics` **ya** acepta `start_date` y `end_date` (§2) | ✅ | No hace falta extender la API, solo usar los parámetros que ya existen |
| F1-9 | (No lo dice) La cabecera muestra `"2024 - Full Year"` fijo | `App.tsx:49`, hallazgo A6 | ❌ | **Decidido (usuario):** la etiqueta muestra el rango activo. Sin filtro, muestra el rango de `facets` (`min_date` – `max_date`) |

### Funcionalidad 2 — Tabla de alertas de anomalías

| # | Lo que dice el PM | Lo que hace la API | Estado | Decisión para la spec |
|---|---|---|---|---|
| F2-1 | "Media móvil de los 3 períodos anteriores" | `baseline_average` es la media de **todos** los períodos anteriores **dentro del rango** (§5, recalculada) | ❌ | **Decidido (usuario):** se sigue el ejercicio y se usa `GET /api/metrics/alerts` tal cual. La columna muestra `baseline_average` sin recalcularla en el cliente, y la spec documenta que es la media de todos los períodos anteriores del rango, no la de los 3 anteriores. Queda como pregunta abierta para el PM |
| F2-2 | Columnas: "período, outcome registrado, media móvil, incremento porcentual" | `period`, `outcome_total`, `baseline_average`, `increase_ratio` (§3) | ✅ | Mapear columna → campo. Los nombres de la API no se cambian en los tipos |
| F2-3 | "Incremento porcentual" | `increase_ratio` es un ratio (`1.4968` = +149,68 %) (§5) | ❌ | Mostrar `increase_ratio * 100` con `formatPercent` |
| F2-4 | "Umbral… un ratio entre 0.01 y 1.0, por defecto 0.3" | `threshold`: `≥ 0`, sin máximo, por defecto `0.3` (§2, §5) | ❌ | El frontend limita el input a `0.01`–`1.0` (paso `0.01`). `0` es válido en la API (`ge=0`, devuelve 6 alertas): el mínimo `0.01` es una restricción del PM que aplica solo el frontend. Fuera de ese rango no se hace la petición y se muestra un error junto al input |
| F2-5 | "Si no se detectan anomalías… mensaje explícito de estado vacío" | 200 con `[]` (p. ej. `threshold=1.5`) (§5) | ✅ | Con `[]`, la tabla se mantiene y muestra un mensaje que incluye el umbral actual |
| F2-6 | "Debe respetar el rango de fechas de la Funcionalidad 1" | Acepta `start_date`/`end_date`, pero **la media cambia con el rango**, el primer período del rango nunca es alerta y los meses parciales distorsionan las cifras (§5) | ❌ | Enviar las fechas del filtro. Explicar en la tabla que la media se calcula solo con los períodos del rango y que los meses incompletos cuentan como períodos |
| F2-7 | "Períodos" (sin unidad) | `group_by` por defecto `month` → `period` = `YYYY-MM` (§5) | ✅ | No enviar `group_by` (se usa `month`). Mostrar `period` como `"Mar 2026"` |
| F2-8 | Comparación con el umbral | Estricta: `increase_ratio > threshold` (§5) | ✅ | Documentarlo en la spec: un aumento igual al umbral no aparece |
| F2-9 | "Respuesta" de alertas | Lista sin envolver: `MetricsAlert[]` (§3) | ❌ | `AlertsResponse` será un alias de `AlertEntry[]`, no un objeto |

### Funcionalidad 3 — Vista comparativa B2B vs B2C

| # | Lo que dice el PM | Lo que hace la API | Estado | Decisión para la spec |
|---|---|---|---|---|
| F3-1 | "Crea una nueva página en el dashboard" | No hay router en el frontend (§6) | ❌ | **Decidido (usuario):** dos pestañas en la cabecera (`Overview` y `B2B vs B2C`) que cambian la vista con estado de React. Sin dependencias nuevas; la URL no cambia |
| F3-2 | "Las 5 categorías de ingreso principales" | Los ingresos solo tienen `sales` y `others`: como mucho **2 filas** aunque `limit=5` (§5) | ❌ | Pedir `limit=5` igualmente y mostrar las filas que lleguen, sin rellenar con filas vacías |
| F3-3 | `categories/top?operation_type=income&limit=5` | `operation_type` por defecto es `outcome` (§2) | ✅ | Enviar **siempre** `operation_type=income` y `business_type` (`B2B` o `B2C`). Una petición por panel |
| F3-4 | "Porcentaje sobre el total del grupo" | La API no lo devuelve (§5) | ❌ | Calcularlo en el cliente: `total_amount / suma de total_amount del panel × 100`. Como el top incluye todas las categorías de ingreso (2 ≤ 5), esa suma es el total de ingresos del grupo |
| F3-5 | "Un único gráfico compara… el total de ingresos de B2B frente a B2C" | No hay endpoint de "total por grupo" | ❌ | Usar la suma de cada panel (F3-4). No hace falta otra petición |
| F3-6 | "Las categorías disponibles para cada grupo deben obtenerse del endpoint de facetas" | `facets` no separa por grupo, mezcla ingresos y gastos y no admite parámetros (§5) | ❌ | `facets` solo aporta `business_types` (los dos paneles) y `min_date`/`max_date` (el filtro). Las categorías de cada panel salen de `categories/top` |
| F3-7 | "Filtrar la comparativa por un rango de fechas" | `categories/top` acepta `start_date`/`end_date` con las mismas reglas que F1 (§5) | ✅ | Mismas reglas de validación que F1 (F1-2, F1-3, F1-4) |
| F3-8 | Panel sin datos (el PM no lo dice) | 200 con `[]` si el rango no tiene ingresos de ese grupo (§5) | ❌ | Cada panel muestra su propio estado vacío. La gráfica muestra 0 para ese grupo |
| F3-9 | "Respuesta" del top | Lista sin envolver: `TopCategoryItem[]` (§3) | ❌ | `TopCategoriesResponse` será un alias de `CategoryEntry[]`, no un objeto |

### Comunes a las tres funcionalidades

| # | Tema | Evidencia | Decisión para la spec |
|---|---|---|---|
| C-1 | Error 422 | Cuerpo `{"detail": [...]}` con `msg` técnico en inglés (§5) | La validación del frontend evita los 422. Si llega uno, se muestra un mensaje genérico en inglés (regla FE-07), no el `msg` |
| C-2 | Respuestas desordenadas al cambiar filtros | No hay `AbortController` (§6) | Cancelar la petición anterior al cambiar los filtros; solo se pinta la última |
| C-3 | Textos de la interfaz | `lang="en"`, regla FE-07 | Todos los textos nuevos en inglés |
| C-4 | Componentes de tabla e input | Solo existen `card` y `skeleton` (§6) | Elementos HTML nativos (`<table>`, `<input>`) dentro de `Card`, con las clases de Tailwind del proyecto |
