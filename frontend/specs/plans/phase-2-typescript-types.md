# Fase 2 — Tipos TypeScript

> Proyecto: Aplicando desarrollo guiado por especificaciones · Rama: `feat/frontend-specs`

## Objetivo

Escribir los tipos TypeScript de las respuestas y de los parámetros de query que usan las tres funcionalidades. Cada nombre y cada tipo de propiedad tiene que salir de `/docs` (ver [`api-exploration.md`](../api-exploration.md)), no inventarse. TypeScript estricto: sin `any` ni `object`, y con JSDoc en cada propiedad (significado, valores válidos y formato).

## Entregables

| Archivo | Contenido |
|---|---|
| `frontend/specs/plans/phase-2-typescript-types.md` | Este plan |
| `frontend/specs/api-types.ts` | `FacetsResponse`, `AlertEntry`, `AlertsResponse`, `CategoryEntry`, `TopCategoriesResponse` |
| `frontend/specs/param-types.ts` | `DateRangeFilter`, `AlertsParams`, `TopCategoriesParams` |
| `frontend/specs/tsconfig.json` | Configuración estricta solo para `specs/`, para que `npx tsc --noEmit` compruebe de verdad estos archivos |
| `verification.md` | Sección "Specs · Fase 2" |

Todo va en **un solo commit**, plan incluido.

## Decisiones tomadas con el usuario

| Decisión | Motivo |
|---|---|
| **`tsconfig.json` propio en `specs/`** con `strict: true` | En `frontend/`, `npx tsc --noEmit` revisa **0 archivos** (medido con `--listFilesOnly`): el `tsconfig.json` raíz tiene `"files": []` y solo delega con `-b`. Además, `specs/` queda fuera del `include: ["src"]` de la app, y la app no tiene `strict`. Con un `tsconfig` propio no se toca la configuración de la app |
| **`business_type` en `TopCategoriesParams`**, aunque el ejercicio solo nombre "tipo de operación, limit y filtro de fechas" | Sin él, `/categories/top` devuelve B2B y B2C mezclados y no se pueden llenar los dos paneles (Fase 1, desajuste F3-3). Se documenta en el JSDoc como desajuste del brief |

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Configuración para comprobar los tipos

- Crear `frontend/specs/tsconfig.json` con `strict: true`, que incluya solo `specs/*.ts`. No se toca ningún `tsconfig` de la app.
- Comprobar con `--listFilesOnly` que ahora sí revisa los archivos de `specs/`, y que falla si se introduce un error a propósito.
- Comando de la fase: `cd frontend/specs && npx tsc --noEmit` (dentro del contenedor, regla TE-01).

### Paso 3 — `api-types.ts` (respuestas)

| Tipo del ejercicio | Esquema en `/docs` | Forma |
|---|---|---|
| `FacetsResponse` | `MetricsFacets` | objeto |
| `AlertEntry` | `MetricsAlert` | objeto |
| `AlertsResponse` | respuesta de `/alerts` | `AlertEntry[]` (lista sin envolver) |
| `CategoryEntry` | `TopCategoryItem` | objeto |
| `TopCategoriesResponse` | respuesta de `/categories/top` | `CategoryEntry[]` (lista sin envolver) |

- Se reutilizan `OperationType`, `Category` y `BusinessType` de `src/lib/financial-types.ts` (con `import type`), que ya coinciden con `/docs`.
- Las fechas son `string` con JSDoc `YYYY-MM-DD`. `period` documenta su formato `YYYY-MM`.
- Cada JSDoc recoge lo verificado en la Fase 1: que `increase_ratio` es un ratio, que `baseline_average` es la media de todos los períodos anteriores del rango, el orden y el redondeo, etc.
- Todos los campos son obligatorios y ninguno admite `null` (como en `/docs`).

### Paso 4 — `param-types.ts` (parámetros de query)

- `DateRangeFilter`: `start_date?` y `end_date?`, los dos opcionales y `string`, con JSDoc `YYYY-MM-DD`. Incluye la regla de omitir el parámetro si está vacío (el 422 de la Fase 1).
- `AlertsParams extends DateRangeFilter`: `threshold` (rango del frontend 0.01–1.0, por defecto 0.3).
- `TopCategoriesParams extends DateRangeFilter`: `operation_type`, `limit` (1–20, por defecto 5) y `business_type` (`B2B` o `B2C`).
- Los nombres de las propiedades son los de la API (`start_date`, no `startDate`), para que se envíen tal cual en la query.

### Paso 5 — Comprobar contra `/docs`

- Un script compara cada propiedad de los tipos con `/openapi.json`: nombre, tipo, si es obligatoria, enums, mínimos y máximos. La tabla resultante va a `verification.md`.
- Comprobar que no hay `any` ni `object` y que cada propiedad tiene JSDoc.
- `cd frontend/specs && npx tsc --noEmit` y `npm run lint` sin errores.

### Paso 6 — Revisión independiente

Un agente nuevo, sin contexto, contrasta los dos archivos de tipos con `/docs` y con la API en marcha. Lo que encuentre se corrige y se anota.

### Paso 7 — Rastro de verificación y commit

- Sección "Specs · Fase 2" en `verification.md`.
- Comandos de commit (los ejecuta el usuario): `docs(specs): add api and param types verified against openapi`.

## Fuera de alcance

- No hay componentes, `fetch` ni cambios en el backend ni en `src/`.
- No se modifica ningún `tsconfig` de la app.
