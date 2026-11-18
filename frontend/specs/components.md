# Especificación de componentes

> Spec de la capa de componentes para las tres funcionalidades del dashboard: filtro de rango de fechas, tabla de alertas de anomalías y vista B2B vs B2C. Los tipos vienen de [`api-types.ts`](./api-types.ts) y [`param-types.ts`](./param-types.ts), verificados contra `/docs` en la Fase 2. La evidencia de cada comportamiento de la API está en [`api-exploration.md`](./api-exploration.md).
>
> Esta spec **no** implementa nada: describe lo que hay que construir. Los ejemplos de valores son reales (API en marcha el 2026-11-14, sin filtro de fechas), pero el dataset se regenera a partir de la fecha de hoy, así que cambian con el tiempo.

## 0. Punto de partida

### 0.1 Componentes existentes

Revisado en `frontend/src` sobre el commit `0cf4626`.

| Componente | Archivo | Props | Cambia en esta spec |
|---|---|---|---|
| `DashboardHeader` | `components/dashboard/dashboard-header.tsx` | `period?: string` (por defecto `'2024 — Full Year'`) | **Sí**: muestra la etiqueta del rango aplicado (§1.6) |
| `KPIRow` | `components/dashboard/kpi-row.tsx` | `metrics: KPIMetrics \| null`, `loading?: boolean` | No: recibe los KPIs calculados con el rango |
| `KPICard` | `components/dashboard/kpi-card.tsx` | `label`, `value`, `helperText`, `icon`, `variant`, `loading?` | No |
| `IncomeOutcomeChart` | `components/dashboard/income-outcome-chart.tsx` | `data: MonthlyDataPoint[]`, `loading?: boolean` | No: recibe la serie calculada con el rango |
| `ProfitPercentChart` | `components/dashboard/profit-percent-chart.tsx` | `data: MonthlyDataPoint[]`, `loading?: boolean` | No: recibe la serie calculada con el rango |
| `App` | `App.tsx` | — | **Sí**: guarda todo el estado, hace todas las peticiones y calcula lo que reciben los componentes (§1.3) |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardAction`, `CardFooter` | `components/ui/card.tsx` | Props de `div` | No |
| `Skeleton` | `components/ui/skeleton.tsx` | Props de `div` | No |

### 0.2 Convenciones y reglas que hay que respetar

| Convención | Cómo se hace hoy | Evidencia |
|---|---|---|
| Archivos y nombres | Un componente por archivo en `components/dashboard/`, archivo en kebab-case (`kpi-row.tsx`) y export con nombre en PascalCase (`export function KPIRow`) | `components/dashboard/*` |
| Props | Interfaz `XxxProps` **no exportada**, justo encima del componente. Los tipos que comparten varios archivos van en `lib/` (§0.3) | `kpi-row.tsx:6`, `income-outcome-chart.tsx:16` |
| Imports | Alias `@/` entre carpetas; rutas relativas solo dentro de la misma carpeta (regla FE-03) | `.agents/rules/frontend.md` |
| Carga | Prop **`loading?: boolean`** (opcional, regla FE-05). Mientras carga se pinta la misma `Card` con `Skeleton` del tamaño final | `income-outcome-chart.tsx:50-62` |
| Sin datos | Mismo alto que el contenido, centrado, `text-muted-foreground text-sm`, texto `"No data available to display"` | `income-outcome-chart.tsx:74-76` |
| Valor no disponible | `'—'` | `kpi-row.tsx:16` |
| Error | Caja `rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground` | `App.tsx:52` |
| Contenedor | `Card className="border-border/60"` con `CardHeader` (`CardTitle` `text-base font-semibold` + `CardDescription`) y `CardContent` | `income-outcome-chart.tsx:67-71` |
| Gráficas | Recharts dentro de `ResponsiveContainer width="100%" height={280}`. Colores con variables CSS: `var(--chart-income)`, `var(--chart-1)`…`var(--chart-5)`, `var(--color-border)`, `var(--color-muted-foreground)` | `income-outcome-chart.tsx:78-119`, `index.css:25-32` |
| Formato | `formatCurrency` (USD sin decimales) y `formatPercent` (recibe un valor ya en %, 1 decimal) de `lib/financial-utils.ts` | `financial-utils.ts:67-78` |
| Cálculos | En funciones puras de `lib/` con su test; los componentes solo muestran datos ya calculados (regla FE-08) | `.agents/rules/frontend.md` |
| Estilo de código | Cada archivo mantiene su estilo (regla FE-04): `components/` con comillas simples y sin `;`; `App.tsx` y `financial-utils.ts` con comillas dobles y `;`. Los bloques de código de esta spec usan comillas simples sin `;`, pero al implementarlos se adaptan al archivo de destino | `.agents/rules/frontend.md` |
| Idioma | Todos los textos visibles en inglés (regla FE-07, C-3) | `index.html:2` |

**Lo que no existe y esta spec define (C-4):**

- **Componentes de formulario y tabla**: no hay `Input`, `Table`, `Tabs` ni `Button` en `components/ui/`. La spec usa **elementos HTML nativos** (`<input>`, `<table>`, `<button>`) con clases de Tailwind del proyecto. No se añaden dependencias ni componentes de shadcn.
- **Navegación**: no hay router. Las dos vistas se cambian con pestañas y estado de React (F3-1).
- **Gráfica de barras**: hoy solo se usan `LineChart`. La comparativa B2B vs B2C usa `BarChart` y `Cell` de Recharts, que ya está instalado.

### 0.3 Dónde va cada cosa al implementar

Los archivos de `frontend/specs/` son **el contrato**; la app no los importa, porque `tsconfig.app.json` solo incluye `src`. Al implementar:

| Qué | Archivo de la app | Contenido |
|---|---|---|
| Tipos de respuesta | `src/lib/api-types.ts` | Copia de `specs/api-types.ts`, importando los enums de `./financial-types` |
| Tipos de parámetros | `src/lib/param-types.ts` | Copia de `specs/param-types.ts` |
| Tipos compartidos de la UI | `src/lib/dashboard-types.ts` | `RequestState`, `DashboardTab`, `CategoryShare`, `BusinessIncomeTotal` (§0.4) |
| Funciones puras | `src/lib/dashboard-utils.ts` | Las de §0.5, con su test en `src/lib/dashboard-utils.test.ts` |
| `formatMonthYearLabel` | `src/lib/financial-utils.ts` | Ya existe pero es privada: hay que **exportarla** |

En la app se importa siempre con `@/lib/...` (FE-03). Los bloques de esta spec importan con `./api-types` y `./param-types` porque se compilan junto a los archivos de `specs/`.

### 0.4 Tipos compartidos de la UI

```ts
import type { BusinessType, CategoryEntry } from './api-types'

/** Estado de una petición. Mismo patrón para todas las peticiones de esta spec. */
type RequestState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T }

/** Pestaña visible del dashboard (§3.1). */
type DashboardTab = 'overview' | 'b2b-vs-b2c'

/** Fila de un panel B2B/B2C con su porcentaje ya calculado (§3.4). */
interface CategoryShare {
  /** Fila tal cual la devolvió la API. */
  entry: CategoryEntry
  /** `entry.total_amount / total del panel × 100`. Entre 0 y 100. */
  sharePercent: number
}

/** Valor de una barra de la gráfica B2B vs B2C (§3.5). */
interface BusinessIncomeTotal {
  /** Línea de negocio de la barra. */
  businessType: BusinessType
  /** Suma de `total_amount` de su panel. `0` si el panel está vacío. */
  totalIncome: number
}
```

### 0.5 Funciones puras de `lib/` (regla FE-08)

Todo cálculo que aparece en esta spec está en una de estas funciones. `App` las llama y pasa el resultado a los componentes.

```ts
import type { CategoryEntry, FacetsResponse, TopCategoriesResponse } from './api-types'
import type { AlertsParams, DateRangeFilter, TopCategoriesParams } from './param-types'

/** Query string (`?a=1&b=2`, o `''` si no hay nada) con solo los parámetros que tienen valor. Usa `URLSearchParams`. */
declare function buildQueryString(params: DateRangeFilter | AlertsParams | TopCategoriesParams): string
/** `true` si no hay fechas, si hay solo una, o si `start_date <= end_date` (comparación de strings `YYYY-MM-DD`). */
declare function isValidDateRange(range: DateRangeFilter): boolean
/** `'2025-11-01'` → `'Nov 1, 2025'`. `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })`. */
declare function formatDisplayDate(date: string): string
/** Etiqueta de la cabecera (tabla de §1.6). `available` es `null` si `facets` no ha cargado. */
declare function formatRangeLabel(applied: DateRangeFilter, available: Pick<FacetsResponse, 'min_date' | 'max_date'> | null): string
/** Número del input del umbral, o `null` si no es un número finito entre `0.01` y `1` (ambos incluidos). */
declare function parseThreshold(input: string): number | null
/** `0.3` → `'30.0%'`. Usa `formatPercent(threshold * 100)`, así que no arrastra errores de coma flotante (`0.07 * 100`). */
declare function formatThreshold(threshold: number): string
/** `'sales'` → `'Sales'`: primera letra en mayúscula. */
declare function formatCategoryName(category: CategoryEntry['category']): string
/** Suma de `total_amount` de las filas. `0` si está vacío. */
declare function sumTotalAmount(entries: TopCategoriesResponse): number
/** Cada fila con su `sharePercent` sobre la suma de las filas, en el mismo orden. `[]` si está vacío. */
declare function withShares(entries: TopCategoriesResponse): CategoryShare[]
```

Tests mínimos de `dashboard-utils.test.ts` (sin fechas fijas del dataset, regla TE-03; las fechas de los tests son literales inventados):

| Función | Casos |
|---|---|
| `buildQueryString` | Sin fechas → solo los parámetros obligatorios; con `start_date` y sin `end_date` → no aparece `end_date`; nunca aparece `=` con valor vacío |
| `isValidDateRange` | Sin fechas, solo una, iguales, inicio < fin → `true`; inicio > fin → `false` |
| `formatDisplayDate` | `'2025-11-01'` → `'Nov 1, 2025'` **también** con `TZ=America/New_York` (regla TE-04) |
| `formatRangeLabel` | Las 9 filas de la tabla de §1.6 |
| `parseThreshold` | `'0.3'` → `0.3`; `'0.01'` y `'1'` → válidos; `'0'`, `'1.01'`, `''`, `'abc'` → `null` |
| `formatThreshold` | `0.3` → `'30.0%'`; `0.07` → `'7.0%'`; `0.125` → `'12.5%'` |
| `sumTotalAmount` / `withShares` | Vacío → `0` / `[]`; una fila → `100`; dos filas → los porcentajes suman 100 |

## 1. Funcionalidad 1 — Filtro de rango de fechas

### 1.1 Qué ve el usuario

Debajo de la cabecera y de las pestañas hay una barra con dos inputs de fecha, **Start date** y **End date**, y al lado el rango disponible: `Available data: Nov 1, 2025 – Oct 28, 2026`. El rango filtra **todo** lo que se muestra en las dos pestañas: KPIs, gráficas, tabla de anomalías y vista B2B vs B2C. Es un **único filtro compartido** (decisión del usuario, Fase 3; F1-7, F3-7).

### 1.2 Árbol de componentes

```text
App                                   (estado, peticiones y cálculos)
├─ DashboardHeader                    (modificado, §1.6)
├─ DashboardTabs                      (nuevo, §3.1)
├─ DateRangeFilterBar                 (nuevo, §1.5)
└─ <div role="tabpanel">              (vista activa)
   ├─ 'overview':    caja de error de métricas (si hay), KPIRow, IncomeOutcomeChart,
   │                 ProfitPercentChart y AnomalyAlertsTable (§2)
   └─ 'b2b-vs-b2c':  BusinessComparisonView (§3)
```

### 1.3 Estado y peticiones en `App`

`App` es el **único** que guarda estado y hace peticiones. Los componentes nuevos no hacen `fetch`.

```ts
import type { AlertsResponse, BusinessType, FacetsResponse, TopCategoriesResponse } from './api-types'
import type { DateRangeFilter } from './param-types'
import type { FinancialMovement } from '../src/lib/financial-types'

interface DateRangeState {
  /** Lo que hay escrito ahora mismo en los dos inputs. Puede ser inválido. */
  draft: DateRangeFilter
  /** Último rango VÁLIDO. Es el único que se envía a la API y el que muestra la cabecera. Inicial: `{}`. */
  applied: DateRangeFilter
}

interface ThresholdState {
  /** Texto del input del umbral. Puede no ser válido. Inicial: `'0.3'`. */
  draft: string
  /** Último umbral VÁLIDO. Es el único que se envía a la API. Inicial: `0.3`. */
  applied: number
}

interface AppState {
  activeTab: DashboardTab
  dateRange: DateRangeState
  threshold: ThresholdState
  facets: RequestState<FacetsResponse>
  metrics: RequestState<FinancialMovement[]>
  alerts: RequestState<AlertsResponse>
  topCategories: Record<BusinessType, RequestState<TopCategoriesResponse>>
}
```

Estado inicial: `activeTab: 'overview'` y todas las peticiones en `{ status: 'loading' }`.

**Cuándo se pide cada cosa** (un efecto por petición):

| Petición | Se lanza cuando | Dependencias del efecto |
|---|---|---|
| `GET /api/metrics/facets` | Al montar `App`, una sola vez, en cualquier pestaña | `[]` |
| `GET /api/metrics` | `activeTab === 'overview'` | `[activeTab, dateRange.applied]` |
| `GET /api/metrics/alerts` | `activeTab === 'overview'` | `[activeTab, dateRange.applied, threshold.applied]` |
| `GET /api/metrics/categories/top` ×2 (B2B y B2C) | `activeTab === 'b2b-vs-b2c'` | `[activeTab, dateRange.applied]` |

**Reglas de las peticiones:**

1. Al empezar, el efecto pone su estado en `{ status: 'loading' }` (los componentes vuelven a mostrar `Skeleton`).
2. Cada efecto crea un `AbortController` y lo aborta en su *cleanup*. Así, al cambiar el rango, el umbral o la pestaña, la petición anterior se cancela y su respuesta nunca pisa a la nueva (C-2). Un `AbortError` no cambia el estado.
3. **No hay caché**: al volver a una pestaña se vuelven a pedir sus datos con el rango aplicado.
4. URL: `` `${import.meta.env.VITE_API_BASE_URL ?? ''}${ruta}${buildQueryString(params)}` ``, igual que `App.tsx:13-16`. Los nombres de los parámetros son los de `param-types.ts` (`start_date`, no `startDate`).
5. `!response.ok` (incluido un 422) → `{ status: 'error' }`. No se muestra el `detail` de la API al usuario (C-1).

**Reglas del rango:**

1. Un input vacío es `undefined` en `DateRangeFilter`, **nunca** `''`, y `buildQueryString` lo omite (`start_date=` vacío da 422; F1-2).
2. Cada vez que cambia `dateRange.draft`:
   - Si `isValidDateRange(draft)`, `applied = draft` y los efectos vuelven a pedir los datos de la pestaña activa.
   - Si no, `applied` **no cambia**: no hay petición y se siguen viendo los datos del último rango válido (F1-4).
3. No hay botón "Apply": el rango se aplica en cuanto cambia un input y es válido.

### 1.4 Funcionalidad 1 en la pestaña Overview

`App` calcula con `metrics` lo que reciben los componentes existentes (F1-7, F1-8):

| `metrics` | `KPIRow` | `IncomeOutcomeChart` / `ProfitPercentChart` | Caja de error de métricas |
|---|---|---|---|
| `loading` | `metrics={null}`, `loading` | `data={[]}`, `loading` | No |
| `error` | `metrics={null}` → muestra `'—'` | `data={[]}` → `"No data available to display"` | Sí: `Could not load financial data. Check the backend API.` (el texto actual), al principio del panel de Overview, encima de `KPIRow` |
| `success` con `[]` | `computeKPIs([])` → `$0` y `0.0%` | `computeMonthlyData([])` → `"No data available to display"` | No |
| `success` con datos | `computeKPIs(data)` | `computeMonthlyData(data)` | No |

La caja de error de métricas y la de la tabla de anomalías (§2) son independientes: si fallan las dos peticiones, se ven las dos, cada una en su sección.

### 1.5 `DateRangeFilterBar` (nuevo)

Archivo: `components/dashboard/date-range-filter-bar.tsx`.

```ts
import type { FacetsResponse } from './api-types'
import type { DateRangeFilter } from './param-types'

interface DateRangeFilterBarProps {
  /** Valor actual de los inputs (`DateRangeState.draft`). */
  value: DateRangeFilter
  /** `isValidDateRange(value)`, calculado por `App`. */
  isValid: boolean
  /** Estado de `/api/metrics/facets`. Da el rango disponible del dataset. */
  facets: RequestState<FacetsResponse>
  /** Se llama con el nuevo valor completo cuando cambia un input. Un input borrado llega como `undefined`. */
  onChange: (value: DateRangeFilter) => void
}
```

**Disposición:** `<div className="flex flex-wrap items-end gap-x-4 gap-y-2">` con, en este orden: el bloque de Start date, el de End date y el texto del rango disponible (`self-center`). Cada bloque es `flex flex-col gap-1` con el `<label>` (`text-xs text-muted-foreground`) encima del input. En pantallas estrechas los bloques bajan de línea solos. El mensaje de error ocupa una línea propia debajo (`w-full`).

**Elementos:**

| Elemento | Detalle |
|---|---|
| Input "Start date" | `<input type="date" id="start-date">` con `<label htmlFor="start-date">Start date</label>`. Clases `h-9 rounded-md border border-border bg-background px-3 text-sm` |
| Input "End date" | Igual, con `id="end-date"` y la etiqueta `End date` |
| Rango disponible | `Available data: {formatDisplayDate(min_date)} – {formatDisplayDate(max_date)}`, en `text-xs text-muted-foreground` |
| Mensaje de error | `<p id="date-range-error" role="alert">` en `text-xs`, color `destructive` |

**Atributos `min` / `max`.** Los límites cruzados se aplican **siempre**; los del dataset, solo si `facets` cargó:

| Input | `min` | `max` |
|---|---|---|
| Start date | `facets.data.min_date` (si cargó) | `value.end_date` si existe; si no, `facets.data.max_date` (si cargó) |
| End date | `value.start_date` si existe; si no, `facets.data.min_date` (si cargó) | `facets.data.max_date` (si cargó) |

**Cambios en los inputs.** En el `onChange` de cada input:

- Valor `'YYYY-MM-DD'` → `onChange({ ...value, start_date: valor })` (o `end_date`). El input ya entrega ese formato (F1-1).
- Valor `''` y `event.target.validity.badInput === false` → el usuario borró la fecha → ese campo pasa a `undefined`.
- Valor `''` y `event.target.validity.badInput === true` → la fecha está a medio escribir (algunos navegadores emiten `''` mientras se edita un segmento) → **no se llama** a `onChange`. Así no se lanza una petición del dataset completo mientras el usuario escribe.

Una fecha completa escrita a mano fuera de los `min`/`max` (`validity.rangeOverflow` o `rangeUnderflow`) **sí** se pasa a `onChange`: los atributos solo limitan el selector. Lo único que no se envía es una fecha a medio escribir (`badInput`) o un rango con inicio > fin.

Si `isValid` es `false`, los dos inputs llevan `aria-invalid="true"` y `aria-describedby="date-range-error"`.

**Estados (renderizado condicional):**

| Situación | Texto del rango disponible | Mensaje de error | Datos de la página |
|---|---|---|---|
| `facets` cargando | `Skeleton` de `h-3 w-48` | — | Se piden igualmente: no dependen de `facets` |
| `facets` con error | `Available date range could not be loaded.` | — | Normales |
| Sin fechas | `Available data: Nov 1, 2025 – Oct 28, 2026` (F1-5) | — | Dataset completo |
| **Solo Start date** | Igual | — | Desde esa fecha hasta el final del dataset: solo se envía `start_date` (F1-3) |
| **Solo End date** | Igual | — | Desde el principio del dataset hasta esa fecha: solo se envía `end_date` (F1-3) |
| Las dos fechas, inicio ≤ fin | Igual | — | Rango con los dos extremos incluidos. Inicio = fin es válido (un solo día) |
| **Inicio > fin** (escrito a mano: los `min`/`max` lo impiden en el selector) | Igual | `Start date must be on or before end date.` | **Sin cambios**: los del último rango válido, sin petición (F1-4) |
| Rango válido sin datos (fuera de `min_date`–`max_date`) | Igual | — | Estados vacíos de cada componente (F1-6) |

### 1.6 `DashboardHeader` (modificado)

Sus props no cambian (`period?: string`). `App` le pasa siempre `period={formatRangeLabel(dateRange.applied, facetsRange)}`, donde `facetsRange` es `{ min_date, max_date }` si `facets` cargó y `null` si no. Deja de usarse el `"2024 - Full Year"` fijo de `App.tsx:49` (F1-9, hallazgo A6).

| `applied` | `facets` | Etiqueta |
|---|---|---|
| Sin fechas | Cargado | `Nov 1, 2025 – Oct 28, 2026` (de `min_date` a `max_date`) |
| Sin fechas | Cargando o con error | `All available data` |
| Solo `start_date`, ≤ `max_date` | Cargado | `Mar 1, 2026 – Oct 28, 2026` (hasta `max_date`) |
| Solo `start_date`, > `max_date` | Cargado | `From Dec 1, 2026` (para no mostrar un rango al revés) |
| Solo `start_date` | Cargando o con error | `From Mar 1, 2026` |
| Solo `end_date`, ≥ `min_date` | Cargado | `Nov 1, 2025 – Mar 31, 2026` (desde `min_date`) |
| Solo `end_date`, < `min_date` | Cargado | `Until Oct 31, 2025` |
| Solo `end_date` | Cargando o con error | `Until Mar 31, 2026` |
| Las dos fechas | Cualquiera | `Mar 1, 2026 – Mar 31, 2026` |

Las fechas se formatean con `formatDisplayDate`. ⚠️ Su `timeZone: 'UTC'` es obligatorio: `new Date('2025-11-01')` es medianoche UTC y, sin él, en zonas UTC− se mostraría el 31 de octubre (regla FE-09).

**Regla FE-10:** la etiqueta del período está en dos sitios. Además de cambiar `App.tsx:49`, el valor por defecto `'2024 — Full Year'` de `dashboard-header.tsx:7` pasa a ser `'All available data'`.

## 2. Funcionalidad 2 — Tabla de alertas de anomalías

### 2.1 Qué ve el usuario

En la pestaña **Overview**, debajo de las dos gráficas y a todo el ancho, hay una tarjeta **Spending anomalies** con un input numérico para el umbral y una tabla con los meses en que el gasto subió por encima de lo esperado. La tabla respeta el rango de fechas aplicado (§1).

### 2.2 Umbral y petición

**Reglas del umbral** (mismo patrón que el rango de fechas; estado en `AppState.threshold`, §1.3):

1. Valor inicial: `draft = '0.3'`, `applied = 0.3` (brief del PM).
2. Cada vez que cambia `draft`: si `parseThreshold(draft)` no es `null`, `applied` toma ese valor y se vuelven a pedir las alertas. Si es `null` (vacío, no numérico, menor que `0.01` o mayor que `1`), `applied` **no cambia** y no hay petición.
3. La API aceptaría más valores (`>= 0`, sin máximo; F2-4). El rango `0.01`–`1` es del PM y solo lo aplica el frontend.

`GET /api/metrics/alerts` con un `AlertsParams`:

| Parámetro | Valor |
|---|---|
| `threshold` | `threshold.applied` (siempre se envía) |
| `start_date` / `end_date` | Los de `dateRange.applied`, solo los que tienen valor (F2-6) |
| `group_by`, `business_type` | **No se envían**: meses (`group_by=month` por defecto) y el negocio completo (F2-7) |

Cuándo se pide: tabla de §1.3.

### 2.3 `AnomalyAlertsTable` (nuevo)

Archivo: `components/dashboard/anomaly-alerts-table.tsx`.

```ts
import type { AlertsResponse } from './api-types'

interface AnomalyAlertsTableProps {
  /** Filas que devolvió la API, en su orden (cronológico). `[]` mientras carga o con error. */
  alerts: AlertsResponse
  /** `true` mientras se piden las alertas. */
  loading?: boolean
  /** `true` si la petición falló. */
  error: boolean
  /** Texto del input del umbral (`threshold.draft`). */
  thresholdInput: string
  /** `parseThreshold(thresholdInput) !== null`, calculado por `App`. */
  thresholdInputValid: boolean
  /** `formatThreshold(threshold.applied)`, p. ej. `'30.0%'`: umbral con el que se calcularon las filas. */
  appliedThresholdLabel: string
  /** Se llama con el texto del input cada vez que cambia. */
  onThresholdInputChange: (value: string) => void
}
```

**Estructura:**

- `Card className="border-border/60"`.
- `CardHeader`:
  - `CardTitle`: `Spending anomalies`.
  - `CardDescription`: `Months whose outcome exceeds the average of all previous months in the selected range by more than the threshold. The first month of the range is never flagged.`
  - Input del umbral, a la derecha con `CardAction`.
- `CardContent`: la tabla o el estado que toque.

**Input del umbral:**

| Atributo | Valor |
|---|---|
| Elemento | `<input type="number" id="alert-threshold">` con `<label htmlFor="alert-threshold">Alert threshold</label>`, mismas clases que los inputs de fecha y `w-24` |
| `min` / `max` | `0.01` / `1` |
| `step` | `0.01`. Decisión de la interfaz: el brief no lo fija, pero el `step` por defecto de HTML es `1` y el navegador marcaría `0.3` como inválido |
| `value` / `onChange` | `thresholdInput` / `onThresholdInputChange(event.target.value)`. Un texto no numérico llega como `''` y se trata como inválido |
| Ayuda | Junto al input, `text-xs text-muted-foreground`: `= {appliedThresholdLabel} increase` (p. ej. `= 30.0% increase`) |
| Error | Si `thresholdInputValid` es `false`: `aria-invalid="true"`, `aria-describedby="alert-threshold-error"` y, debajo, `<p id="alert-threshold-error" role="alert">Threshold must be a number between 0.01 and 1.</p>` |

**Columnas** (en este orden; F2-2):

| Columna (texto en la cabecera) | Columna del PM | Campo de `AlertEntry` | Formato | Ejemplo |
|---|---|---|---|---|
| `Period` | período | `period` (`YYYY-MM`) | `formatMonthYearLabel(period)` | `Mar 2026` |
| `Recorded outcome` | outcome registrado | `outcome_total` | `formatCurrency` | `$88,077` |
| `Avg. of previous months` | media móvil de los 3 períodos anteriores | `baseline_average` | `formatCurrency` | `$55,334` |
| `Increase` | incremento porcentual | `increase_ratio` | `'+' + formatPercent(increase_ratio * 100)` (F2-3) | `+59.2%` |

- `Period` usa `formatMonthYearLabel` (la misma función que el eje de las gráficas, que hay que exportar; §0.3). No se usa `new Date('YYYY-MM')`, por la regla FE-09.
- `Increase` se muestra tal cual llega. **No se recalcula** con las otras dos columnas: podría diferir en el cuarto decimal (Fase 2).
- Un mes cuyo aumento sea **exactamente igual** al umbral no aparece: la API compara con `>` (F2-8). Por el redondeo a 4 decimales, un valor mostrado puede coincidir con el umbral (p. ej. `+30.0%` con umbral `30.0%`), y es correcto.
- Filas en el orden de la API (cronológico), sin paginación. Con el dataset actual (12 meses, y el primero nunca se marca) hay como mucho 11 filas.
- `<table className="w-full text-sm">`; `<thead>` en `text-xs text-muted-foreground`, alineado a la izquierda; columnas numéricas alineadas a la derecha con `tabular-nums`.

**⚠️ La columna de la media no es la del PM.** El PM pide la "media móvil de los 3 períodos anteriores", pero la API devuelve en `baseline_average` la media de **todos** los meses anteriores dentro del rango (F2-1; en `2026-03`, 55334.29 frente a 59977.58). Siguiendo la decisión de la Fase 1, se usa `/alerts` tal cual y la cabecera describe lo que de verdad se muestra (`Avg. of previous months`). Queda como **pregunta abierta para el PM** (§4, Q1).

**Estados (renderizado condicional):**

| Situación | Qué se muestra en `CardContent` |
|---|---|
| `loading` | La cabecera de la tabla y 3 filas de `Skeleton` (`h-4`). También al cambiar el umbral o el rango: las filas anteriores se sustituyen por los `Skeleton` |
| `error` | Caja de error del proyecto: `Could not load anomaly alerts. Check the backend API.` La tarjeta y el input siguen visibles |
| **`alerts` vacío** (`[]`, respuesta 200) | **Estado vacío explícito (F2-5)**: la tabla **no desaparece**. Se mantiene la cabecera y una sola fila `<td colSpan={4}>`, centrada, `text-muted-foreground`, con `No spending anomalies above {appliedThresholdLabel} in the selected period.` (p. ej. `No spending anomalies above 30.0% in the selected period.`) |
| `alerts` con filas | La tabla con una fila por `AlertEntry` |
| Umbral del input inválido | Lo que hubiera antes (filas, vacío o error) **sin cambios**, más el mensaje de error del input. La ayuda `= …% increase` sigue mostrando el umbral aplicado, para que se sepa con qué umbral se calcularon las filas |

Cuándo sale vacía aunque haya gasto (todos dan `[]` con 200, no error):

- El umbral es más alto que cualquier aumento del rango. Ojo: con el dataset actual y **sin filtro**, ningún umbral válido (`0.01`–`1`) deja la tabla vacía, porque `2025-12` sube un +149.7 %. Sí sale vacía, por ejemplo, con el rango `2026-03-01` → `2026-03-31`, o con `2026-07-01` → `2026-10-28` y umbral `0.4` (comprobados).
- El rango aplicado cae dentro de un solo mes natural: el primer mes nunca se marca (F2-6).
- El rango no tiene datos.

## 3. Funcionalidad 3 — Vista comparativa B2B vs B2C

### 3.1 `DashboardTabs` (nuevo)

Archivo: `components/dashboard/dashboard-tabs.tsx`. No hay router (F3-1): la pestaña activa es `AppState.activeTab`.

```ts
interface DashboardTabsProps {
  /** Pestaña visible. Inicial en `App`: `'overview'`. */
  activeTab: DashboardTab
  /** Se llama al pulsar una pestaña. */
  onTabChange: (tab: DashboardTab) => void
}
```

| Detalle | Valor |
|---|---|
| Pestañas (en este orden) | `Overview` → `'overview'` (`id="tab-overview"`), `B2B vs B2C` → `'b2b-vs-b2c'` (`id="tab-b2b-vs-b2c"`) |
| Elementos | `<div role="tablist" aria-label="Dashboard views">` con un `<button type="button" role="tab" aria-selected={…} aria-controls="dashboard-panel">` por pestaña |
| Panel | El contenedor de la vista activa es `<div role="tabpanel" id="dashboard-panel" aria-labelledby={id de la pestaña activa}>` |
| Estilo | Botones `px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary`. Activa: `border-b-2 border-primary text-foreground`. Inactiva: `text-muted-foreground hover:text-foreground` |
| Teclado | Tab y Enter/Espacio, como cualquier botón. La navegación con flechas no es necesaria |
| URL | No cambia. Al recargar la página se vuelve a `Overview` |
| Al cambiar | Se cambia la vista del panel. El rango (`dateRange`) y el umbral (`threshold`) **se conservan**. Las peticiones las gestionan los efectos de §1.3 |

### 3.2 Peticiones de la vista

Dos peticiones independientes a `GET /api/metrics/categories/top`, una por línea de negocio, con un `TopCategoriesParams` (cuándo se lanzan: tabla de §1.3):

| Parámetro | Panel B2B | Panel B2C |
|---|---|---|
| `operation_type` | `'income'` (siempre: si se omite, la API devuelve gastos; F3-3) | `'income'` |
| `limit` | `5` | `5` |
| `business_type` | `'B2B'` | `'B2C'` |
| `start_date` / `end_date` | Los de `dateRange.applied`, solo los que tienen valor (F3-7) | Igual |

**Qué paneles hay (F3-6).** `facets` decide qué líneas de negocio se muestran; las **categorías** de cada panel no salen de `facets` (no las separa por línea de negocio ni por tipo de operación), sino de la respuesta de `/categories/top` de ese panel.

`App` calcula una sola lista, `businessTypes`, y de ella salen tanto los paneles como las barras:

- `facets` cargado → `facets.data.business_types` (hoy `['B2B', 'B2C']`, en orden alfabético).
- `facets` cargando o con error → `['B2B', 'B2C']`, los dos valores fijos de `BusinessType` en el contrato.

`AppState.topCategories` tiene siempre las dos claves; solo se muestran las de `businessTypes`. Hoy `facets` siempre devuelve las dos líneas (describe el dataset completo). Si devolviera una sola, habría un solo panel y una sola barra, y la gráfica se pinta con normalidad.

### 3.3 `BusinessComparisonView` (nuevo)

Archivo: `components/dashboard/business-comparison-view.tsx`. Solo coloca los paneles y la gráfica: no hace peticiones ni cálculos.

```ts
import type { BusinessType } from './api-types'

interface BusinessPanelData {
  businessType: BusinessType
  /** `withShares(entries)`. `[]` mientras carga, con error o si no hay datos. */
  rows: CategoryShare[]
  /** `sumTotalAmount(entries)`. */
  groupTotal: number
  loading?: boolean
  error: boolean
}

interface BusinessComparisonViewProps {
  /** Un panel por cada valor de `businessTypes` (§3.2), en ese orden. */
  panels: BusinessPanelData[]
  /** Una barra por panel, en el mismo orden: `{ businessType, totalIncome: groupTotal }`. */
  incomeTotals: BusinessIncomeTotal[]
  /** `true` si algún panel está cargando. */
  chartLoading?: boolean
  /** `true` si algún panel falló. */
  chartError: boolean
}
```

Disposición: `<section aria-label="B2B vs B2C comparison" className="flex flex-col gap-4">` con un `grid grid-cols-1 lg:grid-cols-2 gap-4` para los paneles (uno junto al otro en pantallas grandes, uno debajo del otro en móvil) y, debajo, `BusinessIncomeChart` a todo el ancho.

```text
┌──────────── B2B income ────────────┐ ┌──────────── B2C income ────────────┐
│ Category   Total income   Share    │ │ Category   Total income   Share    │
│ Sales      $557,904       90.6%    │ │ Sales      $574,193       89.4%    │
│ Others     $57,637         9.4%    │ │ Others     $68,413        10.6%    │
│ Total      $615,541      100.0%    │ │ Total      $642,606      100.0%    │
└────────────────────────────────────┘ └────────────────────────────────────┘
┌──────────────────────── Total income: B2B vs B2C ─────────────────────────┐
│     ▇▇▇▇▇▇▇▇ $615,541                  ▇▇▇▇▇▇▇▇▇ $642,606                 │
│         B2B                                  B2C                          │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3.4 `TopCategoriesPanel` (nuevo)

Archivo: `components/dashboard/top-categories-panel.tsx`. Se usa una vez por línea de negocio, con los campos de un `BusinessPanelData`.

```ts
import type { BusinessType } from './api-types'

interface TopCategoriesPanelProps {
  /** Línea de negocio del panel. Aparece en el título y en los mensajes. */
  businessType: BusinessType
  /** Filas con su porcentaje, en el orden de la API (mayor `total_amount` primero). */
  rows: CategoryShare[]
  /** Suma de `total_amount` de las filas. */
  groupTotal: number
  /** `true` mientras se pide este panel. */
  loading?: boolean
  /** `true` si la petición de este panel falló. */
  error: boolean
}
```

**Estructura:** `Card className="border-border/60"`; `CardTitle` `{businessType} income` (p. ej. `B2B income`); `CardDescription` `Top income categories (up to 5)`; en `CardContent`, la tabla (mismas clases que la de §2.3).

**Columnas:**

| Columna | Origen | Formato |
|---|---|---|
| `Category` | `row.entry.category` | `formatCategoryName` (`sales` → `Sales`) |
| `Total income` | `row.entry.total_amount` | `formatCurrency` |
| `Share of total` | `row.sharePercent` (F3-4) | `formatPercent` (1 decimal) |

- Una fila final `Total`, en `font-medium` y con borde superior: `formatCurrency(groupTotal)` y `100.0%`.
- **Se muestran las filas que lleguen, sin rellenar hasta 5** (F3-2). Con ingresos la API devuelve como mucho 2 (`Sales` y `Others`), y un rango corto puede dar 1 o ninguna. Por eso la descripción dice "up to 5".
- `groupTotal` es el total real de ingresos de la línea de negocio porque `limit` (5) es mayor o igual que el número de categorías de ingreso (2), así que no se corta ninguna (Fase 2).

**Estados (renderizado condicional), de cada panel por separado:**

| Situación | Qué se muestra en `CardContent` |
|---|---|
| `loading` | La cabecera de la tabla y 2 filas de `Skeleton` (`h-4`) |
| `error` | Caja de error del proyecto: `Could not load {businessType} income categories.` (p. ej. `Could not load B2C income categories.`). El otro panel no se ve afectado |
| **`rows` vacío** (`[]`, respuesta 200) | **Estado vacío explícito (F3-8)**: se mantiene la cabecera de la tabla y una sola fila `<td colSpan={3}>`, centrada, `text-muted-foreground`, con `No {businessType} income in the selected period.` (p. ej. `No B2B income in the selected period.`). No se muestra la fila `Total` |
| 1 fila | La fila (con `100.0%`) y la fila `Total` |
| 2 filas o más | Las filas en el orden de la API y la fila `Total` |

Un panel puede estar vacío mientras el otro tiene datos (p. ej. un día con ingresos B2C pero no B2B). Cada panel decide su estado con su propia respuesta.

### 3.5 `BusinessIncomeChart` (nuevo)

Archivo: `components/dashboard/business-income-chart.tsx`. Un único gráfico que compara el total de ingresos de cada línea de negocio. Usa la suma de cada panel, sin petición extra (F3-5).

```ts
interface BusinessIncomeChartProps {
  /** Una entrada por línea de negocio, en el orden de los paneles. */
  totals: BusinessIncomeTotal[]
  /** `true` si algún panel está cargando. */
  loading?: boolean
  /** `true` si algún panel falló. */
  error: boolean
}
```

| Detalle | Valor |
|---|---|
| Contenedor | `Card className="border-border/60"`, `CardTitle` `Total income: B2B vs B2C`, `CardDescription` `Sum of income across all categories in the selected period` |
| Gráfica | `BarChart` de Recharts con `data={totals}`, dentro de `ResponsiveContainer width="100%" height={280}`. Una `Bar dataKey="totalIncome" maxBarSize={80}` con un `<Cell>` por entrada para el color |
| Colores | B2B: `var(--chart-1)`; B2C: `var(--chart-2)` |
| Ejes | Eje X con `dataKey="businessType"` (`B2B`, `B2C`). Eje Y con el formato de `income-outcome-chart.tsx` (`$…k`). Mismos estilos de ejes y `CartesianGrid` que esa gráfica |
| Leyenda | Ninguna: el eje X ya nombra cada barra |
| Tooltip | Propio, con el mismo estilo de caja que el `CustomTooltip` de `income-outcome-chart.tsx`: `{businessType}: {formatCurrency(totalIncome)}` |

**Estados** (se evalúan en este orden; gana el primero que se cumpla):

| Situación | Qué se muestra |
|---|---|
| `error` (algún panel falló, sea uno o los dos) | `Comparison unavailable: income data could not be loaded for every business line.`, centrado en `h-[280px]`, `text-muted-foreground text-sm`. No se pinta una comparación con datos incompletos |
| `loading` (algún panel cargando) | `Skeleton` de `h-[280px] w-full rounded-lg`, como las gráficas existentes |
| Todos los totales son `0` (todos los paneles vacíos) | `No data available to display`, como las gráficas existentes |
| Algún panel vacío y otro con datos | La gráfica, con la barra del panel vacío a `0` (F3-8) |
| Todos con datos | La gráfica con todas las barras |

## 4. Preguntas abiertas para el PM

Desajustes entre el brief y la API que esta spec resuelve de forma provisional. No bloquean la implementación, pero el PM debería confirmarlos.

| # | Pregunta | Solución provisional en esta spec |
|---|---|---|
| Q1 | La tabla de anomalías pide la "media móvil de los 3 períodos anteriores", pero la API devuelve la media de **todos** los períodos anteriores del rango (F2-1). ¿Es aceptable, o hay que cambiar el backend? | Se muestra `baseline_average` tal cual, con la cabecera `Avg. of previous months` (§2.3) |
| Q2 | Se pide el "top 5" de categorías de ingreso, pero solo existen 2 (`sales` y `others`) (F3-2). ¿Se esperaban más categorías de ingreso? | Se muestran las filas que lleguen, con la descripción "up to 5" (§3.4) |
| Q3 | Se pide sacar de `facets` las categorías de cada grupo, pero `facets` no las separa por línea de negocio (F3-6) | `facets` solo decide qué paneles hay; las categorías salen de `/categories/top` (§3.2) |

## 5. Trazabilidad con `api-exploration.md`

Cada desajuste entre el PM y la API de la Fase 1 (sección 7 de [`api-exploration.md`](./api-exploration.md)) y dónde lo resuelve esta spec.

| Desajuste | Tema | Dónde se resuelve |
|---|---|---|
| F1-1 | Fechas en `YYYY-MM-DD` | §1.5, cambios en los inputs: `<input type="date">` ya entrega ese formato |
| F1-2 | Input vacío = parámetro omitido | §1.3, reglas del rango 1 y `buildQueryString` (§0.5) |
| F1-3 | Un solo input relleno | §1.5, tabla de estados: filas "Solo Start date" y "Solo End date" |
| F1-4 | Inicio > fin | §1.3, regla del rango 2, y §1.5, tabla de estados |
| F1-5 | Rango disponible junto a los inputs | §1.5: texto `Available data: …` y atributos `min`/`max` |
| F1-6 | Fechas fuera del rango | §1.5: `min`/`max` y fila "Rango válido sin datos" |
| F1-7 | Filtrar todo lo que se muestra | §1.1 (filtro compartido), §1.4, §2.2 y §3.2 |
| F1-8 | Extensión de `/api/metrics` | §1.4: se usan los `start_date`/`end_date` que ya existen |
| F1-9 | Etiqueta "2024 - Full Year" | §1.6, `DashboardHeader` (los dos sitios, regla FE-10) |
| F2-1 | Media de 3 períodos frente a media de todos | §2.3, aviso de la columna, y §4, Q1 |
| F2-2 | Columnas del PM → campos de la API | §2.3, tabla de columnas |
| F2-3 | Incremento porcentual frente a ratio | §2.3, columna `Increase` (`increase_ratio * 100`) |
| F2-4 | Umbral 0.01–1.0 frente a `>= 0` | §2.2, reglas del umbral, y §2.3, input |
| F2-5 | Estado vacío explícito | §2.3, tabla de estados: fila "`alerts` vacío" |
| F2-6 | Respetar el rango; meses parciales | §2.2, petición, y §2.3, "Cuándo sale vacía" |
| F2-7 | Períodos mensuales | §2.2, petición: `group_by` no se envía |
| F2-8 | Comparación estricta `>` | §2.3, notas de las columnas |
| F2-9 | `AlertsResponse` es una lista | §2.3, props: `alerts: AlertsResponse` (tipo de la Fase 2) |
| F3-1 | "Nueva página" sin router | §3.1, `DashboardTabs` |
| F3-2 | Top 5 con solo 2 categorías | §3.4 y §4, Q2 |
| F3-3 | `operation_type` por defecto `outcome` | §3.2, tabla de parámetros |
| F3-4 | % sobre el total del grupo | §3.4, columna `Share of total` (`withShares`, §0.5) |
| F3-5 | Total de cada grupo para la gráfica | §3.5, `BusinessIncomeChart` |
| F3-6 | Categorías por grupo en `facets` | §3.2, "Qué paneles hay", y §4, Q3 |
| F3-7 | Filtro de fechas de la comparativa | §3.2, tabla de parámetros (filtro compartido de §1) |
| F3-8 | Panel sin datos | §3.4 y §3.5, tablas de estados |
| F3-9 | `TopCategoriesResponse` es una lista | §1.3 (`AppState.topCategories`) y §0.5 (`withShares`, `sumTotalAmount`) |
| C-1 | Error 422 | §1.3, reglas de las peticiones |
| C-2 | Respuestas desordenadas | §1.3, reglas de las peticiones (`AbortController`) |
| C-3 | Textos en inglés | §0.2, convenciones (regla FE-07); todos los textos de la spec están en inglés |
| C-4 | Sin componentes de tabla ni de input | §0.2, "Lo que no existe y esta spec define" |
