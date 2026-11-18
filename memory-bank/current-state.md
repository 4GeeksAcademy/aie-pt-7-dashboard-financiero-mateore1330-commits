---
name: current-state
description: Qué funciona hoy, carencias conocidas y siguientes prioridades técnicas
last_verified: 2026-11-17 (sobre el commit 23be14d y la revisión final de la Fase 6 de skills)
---

# Estado actual

> **Actualízalo** cada vez que se corrija una carencia, se añada funcionalidad o cambie el resultado de las comprobaciones (regla UR-03). La fecha y el commit de la cabecera indican cuándo se comprobó por última vez.

## Qué funciona (comprobado el 2026-11-17)

| Comprobación | Resultado |
|---|---|
| `docker compose up --build` | ✅ Los dos servicios en `running` |
| `GET localhost:8000/health` | ✅ `{"status":"ok"}` |
| `GET localhost:5173/api/metrics` (a través del proxy) | ✅ 360 movimientos, del 2025-11-01 al 2026-10-28 |
| Los 9 endpoints (con parámetros válidos) | ✅ 200. `/api/metrics/comparison` sin sus fechas obligatorias devuelve 422 |
| Dashboard en `localhost:5173` | ✅ 4 KPIs y 2 gráficas con 12 meses |
| `pytest` | ✅ 15 passed (1 aviso, ver carencias) |
| `npm test` | ✅ 6 passed |
| `npm run lint` | ✅ Sin errores |
| `npm run build` | ✅ Correcto y sin avisos (desde la Fase 3 de skills: JS inicial de 229 kB y Recharts en un trozo aparte) |
| Agrupación mensual en `America/New_York` | ✅ 12 meses (corregido en `94b6fd1`) |
| Accesibilidad (2026-11-17) | ✅ Lighthouse Accessibility 100 (en modo Snapshot, antes y después), más la revisión manual de la skill `accessibility`: teclado, foco con 4,6:1, gráficas con nombre y tabla de datos, y anuncios de estado. Ver [`progress.md`](progress.md) |
| SEO (2026-11-17) | ✅ Lighthouse SEO 60 → 100 en modo Snapshot. La página lleva `noindex, nofollow` **a propósito** (panel interno), así que en modo Navigation la auditoría `is-crawlable` fallaría. Ver [`progress.md`](progress.md) |
| Tipos de `frontend/specs/` contra el OpenAPI en vivo (2026-11-14) | ✅ 28/28 propiedades; `docker compose exec -T -w /app/specs frontend npx tsc --noEmit` en modo estricto, exit 0 |

## Historial reciente

| Commit | Cambio |
|---|---|
| `cb29403` | Rastro de verificación del handover (Fase 1) |
| `add3d9f` | Hallazgos de ingeniería y reglas propuestas (Fase 2). El documento dice 22 hallazgos, pero son 25: ver `verification.md`, Fase 4 |
| `537f82b` | Reglas en `.agents/rules/` (Fase 3) |
| `94b6fd1` | **fix:** bug de zona horaria en la agrupación mensual |
| `f0dfdc5` | **test:** test de `comparison` sin fechas fijas y con valores |
| `a99e418` | **docs:** requisitos previos y health check en los dos README |
| `da0fccc` | **chore:** 31 dependencias del backend fijadas |
| `1b46bed` | Reglas refinadas tras validarlas con tareas reales (Fase 3) |
| `290c865` | Memory bank (Fase 4) |
| `57d00da` | **docs:** entregables del proyecto en los dos README |
| `8022d3e` | **fix:** mensaje de error de la interfaz traducido al inglés (N6) |
| `65d5b3e` | Specs, Fase 1: exploración de la API y 31 desajustes entre el PM y la API (rama `feat/frontend-specs`) |
| `0cf4626` | Specs, Fase 2: tipos TypeScript verificados contra OpenAPI |
| `2c92ea5` | Specs, Fase 3: especificación de componentes |
| `13a9e28` | Specs, Fase 4: contrato de datos (`frontend/specs/README.md`) |
| `8c44273` | **chore:** skills `accessibility` y `vercel-react-best-practices` en `.agents/skills/` |
| `4cd1088` | **fix:** accesibilidad del dashboard con la skill `accessibility` |
| `35a50a5` | **fix:** gráficas con carga diferida y *skeletons* sin salto, con la skill `vercel-react-best-practices` |
| `8adab72` | **feat:** meta description, `noindex` y `robots.txt`, con la skill `seo` |
| `662e7f3` | **refactor:** parámetros de los endpoints con `Annotated` y sin `Query(...)`, con la skill `fastapi` |
| `23be14d` | **docs:** skill interna `pre-merge-qa` en `.skills/` (checks de QA antes del merge) y TE-01 al día (el build ya no tiene avisos) |
| `9fb9942` | **docs:** memory bank al día con el resumen del proyecto de skills (Fase 6) |

El detalle de cada verificación está en [`verification.md`](../verification.md), y el análisis de hallazgos en [`engineering-findings.md`](../engineering-findings.md).

## Carencias conocidas

Todas comprobadas en el código. El ID es el del hallazgo en `engineering-findings.md`.

| Carencia | Evidencia | ID |
|---|---|---|
| La etiqueta de periodo dice "2024 - Full Year" (y "2024 — Full Year" como valor por defecto), pero los datos son de los 12 meses anteriores al actual | `App.tsx:62`, `dashboard-header.tsx:7` | A6 |
| Código heredado sin usar: `mock-data.ts` y `assets/hero.png` | Ningún import | A6 |
| 7 de los 8 endpoints `/api` no los usa el frontend | `App.tsx:29` es el único `fetch` | A5 |
| Todo el backend está en un archivo, con el filtro `business_type` escrito en línea en 6 endpoints | `routes.py:278-386` | A4 |
| No hay formateador, y conviven dos estilos de comillas y `;` | `frontend/src/**` | N3 |
| El contrato de datos está duplicado a mano | `routes.py`, `financial-types.ts` | D1 |
| No hay CI ni linter de Python | No existe `.github/` ni `pyproject.toml` | T4 |
| `pytest` muestra `StarletteDeprecationWarning` (httpx con `TestClient`). Fijar versiones lo congela pero no lo elimina | Salida de `pytest` | E2 |
| El frontend instala con `npm install` en lugar de `npm ci`, y las imágenes base no fijan la versión de parche | `frontend/Dockerfile:6`, `FROM python:3.13-slim` / `node:24-alpine` | E2 |
| debugpy siempre activo y CORS `*` con credenciales | `backend/Dockerfile`, `main.py` | E3 |
| La fuente `Inter` se declara pero no se carga | `index.css:79` | — |
| No hay tests de componentes React, solo de `lib/` | No hay testing-library | — |
| TypeScript sin modo `strict`: `any` implícito y errores de `null` compilan | `tsconfig.app.json` | — |
| El filtro de fechas, la tabla de anomalías y la vista B2B vs B2C están **especificados, pero no implementados** | [`frontend/specs/README.md`](../frontend/specs/README.md); ningún componente ni `fetch` nuevo en `src/` | — |
| La tabla de anomalías no puede mostrar la "media de 3 períodos" que pide el PM: la API calcula la media de todos los meses anteriores | `routes.py:219-240`, pregunta abierta Q1 de las specs | — |

## Siguientes prioridades

> En el repositorio **no hay roadmap de producto**. Estas son prioridades **técnicas** que salen de las carencias de arriba, ordenadas por impacto en quien edite el proyecto. No son funcionalidades acordadas.

1. **Calcular la etiqueta de periodo a partir de los datos** y unificar sus dos copias (A6). Es lo único que muestra información incorrecta al usuario. Ya está especificado como parte del filtro de fechas (`frontend/specs/components.md` §1.6).
2. **Implementar las tres funcionalidades especificadas** en `frontend/specs/` (filtro de fechas, tabla de anomalías y vista B2B vs B2C), empezando por leer su `README.md`.
3. **Añadir CI** que ejecute los cuatro comandos de la regla TE-01 (T4).
4. **Eliminar el aviso de Starlette**, por ejemplo cambiando el cliente de test (E2).
5. **Decidir qué hacer con el código heredado** (`mock-data.ts`, `hero.png`) y con los endpoints que no se usan. Es una decisión del equipo: BE-02 impide borrar endpoints y BE-03 impide borrar `mock-data.ts` sin que se pida.
