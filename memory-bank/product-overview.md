---
name: product-overview
description: Qué es el producto, qué muestra, qué ofrece su API y qué no es
last_verified: 2026-11-13 (sobre el commit 1b46bed y los cambios de la Fase 4)
---

# Descripción del producto

> Solo recoge lo que se puede comprobar en el código o ejecutando el proyecto. No hay documentación de producto, usuarios ni roadmap en el repositorio. Cualquier afirmación sobre esos temas sería una suposición.

## Qué es

Un **dashboard de métricas financieras** de una empresa, con un frontend en React y un backend en FastAPI.

- El README lo describe como *"Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI"* ([`README.es.md`](../README.es.md)).
- La interfaz se presenta como **"Financial Overview · Executive metrics dashboard"** ([`dashboard-header.tsx`](../frontend/src/components/dashboard/dashboard-header.tsx)).
- La API se llama **"Financial Metrics API"** ([`backend/app/main.py`](../backend/app/main.py)).
- El repositorio procede de un proyecto formativo de 4Geeks Academy ([`README.md`](../README.md)).

## Qué muestra el dashboard

Una sola página ([`App.tsx`](../frontend/src/App.tsx)) con:

| Elemento | Contenido | Archivo |
|---|---|---|
| Cabecera | Título y etiqueta de periodo "2024 - Full Year" (escrita a mano, ver [estado actual](current-state.md)) | `dashboard-header.tsx`, `App.tsx:49` |
| 4 tarjetas KPI | Total Income, Total Outcome, Profit, Profit Margin | `kpi-row.tsx`, `kpi-card.tsx` |
| Gráfica "Income vs. Outcome" | Ingresos y gastos por mes | `income-outcome-chart.tsx` |
| Gráfica "Profit Margin %" | Margen de beneficio por mes | `profit-percent-chart.tsx` |

- Mientras cargan los datos se muestran *skeletons*. Si la API falla, aparece un mensaje de error (`App.tsx:37`), las tarjetas KPI muestran "—" y las gráficas, "No data available to display".
- La interfaz se muestra siempre en modo oscuro (clase `dark` en `App.tsx:46`).
- No hay filtros, navegación ni interacción, salvo los *tooltips* de las gráficas.

Valores mostrados el 2026-11-13: income $1,258,147 · outcome $762,132 · profit $496,015 · margin 39.4%. Cambian si cambia la fecha (ver "Datos" más abajo).

## Qué ofrece la API

9 endpoints `GET`, todos en [`backend/app/routes.py`](../backend/app/routes.py) y documentados automáticamente en `http://localhost:8000/docs`:

| Endpoint | Qué devuelve | Parámetros (`*` = obligatorio) | ¿Lo usa el frontend? |
|---|---|---|---|
| `/health` | `{"status": "ok"}` | — | No |
| `/api/metrics` | Lista de movimientos | `start_date`, `end_date`, `category`, `operation_type` | **Sí, es el único** |
| `/api/metrics/facets` | Valores posibles de filtros y rango de fechas | — | No |
| `/api/metrics/summary` | Ingresos, gastos y neto por periodo (claves `YYYY-MM-DD`, `YYYY-Www` en semanas ISO o `YYYY-MM`) | `group_by` (day/week/month), fechas, `category`, `operation_type`, `business_type` | No |
| `/api/metrics/categories/top` | Categorías ordenadas por importe (de gastos si no se indica `operation_type`) | `operation_type`, `limit` (1-20), fechas, `business_type` | No |
| `/api/metrics/comparison` | Neto del periodo frente al periodo anterior de igual duración | `start_date*`, `end_date*`, `business_type` | No |
| `/api/metrics/alerts` | Periodos cuyo gasto supera la media de **los periodos anteriores** en una proporción mayor que `threshold` (`(gasto − media) / media > threshold`). El primer periodo nunca genera alerta | `threshold` (0.3 por defecto), `group_by`, fechas, `business_type` | No |
| `/api/metrics/b2b` | Movimientos B2B | Los mismos que `/api/metrics` | No |
| `/api/metrics/b2c` | Movimientos B2C | Los mismos que `/api/metrics` | No |

Lista comprobada con `curl localhost:8000/openapi.json`.

## Datos

Cada **movimiento financiero** (`FinancialMovement`) tiene:

| Campo | Valores |
|---|---|
| `create_date` | Fecha `YYYY-MM-DD` |
| `amount` | Importe positivo, sin moneda declarada (el frontend lo muestra en USD, en `formatCurrency`) |
| `operation_type` | `income` \| `outcome` |
| `category` | `sales`, `suppliers`, `operational`, `administrative`, `others` |
| `business_type` | `B2B` \| `B2C` |

Los datos **son sintéticos**: `generate_mock_movements(seed=42)` los genera en memoria en cada petición.

- Son **360 movimientos**: 30 por mes durante **los 12 meses anteriores al mes actual**. El 2026-11-13, eso va del 2025-11-01 al 2026-10-28.
- La semilla fija importes, tipos de operación, categorías, tipos de negocio, días del mes y la proporción de ingresos de cada mes, pero **el año de cada mes depende de `date.today()`**.
- Probabilidades del generador ([`routes.py`](../backend/app/routes.py), `_build_movement`):
  - La proporción de ingresos de cada mes se sortea entre 45 % y 70 %.
  - Un ingreso es `sales` con probabilidad 0,9 (si no, `others`), por un importe de 800 a 12.000.
  - Un gasto se reparte entre las otras cuatro categorías, por un importe de 500 a 9.000.
  - Un movimiento es B2B con probabilidad 0,55.
- Con `seed=42` se obtienen 203 movimientos B2B de 360 (56,4 %) y 175 ingresos `sales` de 197 (88,8 %).

## Qué **no** es (comprobado)

- **No usa datos reales ni base de datos.** No hay ningún driver ni código de persistencia (`grep` de `sqlalchemy`, `sqlite`, `database`… sin resultados).
- **No tiene autenticación ni usuarios.** No hay código de `auth`, `token`, `login` ni `session`.
- **No escribe datos.** Todos los endpoints son `GET`.
- **No está preparado para producción.** El backend arranca siempre con el depurador `debugpy` y CORS abierto a cualquier origen (ver [arquitectura](architecture.md)).
