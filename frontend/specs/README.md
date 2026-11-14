# Contrato de datos del frontend

Esta carpeta especifica tres funcionalidades nuevas del dashboard financiero **antes de implementarlas**:

1. **Filtro de rango de fechas** en el dashboard principal.
2. **Tabla de alertas de anomalías** de gasto.
3. **Vista comparativa B2B vs B2C** de ingresos.

Este README es el **contrato de datos**: qué endpoints consume cada funcionalidad, con qué tipos, qué valores acepta cada parámetro y qué debe mostrar la interfaz en los casos límite. Todo nombre de campo, parámetro y comportamiento de la API se verificó contra `/docs` y con peticiones reales: no hay nada supuesto.

> Estado: **especificado, no implementado**. No existen todavía componentes ni llamadas a la API para estas funcionalidades.

## Cómo usar esta carpeta

### Orden de lectura

| # | Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|---|
| 1 | `README.md` (este) | Contrato de datos: endpoints, tipos, parámetros y casos límite | Siempre, primero |
| 2 | [`api-types.ts`](./api-types.ts) | Tipos de las respuestas: `FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry`, `TopCategoriesResponse` | Antes de escribir código que lea respuestas |
| 3 | [`param-types.ts`](./param-types.ts) | Tipos de los parámetros de query: `DateRangeFilter`, `AlertsParams`, `TopCategoriesParams` | Antes de escribir código que haga peticiones |
| 4 | [`components.md`](./components.md) | Componentes, props, estado de `App`, funciones puras de `lib/` y estados de renderizado | Antes de escribir componentes |
| 5 | [`api-exploration.md`](./api-exploration.md) | Evidencia: contrato OpenAPI, ~40 peticiones reales y los 31 desajustes entre el PM y la API | Para comprobar de dónde sale una afirmación |
| — | [`plans/`](./plans/) | Plan de cada fase de este trabajo | Solo como historial |
| — | [`tsconfig.json`](./tsconfig.json) | Comprobación estricta de los tipos de esta carpeta | Al cambiar un `.ts` de esta carpeta |

Los archivos `.ts` de esta carpeta son el **contrato**: la app no los importa. Los alias de los bloques "Tipos" de este README (`FacetsRequest`, `AlertsRequest`…) son **ilustrativos**: no existen en los `.ts` y no hay que importarlos.

**Los tests forman parte de la entrega:** cada cálculo (validar el rango y el umbral, construir la query, formatear fechas y porcentajes, totales) es una función pura de `src/lib/dashboard-utils.ts` con su test en `dashboard-utils.test.ts`, incluida una ejecución con `TZ=America/New_York` ([`components.md` §0.5](./components.md#05-funciones-puras-de-lib-regla-fe-08)).

Al implementar, los `.ts` se copian a `src/lib/` (ver [`components.md` §0.3](./components.md#03-dónde-va-cada-cosa-al-implementar)).

### Comprobar los tipos

`tsconfig.json` de esta carpeta activa `strict` y revisa `api-types.ts`, `param-types.ts` y el `src/lib/financial-types.ts` que importan. El `node_modules` del host está vacío (Docker lo monta como volumen anónimo), así que se ejecuta dentro del contenedor del frontend, desde la raíz del repositorio:

```bash
docker compose exec -T -w /app/specs frontend npx tsc --noEmit
```

⚠️ `npx tsc --noEmit` desde `frontend/` **no** revisa estos archivos (el `tsconfig.json` de `frontend/` tiene `"files": []` y el de la app solo incluye `src`).

## Contrato común a las tres funcionalidades

### Fuente de verdad

- Contrato OpenAPI 3.1.0, "Financial Metrics API" v0.1.0, en `http://localhost:8000/docs` (y `/openapi.json`).
- Verificado entre el 2026-11-13 y el 2026-11-14, sobre los commits `8022d3e` a `2c92ea5` (el backend no cambió entre ellos).
- Si la API cambia, hay que volver a comprobar los tipos: el procedimiento está en [`verification.md`](../../verification.md) (Specs · Fase 2).

### Endpoints que se usan

| Funcionalidad | Endpoint | Tipo de la petición | Tipo de la respuesta |
|---|---|---|---|
| 1 · Filtro de fechas | `GET /api/metrics/facets` | (sin parámetros) | `FacetsResponse` |
| 1 · Filtro de fechas | `GET /api/metrics` | `DateRangeFilter` | `FinancialMovement[]` (ya existe en `src/lib/financial-types.ts`) |
| 2 · Tabla de anomalías | `GET /api/metrics/alerts` | `AlertsParams` | `AlertsResponse` |
| 3 · B2B vs B2C | `GET /api/metrics/categories/top` | `TopCategoriesParams` | `TopCategoriesResponse` |
| 3 · B2B vs B2C | `GET /api/metrics/facets` | (sin parámetros) | `FacetsResponse` |

No se usan `/api/metrics/summary`, `/comparison`, `/b2b` ni `/b2c`.

### Cómo se llama a la API

| Aspecto | Contrato |
|---|---|
| Método y formato | Todo es `GET`. Las respuestas son JSON. No hay autenticación |
| URL | `` `${import.meta.env.VITE_API_BASE_URL ?? ''}${ruta}${query}` ``, el mismo patrón que `App.tsx:13-16`. Con `VITE_API_BASE_URL` vacío, la ruta es relativa y pasa por el proxy de Vite (`/api` → `http://backend:8000`), que solo existe dentro de Docker |
| Nombres de los parámetros | Los de la API, en `snake_case` (`start_date`, no `startDate`), que son los de `param-types.ts` |
| Parámetros vacíos | **Se omiten.** Un parámetro con valor vacío (`start_date=`) da **422**, no "sin filtro" |
| Parámetros desconocidos | La API los **ignora sin error** y devuelve datos sin filtrar. Un nombre mal escrito no falla: construye la query siempre con los tipos |
| Parámetros repetidos | Gana el último, sin error. No repitas parámetros |
| Cancelación | Si cambian los filtros antes de que llegue la respuesta, se cancela la petición anterior (`AbortController`), para que una respuesta antigua no pise a la nueva |

### Fechas

| Regla | Detalle |
|---|---|
| Formato | `YYYY-MM-DD` con mes y día de dos dígitos (OpenAPI `format: date`). Es lo que entrega `<input type="date">` |
| Extremos | `start_date` y `end_date` están **incluidos** (`>=` y `<=`) |
| Validación de la API | `13/01/2026`, `2026-3-1` y `2026-02-30` dan 422. Pero también acepta otras formas (`2026-03-01T00:00:00`, un timestamp Unix): envía solo `YYYY-MM-DD` y no confíes en la API para validar el formato |
| Inicio > fin | La API **no** da error: responde 200 con una lista vacía (comprobado en `/api/metrics`, `/alerts` y `/categories/top`). Lo valida el frontend |
| Zona horaria | Para mostrar una fecha `YYYY-MM-DD`, formatéala con `timeZone: 'UTC'`. `new Date('2025-11-01')` es medianoche UTC y, en zonas UTC−, los métodos locales devuelven el 31 de octubre (regla [FE-09](../../.agents/rules/frontend.md#fe-09--fechas-yyyy-mm-dd-sin-conversión-a-hora-local)) |

### Respuestas

- `/alerts` y `/categories/top` devuelven una **lista sin envolver**, no un objeto. `AlertsResponse` y `TopCategoriesResponse` son alias de una lista.
- **Todos los campos son obligatorios** y ninguno es `null` en las respuestas que se usan.
- Una **lista vacía (`[]`) con 200 es una respuesta válida**: significa "no hay datos para estos filtros", no un error. Cada componente tiene un estado vacío explícito.
- Importes redondeados a 2 decimales; `increase_ratio`, a 4. La API no indica la moneda: la interfaz usa `formatCurrency` (USD sin decimales), como el resto del dashboard.

### Errores

Todos los endpoints con parámetros declaran **422** con este cuerpo (`facets` no tiene parámetros y no lo declara):

```json
{"detail": [{"type": "greater_than_equal", "loc": ["query", "threshold"],
  "msg": "Input should be greater than or equal to 0", "input": "-1", "ctx": {"ge": 0.0}}]}
```

| Campo | Significado |
|---|---|
| `detail[].loc` | `["query", "<parámetro>"]`: qué parámetro falló |
| `detail[].type` | Código del error (`date_from_datetime_parsing`, `greater_than_equal`, `less_than_equal`, `int_parsing`, `float_parsing`, `literal_error`…) |
| `detail[].msg` | Mensaje técnico en inglés. **No se muestra al usuario** |
| `detail[].ctx` | Límite que se incumplió. **No siempre aparece** |

Cualquier respuesta con `!response.ok` (422, 5xx) o un fallo de red se trata igual: el componente afectado pasa a su estado de error, con un mensaje propio en inglés (los textos están en `components.md`). Con las validaciones del frontend de este contrato, un 422 no debería ocurrir nunca.

### Datos que cambian con el tiempo

El backend no tiene base de datos: **genera los datos en cada petición** a partir de la fecha de hoy (`date.today()`) con una semilla fija. Son 360 movimientos de los 12 meses anteriores al actual. El mismo día, la misma petición da el mismo resultado, pero las fechas y los importes cambian cada mes.

- **No escribas fechas fijas** en el código ni en los tests (regla [TE-03](../../.agents/rules/testing.md#te-03--no-escribas-fechas-fijas-en-tests-que-dependen-de-los-datos-mock)). La etiqueta del período de la cabecera tampoco es fija (regla [FE-10](../../.agents/rules/frontend.md#fe-10--no-uses-el-código-heredado-de-la-versión-con-datos-de-2024)). El rango disponible se lee siempre de `GET /api/metrics/facets`.
- Los ejemplos de este README son reales, de la API en marcha el **2026-11-14** (rango `2025-11-01` – `2026-10-28`). Sirven para entender la forma de los datos, no como valores esperados.

## Funcionalidad 1 — Filtro de rango de fechas

**Qué pide el PM:** dos inputs de fecha opcionales (inicio y fin) en la parte superior del dashboard, que filtran todo lo que se muestra. Cerca de los inputs se muestra el rango de fechas disponible. Fechas en `YYYY-MM-DD`.

**Decisión de la spec:** es un **único filtro compartido** por las pestañas `Overview` y `B2B vs B2C`. El rango elegido filtra también la tabla de anomalías (funcionalidad 2) y la vista B2B vs B2C (funcionalidad 3). Componentes: `DateRangeFilterBar` y `DashboardHeader` ([`components.md` §1](./components.md#1-funcionalidad-1--filtro-de-rango-de-fechas)).

### Endpoints

| Endpoint | Para qué | Cuándo se pide |
|---|---|---|
| `GET /api/metrics/facets` | Rango disponible: `min_date` y `max_date` | Una vez, al cargar la página |
| `GET /api/metrics` | Movimientos del rango, con los que se calculan los KPIs y las dos gráficas en el cliente (`computeKPIs`, `computeMonthlyData`) | Con la pestaña `Overview` visible, cada vez que cambia el rango aplicado |

`/api/metrics` **ya acepta** `start_date` y `end_date`: la "extensión de filtros" que menciona el PM no requiere cambiar el backend, solo enviar esos parámetros.

### Tipos

```ts
import type { FacetsResponse } from './api-types'
import type { DateRangeFilter } from './param-types'
import type { FinancialMovement } from '../src/lib/financial-types'

// GET /api/metrics/facets — sin parámetros
type FacetsRequest = Record<string, never>
type FacetsResult = FacetsResponse

// GET /api/metrics?start_date=…&end_date=…
type MetricsRequest = DateRangeFilter
type MetricsResult = FinancialMovement[]
```

`FacetsResponse` (de `api-types.ts`):

| Campo | Tipo | Ejemplo real | Notas |
|---|---|---|---|
| `min_date` | `string` (`YYYY-MM-DD`) | `"2025-11-01"` | Fecha del primer movimiento, no el primer día del mes |
| `max_date` | `string` (`YYYY-MM-DD`) | `"2026-10-28"` | Fecha del último movimiento, no el último día del mes |
| `business_types` | `BusinessType[]` | `["B2B", "B2C"]` | Lo usa la funcionalidad 3 |
| `operation_types` | `OperationType[]` | `["income", "outcome"]` | No se usa |
| `categories` | `Category[]` | `["administrative", "operational", "others", "sales", "suppliers"]` | No se usa: mezcla ingresos y gastos y no separa por línea de negocio |

Las tres listas vienen en orden alfabético. `facets` describe **siempre el dataset completo**: no acepta fechas ni línea de negocio.

`FinancialMovement` (de `src/lib/financial-types.ts`, ya coincide con `/docs`): `create_date` (`YYYY-MM-DD`), `amount` (`number`), `operation_type`, `category`, `business_type`. La lista viene en orden cronológico.

### Parámetros (`DateRangeFilter`)

| Parámetro | Tipo | Obligatorio | Valores válidos | Si no tiene valor |
|---|---|---|---|---|
| `start_date` | `string` | No | `YYYY-MM-DD` real. Incluido en el rango. Debe ser ≤ `end_date` si los dos tienen valor | **Se omite**: desde el principio del dataset |
| `end_date` | `string` | No | `YYYY-MM-DD` real. Incluido en el rango | **Se omite**: hasta el final del dataset |

Restricciones que aplica el frontend (la API no las comprueba):

- `start_date <= end_date` cuando los dos tienen valor. Las dos son `YYYY-MM-DD`, así que se comparan como texto.
- Los inputs llevan `min = min_date` y `max = max_date` de `facets` (si cargó), más los límites cruzados entre ellos. Solo limitan el **selector**: una fecha completa escrita a mano fuera de `min`/`max` (`validity.rangeOverflow` / `rangeUnderflow`) **se envía** igualmente (caso 1.8). Lo único que bloquea el envío es una fecha a medio escribir (`validity.badInput`, caso 1.9) o inicio > fin (caso 1.4).
- Funciones de `lib/` que lo implementan ([`components.md` §0.5](./components.md#05-funciones-puras-de-lib-regla-fe-08)): `isValidDateRange`, `buildQueryString`, `formatDisplayDate` y `formatRangeLabel`.

Ejemplos de query:

| Inputs | Query enviada |
|---|---|
| Vacíos | `/api/metrics` |
| Solo inicio `2026-03-01` | `/api/metrics?start_date=2026-03-01` |
| Solo fin `2026-03-31` | `/api/metrics?end_date=2026-03-31` |
| `2026-03-01` → `2026-03-31` | `/api/metrics?start_date=2026-03-01&end_date=2026-03-31` |

### Casos límite

Respuestas reales de la API (2026-11-14) y lo que debe mostrar la interfaz:

| # | Caso | Qué hace la API | Qué muestra la interfaz |
|---|---|---|---|
| 1.1 | **Los dos inputs vacíos** | Sin parámetros: 200 con los 360 movimientos | Dataset completo. Cabecera: `Nov 1, 2025 – Oct 28, 2026` (de `facets`) |
| 1.2 | **Solo la fecha de inicio** (`2026-03-01`) | Solo se envía `start_date`: 200 con 240 movimientos, hasta `2026-10-28` | Datos desde esa fecha hasta el final. Cabecera: `Mar 1, 2026 – Oct 28, 2026`. Sin `facets`: `From Mar 1, 2026` |
| 1.3 | **Solo la fecha de fin** (`2026-03-31`) | Solo se envía `end_date`: 200 con 150 movimientos, desde `2025-11-01` (el último, del `2026-03-24`: no hay movimientos después de ese día en marzo) | Datos desde el principio hasta esa fecha. Cabecera: `Nov 1, 2025 – Mar 31, 2026`. Sin `facets`: `Until Mar 31, 2026` |
| 1.4 | **Inicio posterior al fin** (`2026-04-01` → `2026-03-01`) | Si se enviara: 200 con `[]`, **sin error** | **No se envía.** Mensaje `Start date must be on or before end date.` bajo los inputs, que se marcan con `aria-invalid`. Los datos y la cabecera siguen siendo los del último rango válido |
| 1.5 | **Un input vacío enviado como `start_date=`** | 422 `date_from_datetime_parsing` | No ocurre: un input vacío se omite de la query (caso 1.2/1.3) |
| 1.6 | **Rango válido sin datos** (`2020-01-01` → `2020-12-31`) | 200 con `[]` | KPIs a `$0` y `0.0%`; gráficas con `No data available to display`. Los `min`/`max` de los inputs evitan llegar aquí con el selector |
| 1.7 | **Un solo día** (`2026-03-15` → `2026-03-15`) | 200 con 1 movimiento: inicio = fin es válido | Los datos de ese día |
| 1.8 | **Rango que se solapa en parte** con el dataset (`2026-10-01` → `2027-01-31`) | 200 con los 30 movimientos de la parte común | Los datos de la parte común. Cabecera con las fechas elegidas: `Oct 1, 2026 – Jan 31, 2027` |
| 1.9 | **Fecha a medio escribir** en el input | — | No se envía nada hasta que la fecha está completa (`validity.badInput`, ver `components.md` §1.5) |
| 1.10 | **`/api/metrics/facets` falla** | Error de red o 5xx | Los inputs siguen funcionando, sin `min`/`max` del dataset. Texto `Available date range could not be loaded.` Cabecera sin rango: `All available data` |
| 1.11 | **`/api/metrics` falla** | Error de red o 5xx | Caja de error `Could not load financial data. Check the backend API.`; KPIs a `—` y gráficas con `No data available to display` |

## Funcionalidad 2 — Tabla de alertas de anomalías

**Qué pide el PM:** bajo las gráficas, una tabla con los períodos en los que el gasto subió de forma inesperada. Cuatro columnas: período, outcome registrado, media móvil de los 3 períodos anteriores e incremento porcentual. Umbral configurable con un input numérico (ratio de 0.01 a 1.0, por defecto 0.3). Si no hay anomalías, un mensaje explícito de estado vacío. Respeta el rango de fechas de la funcionalidad 1.

**Decisión de la spec:** se usa `GET /api/metrics/alerts` **tal cual**. La columna de la media muestra la media que calcula la API, que **no** es la de 3 períodos (ver "Desajuste con el PM" abajo). Componente: `AnomalyAlertsTable` ([`components.md` §2](./components.md#2-funcionalidad-2--tabla-de-alertas-de-anomalías)), en la pestaña `Overview`.

### Endpoint

| Endpoint | Para qué | Cuándo se pide |
|---|---|---|
| `GET /api/metrics/alerts` | Meses en que el gasto supera la media de los meses anteriores en más del umbral | Con la pestaña `Overview` visible, cada vez que cambia el umbral aplicado o el rango aplicado |

### Tipos

```ts
import type { AlertsResponse } from './api-types'
import type { AlertsParams } from './param-types'

// GET /api/metrics/alerts?threshold=…&start_date=…&end_date=…
type AlertsRequest = AlertsParams
type AlertsResult = AlertsResponse // = AlertEntry[]
```

`AlertEntry` (de `api-types.ts`), una fila de la tabla:

| Campo | Tipo | Ejemplo real | Columna | Cómo se muestra |
|---|---|---|---|---|
| `period` | `string` (`YYYY-MM`) | `"2026-03"` | `Period` | `formatMonthYearLabel` → `Mar 2026` (hoy es privada en `financial-utils.ts`: hay que exportarla, [`components.md` §0.3](./components.md#03-dónde-va-cada-cosa-al-implementar)) |
| `outcome_total` | `number` (2 decimales) | `88076.9` | `Recorded outcome` | `formatCurrency` → `$88,077` |
| `baseline_average` | `number` (2 decimales) | `55334.29` | `Avg. of previous months` | `formatCurrency` → `$55,334` |
| `increase_ratio` | `number` (ratio, 4 decimales) | `0.5917` | `Increase` | `'+' + formatPercent(increase_ratio * 100)` → `+59.2%` |

- `increase_ratio` es un **ratio**, no un porcentaje: `0.5917` es +59.17 %. Se muestra tal cual; no se recalcula con las otras columnas (podría diferir en el cuarto decimal).
- La lista viene en **orden cronológico**. `[]` es una respuesta válida: no hay anomalías.

### Parámetros (`AlertsParams`)

| Parámetro | Tipo | Obligatorio en la spec | Valores válidos en la interfaz | Lo que acepta la API |
|---|---|---|---|---|
| `threshold` | `number` | **Sí**, siempre se envía | `0.01` a `1`, ambos incluidos. Por defecto `0.3` (PM) | Cualquier número `>= 0`, sin máximo. Por defecto `0.3`. Negativos o no numéricos → 422 |
| `start_date` | `string` | No | Los del rango aplicado de la funcionalidad 1 | `YYYY-MM-DD` (reglas de "Fechas") |
| `end_date` | `string` | No | Los del rango aplicado de la funcionalidad 1 | `YYYY-MM-DD` |

**No se envían** (la API los acepta, pero esta funcionalidad no los usa):

- `group_by`: se usa el valor por defecto, `month`, así que `period` es siempre `YYYY-MM`.
- `business_type`: la tabla es del negocio completo.

El input del umbral es un `<input type="number" min="0.01" max="1" step="0.01">` ([`components.md` §2.3](./components.md#23-anomalyalertstable-nuevo)). Su valor llega como **texto** (`event.target.value`): un texto no numérico o a medio escribir llega como `''`. `parseThreshold` (§0.5) lo convierte: solo se envía si es un número entre `0.01` y `1`; si no (incluido `''`), se muestra un error y la tabla sigue con el último umbral válido. El umbral se muestra con `formatThreshold` (`0.3` → `30.0%`).

Ejemplo de query: `/api/metrics/alerts?threshold=0.3&start_date=2026-03-01&end_date=2026-06-30`.

### Cómo calcula la API la alerta

Verificado recalculándolo con los datos de `/api/metrics/summary` (ver [`api-exploration.md` §5](./api-exploration.md#5-casos-límite-probados-con-peticiones-reales)):

1. Agrupa el gasto por mes **dentro del rango** de fechas.
2. Para cada mes, `baseline_average` = media del gasto de **todos los meses anteriores del rango** (los meses sin movimientos no cuentan).
3. `increase_ratio = (outcome_total − baseline_average) / baseline_average`.
4. El mes es una alerta si `increase_ratio > threshold` (estrictamente mayor, comparando **antes** de redondear).

Consecuencias:

- El **primer mes del rango nunca es una alerta**: no tiene meses anteriores.
- **El mismo mes puede dar cifras distintas según el rango**, porque la media solo usa los meses del rango. Ejemplo: `2026-06` tiene `baseline_average` 57416.5 sin filtro y 60192.76 con el rango `2026-03-01` → `2026-06-30`.
- Si el rango empieza o acaba a mitad de mes, ese primer o último mes es **parcial** y su gasto parece menor.

### ⚠️ Desajuste con el PM: la media no es de 3 períodos

El PM pide la "media móvil de los 3 períodos anteriores". La API devuelve la media de **todos** los meses anteriores del rango. Con datos reales:

| Mes | `baseline_average` de la API | Media de los 3 meses anteriores |
|---|---|---|
| `2026-03` | 55334.29 | 59977.58 |
| `2026-06` | 57416.50 | 60192.76 |
| `2026-09` | 62481.64 | 74300.30 |

Decisión: se muestra el valor de la API con la cabecera `Avg. of previous months`, que describe lo que de verdad es, y queda como **pregunta abierta para el PM** ([`components.md` §4](./components.md#4-preguntas-abiertas-para-el-pm), Q1). Para tener la media de 3 períodos habría que cambiar el backend, y eso está fuera del alcance de este trabajo.

### Casos límite

Respuestas reales de la API (2026-11-14) y lo que debe mostrar la interfaz:

| # | Caso | Qué hace la API | Qué muestra la interfaz |
|---|---|---|---|
| 2.1 | **Umbral por defecto** (`0.3`), sin fechas | 200 con 4 alertas: `2025-12`, `2026-03`, `2026-06`, `2026-08` | La tabla con 4 filas. Ayuda junto al input: `= 30.0% increase` |
| 2.2 | **Sin anomalías** para el umbral y el rango (p. ej. `0.4` con `2026-07-01` → `2026-10-28`) | 200 con `[]` | **Estado vacío explícito**: la tabla no desaparece. Cabecera de columnas y una fila: `No spending anomalies above 40.0% in the selected period.` |
| 2.3 | **Rango dentro de un solo mes** (`2026-03-01` → `2026-03-31`) | 200 con `[]` siempre: el único mes es el primero del rango | El mismo estado vacío que 2.2 (`No spending anomalies above 30.0% in the selected period.`). La descripción de la tarjeta ya avisa de que el primer mes nunca se marca |
| 2.4 | **Umbral fuera de rango en el input** (`0`, `1.5`, vacío; un texto como `abc` llega como vacío) | Si se enviara: `0` y `1.5` → 200 (6 y 0 alertas); `abc` y vacío → 422 `float_parsing` | **No se envía.** El input se marca con `aria-invalid` y aparece `Threshold must be a number between 0.01 and 1.` La tabla sigue con el último umbral válido, que muestra la ayuda |
| 2.5 | **Umbral máximo** (`1`), sin fechas | 200 con 1 alerta: `2025-12` (`increase_ratio` 1.4968, +149.7 %) | La tabla con 1 fila. Con el dataset actual y sin filtro, **ningún umbral válido deja la tabla vacía** |
| 2.6 | **Umbral mínimo** (`0.01`), sin fechas | 200 con 5 alertas (`2026-07`, con +0.39 %, no entra) | La tabla con 5 filas |
| 2.7 | **Aumento igual al umbral** | No se devuelve (comparación estricta `>`). Por el redondeo, un valor mostrado puede coincidir con el umbral | Correcto, no es un error: `+30.0%` puede aparecer con umbral `30.0%` |
| 2.8 | **Rango que corta meses** (`2026-03-15` → `2026-04-15`, umbral `0`) | 200 con 1 alerta: `2026-04` contra una media de 18254.17 (medio mes de marzo) | La fila tal cual. Las cifras son de meses parciales; la spec no lo corrige |
| 2.9 | **Inicio > fin** en el filtro de fechas | No se pide (caso 1.4) | La tabla sigue con el último rango válido |
| 2.10 | **La petición falla** | Error de red o 5xx | Caja de error dentro de la tarjeta: `Could not load anomaly alerts. Check the backend API.` El input sigue visible y usable |
| 2.11 | **Cargando** (al abrir Overview o al cambiar umbral o rango) | — | Cabecera de la tabla y 3 filas de `Skeleton` |

## Funcionalidad 3 — Vista comparativa B2B vs B2C

**Qué pide el PM:** una página nueva para comparar los ingresos de B2B y B2C. Dos secciones en paralelo, cada una con una tabla de las 5 categorías de ingreso principales de su línea de negocio (nombre de categoría, total de ingresos y porcentaje sobre el total del grupo). Debajo, un único gráfico que compara el total de ingresos de B2B frente a B2C. Filtrable por rango de fechas (`YYYY-MM-DD`). Las categorías disponibles de cada grupo deben salir del endpoint de facetas.

**Decisiones de la spec:**

- La "página nueva" es la pestaña `B2B vs B2C`, junto a `Overview`. No hay router en el proyecto y no se añade.
- El filtro de fechas es el **mismo** de la funcionalidad 1, compartido por las dos pestañas.
- Componentes: `DashboardTabs`, `BusinessComparisonView`, `TopCategoriesPanel` (uno por línea de negocio) y `BusinessIncomeChart` ([`components.md` §3](./components.md#3-funcionalidad-3--vista-comparativa-b2b-vs-b2c)).

### Endpoints

| Endpoint | Para qué | Cuándo se pide |
|---|---|---|
| `GET /api/metrics/categories/top` ×2 | Una petición por línea de negocio (`B2B` y `B2C`): sus categorías de ingreso y el total de cada una | Con la pestaña `B2B vs B2C` visible, cada vez que cambia el rango aplicado. Las dos son independientes |
| `GET /api/metrics/facets` | `business_types`: qué paneles se muestran | Ya se pidió al cargar la página (funcionalidad 1) |

No hace falta ninguna petición para la gráfica: el total de cada línea de negocio es la suma de su panel.

### Tipos

```ts
import type { FacetsResponse, TopCategoriesResponse } from './api-types'
import type { TopCategoriesParams } from './param-types'

// GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=…&start_date=…&end_date=…
type TopCategoriesRequest = TopCategoriesParams
type TopCategoriesResult = TopCategoriesResponse // = CategoryEntry[]

// GET /api/metrics/facets: solo se usa `business_types`
type BusinessTypesSource = FacetsResponse['business_types']
```

`CategoryEntry` (de `api-types.ts`), una fila de un panel:

| Campo | Tipo | Ejemplo real (B2B, sin fechas) | Columna | Cómo se muestra |
|---|---|---|---|---|
| `category` | `Category` | `"sales"` | `Category` | Primera letra en mayúscula → `Sales` |
| `operation_type` | `OperationType` | `"income"` | — | No se muestra. Siempre repite el `operation_type` de la petición |
| `total_amount` | `number` (2 decimales) | `557903.97` | `Total income` | `formatCurrency` → `$557,904` |
| — (calculado) | `number` | `90.64` | `Share of total` | `total_amount / suma del panel × 100` con `formatPercent` → `90.6%` |

- La lista viene ordenada de **mayor a menor** `total_amount`.
- **La API no devuelve el porcentaje sobre el total del grupo**: lo calcula el cliente. La suma de las filas del panel es el total real de ingresos de esa línea de negocio porque `limit` (5) es mayor o igual que el número de categorías de ingreso (2), así que no se corta ninguna. Esa misma suma es la barra de la gráfica.

### Parámetros (`TopCategoriesParams`)

| Parámetro | Tipo | Obligatorio en la spec | Valor que se envía | Lo que acepta la API |
|---|---|---|---|---|
| `operation_type` | `OperationType` | **Sí** | `'income'` | `income` o `outcome`. Por defecto **`outcome`** |
| `limit` | `number` | **Sí** | `5` | Entero de `1` a `20`. Por defecto `5`. `0`, `21` o `5.5` → 422 (`5.0` se acepta) |
| `business_type` | `BusinessType` | **Sí** | `'B2B'` en un panel y `'B2C'` en el otro | `B2B` o `B2C`, en mayúsculas (`b2b` → 422). Opcional en la API |
| `start_date` | `string` | No | El del rango aplicado de la funcionalidad 1 | `YYYY-MM-DD` |
| `end_date` | `string` | No | El del rango aplicado de la funcionalidad 1 | `YYYY-MM-DD` |

- `operation_type` **se envía siempre**: si se omite, la API devuelve las categorías de **gasto**.
- Funciones de `lib/` que lo implementan ([`components.md` §0.5](./components.md#05-funciones-puras-de-lib-regla-fe-08)): `buildQueryString`, `withShares`, `sumTotalAmount` y `formatCategoryName`.
- `business_type` no está en la lista del enunciado (tipo de operación, `limit` y fechas), pero sin él la API mezcla las dos líneas de negocio y no se pueden llenar los dos paneles. Se añadió en la Fase 2 (decisión del usuario).

Ejemplo de las dos queries de un rango:

```text
/api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B&start_date=2026-03-01&end_date=2026-03-31
/api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C&start_date=2026-03-01&end_date=2026-03-31
```

### Desajustes con el PM

| El PM dice | La API | Decisión de la spec |
|---|---|---|
| "Las 5 categorías de ingreso principales" | Los ingresos solo tienen **2** categorías: `sales` y `others`. Con `limit=5` llegan 2 filas como mucho | Se muestran las filas que lleguen, sin rellenar. La descripción dice `Top income categories (up to 5)`. Pregunta abierta Q2 |
| "Porcentaje sobre el total del grupo" | No lo devuelve | Se calcula en el cliente (arriba) |
| "Las categorías disponibles para cada grupo deben obtenerse del endpoint de facetas" | `facets` devuelve las 5 categorías juntas (ingresos y gastos) y **no las separa por línea de negocio**. No acepta parámetros | `facets` solo aporta `business_types`: un panel por valor (hoy `B2B` y `B2C`). Si `facets` no ha cargado o falla, se usan esos dos valores, que son fijos en el contrato. Las categorías de cada panel salen de `/categories/top`. Pregunta abierta Q3 |
| "Una nueva página" | No hay router en el frontend | Pestaña `B2B vs B2C` |

### Casos límite

Respuestas reales de la API (2026-11-14) y lo que debe mostrar la interfaz:

| # | Caso | Qué hace la API | Qué muestra la interfaz |
|---|---|---|---|
| 3.1 | **Sin filtro de fechas** | B2B: `sales` 557903.97 y `others` 57636.75. B2C: `sales` 574193.41 y `others` 68412.74 | Panel B2B: `Sales $557,904 90.6%`, `Others $57,637 9.4%`, `Total $615,541 100.0%`. Panel B2C: `Sales $574,193 89.4%`, `Others $68,413 10.6%`, `Total $642,606 100.0%`. Gráfica con las dos barras |
| 3.2 | **Panel vacío** (B2B el día `2025-11-01`) | B2B: 200 con `[]`. B2C: 200 con 1 fila (`sales` 5465.56) | **Panel B2B en estado vacío explícito**: cabecera de columnas y una fila `No B2B income in the selected period.`, sin fila `Total`. Panel B2C con su fila (`100.0%`) y el total. Gráfica con la barra B2B a `0` |
| 3.3 | **Los dos paneles vacíos** (`2020-01-01` → `2020-12-31`) | Las dos peticiones: 200 con `[]` | Los dos paneles en estado vacío (`No B2B income…`, `No B2C income…`). Gráfica: `No data available to display` |
| 3.4 | **Solo 1 categoría** (B2C en abril de 2026: `2026-04-01` → `2026-04-30`) | B2C: 1 fila (`sales` 53246.53). B2B: 2 filas | Panel B2C con 1 fila al `100.0%` y el total. Es normal, no es un error |
| 3.5 | **Nunca hay 5 filas** (`limit=5` o `limit=20`) | Como mucho 2 filas por panel | Las filas que lleguen. La descripción `up to 5` lo deja claro |
| 3.6 | **Se olvida `operation_type`** | 200 con 4 categorías de **gasto** (`others`, `operational`, `administrative`, `suppliers`), con `operation_type: "outcome"` | No debe ocurrir: el tipo lo hace obligatorio y la spec lo envía siempre. Sería un error silencioso, porque la API no avisa |
| 3.7 | **Se olvida `business_type`** | 200 con las dos líneas mezcladas (`sales` 1132097.38, `others` 126049.49) | No debe ocurrir: el tipo lo hace obligatorio |
| 3.8 | **Falla un panel** (p. ej. B2C) | Error de red o 5xx en esa petición | Panel B2C: `Could not load B2C income categories.` El panel B2B, normal. Gráfica: `Comparison unavailable: income data could not be loaded for every business line.` (no se compara con datos incompletos) |
| 3.9 | **Cargando** (al abrir la pestaña o al cambiar el rango) | — | Cada panel con su cabecera y 2 filas de `Skeleton`; la gráfica, con `Skeleton`. Si un panel falla mientras el otro carga, la gráfica muestra el error |
| 3.10 | **`facets` falla** | Error de red o 5xx | Se muestran igualmente los dos paneles (`B2B`, `B2C`) |
| 3.11 | **`facets.business_types` con un solo valor** | Hoy no puede ocurrir: `facets` describe el dataset completo, que tiene las dos líneas | Si ocurriera: un solo panel y una sola barra en la gráfica, que se pinta con normalidad |
| 3.12 | **Inicio > fin** en el filtro de fechas | No se pide (caso 1.4) | Los paneles siguen con el último rango válido |
| 3.13 | **Parámetros inválidos** (`limit=21`, `business_type=b2b`) | 422 `less_than_equal` / `literal_error` | No ocurre: los valores son fijos en la spec. Si ocurriera, el panel mostraría su estado de error |

## Preguntas abiertas para el PM

No bloquean la implementación: la spec ya tiene una solución provisional para cada una ([`components.md` §4](./components.md#4-preguntas-abiertas-para-el-pm)).

| # | Pregunta | Funcionalidad |
|---|---|---|
| Q1 | La API calcula la media de **todos** los meses anteriores del rango, no la de los 3 anteriores. ¿Es aceptable, o hay que cambiar el backend? | 2 |
| Q2 | Solo hay 2 categorías de ingreso. ¿Se esperaban más para el "top 5"? | 3 |
| Q3 | `facets` no separa las categorías por línea de negocio. ¿Es suficiente sacar las categorías de cada panel de `/categories/top`? | 3 |
