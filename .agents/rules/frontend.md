---
name: frontend
description: Estructura, naming, estilo, interfaz y manejo de fechas al editar el frontend React
scope: frontend/src/**
---

# Reglas de frontend

Aplican a `frontend/src/**`: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts y shadcn/ui.

## FE-01 · Separa primitivas de UI y componentes de negocio

**Regla:** Crea los componentes de negocio nuevos en `frontend/src/components/dashboard/`. No añadas lógica de negocio, llamadas a la API ni tipos financieros a `frontend/src/components/ui/`, que es solo para primitivas de shadcn/ui.

**Por qué:** [`components.json`](../../frontend/components.json) define el alias `ui` para shadcn/ui. `ui/card.tsx` y `ui/skeleton.tsx` son genéricos y no conocen los datos, mientras que `dashboard/` concentra lo específico del producto (hallazgo A1).

**✅ Haz:** como `dashboard/kpi-card.tsx`, que importa `Card` y `Skeleton` de `@/components/ui/*` y añade encima la lógica de variantes de KPI.

**❌ Evita:** añadir a `ui/card.tsx` una prop como `variant="income"`, o importar `financial-types` desde `components/ui/`.

**Cómo comprobarlo:** `grep -rn "financial-" frontend/src/components/ui` no devuelve nada.

## FE-02 · Naming y declaración de componentes

**Regla:** Nombra los archivos de componentes en `kebab-case`. Exporta cada componente en `PascalCase` con `export function` nombrado y tipa sus props con `interface <Componente>Props`. No uses `export default`, salvo en `App.tsx`.

**Por qué:** los 5 archivos de `components/dashboard/` siguen este patrón, y solo [`App.tsx`](../../frontend/src/App.tsx) usa `export default` porque lo importa [`main.tsx`](../../frontend/src/main.tsx) (hallazgo N1).

**✅ Haz:** `kpi-card.tsx` → `export function KPICard({ ... }: KPICardProps)` con `interface KPICardProps { ... }`.

**❌ Evita:** `KpiCard.tsx`, `export default function KpiCard`, o props tipadas en línea (`({ label }: { label: string })`).

**Cómo comprobarlo:** `grep -rn "export default" frontend/src` solo devuelve `App.tsx`.

## FE-03 · Imports con el alias `@/`

**Regla:** Usa el alias `@/` (que apunta a `frontend/src/`) para importar entre carpetas. Usa rutas relativas solo dentro de la misma carpeta.

**Por qué:** el alias está definido en [`tsconfig.app.json:12-14`](../../frontend/tsconfig.app.json#L12-L14) y [`vite.config.ts`](../../frontend/vite.config.ts), y el código ya lo sigue así (hallazgo N2).

**✅ Haz:** `import { formatCurrency } from '@/lib/financial-utils'`. Dentro de la misma carpeta: `import { KPICard } from './kpi-card'` ([`kpi-row.tsx:1`](../../frontend/src/components/dashboard/kpi-row.tsx#L1)).

**❌ Evita:** `import { formatCurrency } from '../../lib/financial-utils'`.

**Cómo comprobarlo:** `grep -rn "from '\.\./\|from \"\.\./" frontend/src` no devuelve nada.

## FE-04 · Respeta el estilo de cada archivo y no reformatees

**Regla:** No hay formateador configurado. Respeta las comillas y los `;` del archivo que editas, y no reformatees líneas que no cambias. El estilo **no es uniforme por carpeta**, así que míralo en cada archivo:

| Archivo | Estilo |
|---|---|
| `components/**`, `main.tsx`, `lib/financial-types.ts`, `lib/mock-data.ts` | Comillas simples, sin `;` |
| `App.tsx`, `lib/financial-utils.ts`, `lib/financial-utils.test.ts` | Comillas dobles, con `;` |
| `lib/utils.ts` | Comillas dobles, sin `;` |

En un archivo nuevo, copia el estilo del archivo más parecido de su misma carpeta: un componente nuevo, como `kpi-card.tsx`; una función o test nuevo de `lib/`, como `financial-utils.ts`. En JSX, los atributos van siempre con comillas dobles (`className="..."`), como en todo el proyecto.

**Por qué:** conviven dos estilos (por ejemplo, [`App.tsx`](../../frontend/src/App.tsx) usa comillas dobles con `;` y [`main.tsx`](../../frontend/src/main.tsx) comillas simples sin `;`), y no existe Prettier, `.editorconfig` ni nada equivalente (hallazgo N3). Reformatear un archivo entero esconde el cambio real dentro de un diff enorme.

**✅ Haz:** al añadir una función a `financial-utils.ts`, escríbela con comillas dobles y `;`, como el resto del archivo.

**❌ Evita:** pasar `App.tsx` a comillas simples "por coherencia", o añadir Prettier sin que se pida.

**Cómo comprobarlo:** `git diff --stat` solo muestra las líneas relacionadas con la tarea, sin cambios de formato en el resto del archivo.

## FE-05 · Estado de carga con `Skeleton`

**Regla:** Todo componente que muestre datos de la API debe aceptar `loading?: boolean` y, mientras sea `true`, mostrar un `Skeleton` (`@/components/ui/skeleton`) con la misma forma que el contenido final.

**Por qué:** [`App.tsx`](../../frontend/src/App.tsx) pasa `loading` a todos los componentes de datos, y estos lo resuelven con `Skeleton`: [`kpi-card.tsx:37`](../../frontend/src/components/dashboard/kpi-card.tsx#L37), [`income-outcome-chart.tsx:50`](../../frontend/src/components/dashboard/income-outcome-chart.tsx#L50) y [`profit-percent-chart.tsx:51`](../../frontend/src/components/dashboard/profit-percent-chart.tsx#L51) (hallazgo N4).

**✅ Haz:** `if (loading) { return (<Card>…<Skeleton className="h-8 w-36" />…</Card>) }` antes del render normal.

**❌ Evita:** devolver `null` o el texto "Loading..." mientras cargan los datos.

**Cómo comprobarlo:** el componente nuevo declara `loading?: boolean` en sus props y `App.tsx` se lo pasa.

## FE-06 · Colores solo con variables del tema

**Regla:** Usa las clases del tema (`bg-card`, `text-muted-foreground`, `border-border`…) o las variables CSS (`var(--chart-income)`, `var(--income-badge)`…). No escribas colores fijos. Si necesitas un color nuevo:

1. Defínelo en [`index.css`](../../frontend/src/index.css) en `:root` **y** en `.dark`.
2. Si lo vas a usar como clase de Tailwind, añade también `--color-<nombre>: var(--<nombre>)` en el bloque `@theme inline`.

**Por qué:** los colores del tema están en `index.css` (`:root`, líneas 5-40, y `.dark`, líneas 42-76). `App.tsx:46` aplica la clase `dark`, así que **lo que se ve es la variante `.dark`** (hallazgo N5).

**✅ Haz:** `stroke="var(--chart-outcome)"` ([`income-outcome-chart.tsx:113`](../../frontend/src/components/dashboard/income-outcome-chart.tsx#L113)) o `variantStyles` en `kpi-card.tsx`.

**❌ Evita:** `text-green-500`, `#22c55e` o `stroke="red"`, o definir un color nuevo solo en `:root`.

**Cómo comprobarlo:** `grep -rnE "#[0-9a-fA-F]{3,6}\b|(text|bg|border)-(red|green|blue|gray|zinc)-[0-9]" frontend/src/components` no devuelve nada.

## FE-07 · Textos de la interfaz en inglés

**Regla:** Escribe en inglés todos los textos que ve el usuario: títulos, etiquetas, descripciones, mensajes vacíos y mensajes de error.

**Por qué:** [`index.html:2`](../../frontend/index.html#L2) declara `lang="en"`, y todos los textos de los componentes están en inglés ("Financial Overview", "No data available to display"). El único texto en español, el mensaje de error de [`App.tsx:37`](../../frontend/src/App.tsx#L37), ya se tradujo (hallazgo N6).

**✅ Haz:** `"Could not load financial data. Check the backend API."`

**❌ Evita:** añadir textos nuevos en español, como el antiguo `"No se pudo cargar la informacion financiera..."`.

**Cómo comprobarlo:** revisa en el diff los textos visibles nuevos.

## FE-08 · Cálculos en funciones puras de `lib/`

**Regla:** Escribe los cálculos (totales, agrupaciones, porcentajes, formatos) como funciones puras en `frontend/src/lib/`, con su test en `*.test.ts` junto a ellas. Los componentes solo reciben datos ya calculados y los muestran.

**Por qué:** `App.tsx` llama a `computeKPIs` y `computeMonthlyData` de [`financial-utils.ts`](../../frontend/src/lib/financial-utils.ts) y pasa el resultado a los componentes. Esa lógica está cubierta por [`financial-utils.test.ts`](../../frontend/src/lib/financial-utils.test.ts) (hallazgo A2).

**✅ Haz:** añadir `computeAverageMonthlyProfit(movements)` a `financial-utils.ts`, con su `describe(...)` en `financial-utils.test.ts`.

**❌ Evita:** hacer `movements.filter(...).reduce(...)` dentro de un componente de `dashboard/`.

**Cómo comprobarlo:** cada función nueva de `lib/` aparece en un `describe` o `it` de su `*.test.ts`.

## FE-09 · Fechas `YYYY-MM-DD` sin conversión a hora local

**Regla:** Para agrupar o comparar fechas `YYYY-MM-DD` de la API (`create_date`), no uses `new Date(str)` seguido de métodos locales (`getMonth()`, `getFullYear()`, `getDate()`). Usa el texto de la fecha (`create_date.slice(0, 7)` para `YYYY-MM`) o, si necesitas un `Date`, los métodos UTC (`getUTCMonth()`, `getUTCFullYear()`).

**Por qué:** `new Date("2025-11-01")` se interpreta como medianoche UTC, pero `getMonth()` usa la hora local. `computeMonthlyData` agrupaba así (`toYearMonthKey(new Date(m.create_date))`) y colocaba los movimientos del día 1 en el mes anterior en zonas con UTC negativo: con los datos reales de la API, `America/New_York` mostraba 13 meses en lugar de 12 (hallazgo D2). Se corrigió en el commit `94b6fd1` con `create_date.slice(0, 7)`, y el test `"groups movements dated on the 1st into their own month"` de [`financial-utils.test.ts`](../../frontend/src/lib/financial-utils.test.ts) lo protege. Esta regla evita que el patrón vuelva en código nuevo.

**✅ Haz:** `const yearMonthKey = m.create_date.slice(0, 7);`

**❌ Evita:** `new Date(m.create_date).getMonth()` o cualquier helper que reciba un `Date` creado a partir de `create_date` y use métodos locales. En cambio, `new Date(year, month, 1)` con números, como en `formatMonthYearLabel`, sí es correcto, porque crea la fecha directamente en hora local.

**Cómo comprobarlo:** aplica [TE-04](testing.md#te-04--prueba-la-lógica-de-fechas-en-una-zona-horaria-utc-negativa).

## FE-10 · No uses el código heredado de la versión con datos de 2024

**Regla:** No uses [`src/lib/mock-data.ts`](../../frontend/src/lib/mock-data.ts) como fuente de datos: los datos vienen siempre de `GET /api/metrics`. Si cambias la etiqueta del periodo de la cabecera, cámbiala en los dos sitios donde está: [`App.tsx:49`](../../frontend/src/App.tsx#L49) (`"2024 - Full Year"`) y el valor por defecto de [`dashboard-header.tsx:7`](../../frontend/src/components/dashboard/dashboard-header.tsx#L7) (`'2024 — Full Year'`).

**Por qué:** `mock-data.ts` (fechas `2024-*`) y `src/assets/hero.png` no los importa ningún archivo. Son restos de una versión anterior, igual que la etiqueta "2024", que no coincide con los datos reales (12 meses anteriores al mes actual) ni entre sus dos copias (hallazgo A6).

**✅ Haz:** obtener datos con `fetchFinancialData()` de `App.tsx`.

**❌ Evita:** `import { mockMovements } from '@/lib/mock-data'`, o editar solo una de las dos etiquetas.

**Cómo comprobarlo:** `grep -rn "mock-data" frontend/src` no devuelve nada (nadie lo importa), y `grep -rn "Full Year" frontend/src` muestra que las dos apariciones son coherentes.
