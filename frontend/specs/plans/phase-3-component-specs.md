# Fase 3 — Especificación de componentes

> Proyecto: Aplicando desarrollo guiado por especificaciones · Rama: `feat/frontend-specs`

## Objetivo

Escribir `frontend/specs/components.md`: qué componentes hay que construir para cada funcionalidad, sus props (con los tipos de la Fase 2), qué muestran en cada estado (cargando, error, vacío, con datos) y cómo se resuelven las ambigüedades del brief. Debe bastar para que un coding agent los construya sin hacer preguntas. No se escribe código de componentes.

## Entregables

| Archivo | Contenido |
|---|---|
| `frontend/specs/plans/phase-3-component-specs.md` | Este plan |
| `frontend/specs/components.md` | Spec de componentes de las tres funcionalidades |
| `verification.md` | Sección "Specs · Fase 3" |

Todo va en **un solo commit**, plan incluido.

## Decisiones tomadas con el usuario

| Decisión | Origen |
|---|---|
| **Un único filtro de fechas compartido** por las dos pestañas: el rango elegido en `Overview` se mantiene en `B2B vs B2C` y al revés. Un solo componente de filtro, visible bajo las pestañas | El brief no aclara si el rango de la funcionalidad 3 es el mismo que el de la funcionalidad 1 (decidido en esta fase) |
| Dos pestañas, `Overview` y `B2B vs B2C`, sin router | Fase 1, desajuste F3-1 |
| La cabecera muestra el rango activo, o el de `facets` si no hay filtro | Fase 1, desajuste F1-9 |
| La tabla de anomalías usa `/alerts` tal cual y documenta que la media no es la de 3 períodos | Fase 1, desajuste F2-1 |

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Inventario de los componentes y convenciones existentes

Revisar `src/components/dashboard/*` y `src/components/ui/*` para que la spec siga los mismos patrones: nombre de las props (`XxxProps`), `loading?: boolean`, `Skeleton` mientras carga, `Card` como contenedor, mensaje "No data available to display", Recharts para gráficas y clases de Tailwind. Anotar qué componentes existentes se modifican (p. ej. `DashboardHeader`) y cuáles son nuevos.

### Paso 3 — Funcionalidad 1: filtro de rango de fechas

- Componentes, props y tipos (`DateRangeFilter`, `FacetsResponse`).
- Estados: cargando facetas, facetas con error, sin fechas, **solo una fecha**, rango completo, inicio > fin.
- Qué se recalcula al cambiar el rango (KPIs, gráficas, alertas, vista B2B vs B2C) y la etiqueta de la cabecera.

### Paso 4 — Funcionalidad 2: tabla de anomalías

- Componentes, props y tipos (`AlertsResponse`, `AlertsParams`).
- Columnas → campos de `AlertEntry` y su formato (`period` → "Mar 2026", `increase_ratio × 100` → `formatPercent`).
- Estados: cargando, error, umbral fuera de 0.01–1.0, **estado vacío explícito** (texto exacto), con datos.
- Desajuste de la media de 3 períodos documentado.

### Paso 5 — Funcionalidad 3: vista B2B vs B2C

- Pestañas `Overview` / `B2B vs B2C`.
- Componentes de los paneles y de la gráfica, props y tipos (`TopCategoriesResponse`, `TopCategoriesParams`).
- Cálculo del % sobre el total y del total de cada grupo.
- Estados de **cada panel por separado**: cargando, error, **vacío** y con 1 o 2 filas.

### Paso 6 — Comprobaciones

- Lista de la rúbrica, punto por punto.
- Cada desajuste de `api-exploration.md` (F1-x, F2-x, F3-x, C-x) aparece resuelto en `components.md`.
- Los bloques de código TypeScript de las props se extraen y se compilan en modo estricto contra los tipos de la Fase 2 (en el scratchpad, sin guardarlos en el repo).

### Paso 7 — Revisión independiente

Un agente nuevo lee **solo** `components.md` y los tipos, como si tuviera que implementarlos, y apunta todas las preguntas que necesitaría hacer. Cada pregunta se resuelve en la spec.

### Paso 8 — Rastro de verificación y commit

- Sección "Specs · Fase 3" en `verification.md`.
- Comandos de commit (los ejecuta el usuario): `docs(specs): add component specs for the three features`.

## Fuera de alcance

- No se crean componentes React, ni llamadas `fetch`, ni cambios en el backend ni en `src/`.
- El `README.md` del contrato de datos es la Fase 4.
