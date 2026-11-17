---
name: architecture
description: Cómo fluyen los datos, dónde vive cada responsabilidad y qué partes están acopladas
last_verified: 2026-11-17 (sobre el commit 8c44273 y los cambios de accesibilidad de la Fase 2 de skills)
---

# Arquitectura

## Flujo de datos

```text
Navegador ── GET /api/metrics ──▶ Vite :5173 ── proxy /api ──▶ FastAPI :8000
                                  (vite.config.ts)             routes.py: get_metrics()
                                                                 │
                                                                 ├─ generate_mock_movements(seed=42)  ← en memoria, en cada petición
                                                                 ├─ filter_movements(...)
                                                                 └─ ensure_chronological_order(...)
                                                                 │
App.tsx ◀───────────── JSON: FinancialMovement[] ◀──────────────┘
  ├─ computeKPIs(movements)        → KPIRow (4 KPICard)
  └─ computeMonthlyData(movements) → IncomeOutcomeChart, ProfitPercentChart
     (frontend/src/lib/financial-utils.ts)
```

- **El backend entrega movimientos en bruto, y los agregados del dashboard se calculan en el navegador.** Los endpoints de agregación del backend (`/summary`, `/comparison`, `/alerts`…) existen, pero el frontend no los usa.
- `App.tsx` usa `import.meta.env.VITE_API_BASE_URL ?? ""`. Sin esa variable, las peticiones van al mismo origen y pasan por el proxy.
- El proxy solo reenvía `/api`. `/health` y `/docs` de la API solo existen en el puerto 8000. **En el 5173 responden 200 con el HTML del frontend**, así que un 200 en el 5173 no demuestra que el backend esté sano.
- `http://backend:8000` es un nombre de la red de Docker: fuera de Docker, el proxy no funciona. Definir `VITE_API_BASE_URL=http://localhost:8000` no lo arregla, sino que lo **evita**: las peticiones van directamente al backend y funcionan gracias a CORS `*`.
- `main.tsx` envuelve `<App />` en `StrictMode`. En desarrollo, React ejecuta dos veces el `useEffect` de `App.tsx`, así que **dos peticiones a `/api/metrics` por carga de página es lo esperado**, no un bug.

## Responsabilidades por archivo

### Backend (`backend/app/`)

| Archivo | Responsabilidad |
|---|---|
| [`main.py`](../backend/app/main.py) | Crea `FastAPI(title="Financial Metrics API")`, configura CORS (`allow_origins=["*"]` y `allow_credentials=True`) e incluye el router |
| [`routes.py`](../backend/app/routes.py) | **Todo lo demás**, en un solo `APIRouter`: tipos `Literal`, 6 modelos Pydantic, generación de datos mock, helpers puros de filtrado y agregación, y los 9 endpoints |

Dentro de `routes.py`:
- **Helpers puros:** `filter_movements`, `filter_movements_by_date`, `summarize_movements`, `build_top_categories`, `calculate_net_value`, `detect_outcome_alerts`, `build_metrics_facets` y `ensure_chronological_order`.
- **Filtro por `business_type`:** está escrito en línea en 6 endpoints. En 4 es el parámetro opcional (`if business_type is not None:` en `:278`, `:296`, `:312` y `:351`) y en 2 un valor fijo (`/b2b` en `:370` y `/b2c` en `:386`). No usa ningún helper.
- **Generación aleatoria:** usa el estado **global** de `random`, fijado con `random.seed(seed)` **en cada petición**, porque cada endpoint vuelve a llamar a `generate_mock_movements(seed=42)`. Cambiar el número o el orden de las llamadas a `random` cambia todo el conjunto de datos (regla BE-05).

### Frontend (`frontend/src/`)

| Ruta | Responsabilidad |
|---|---|
| [`main.tsx`](../frontend/src/main.tsx) | Monta `<App />` |
| [`App.tsx`](../frontend/src/App.tsx) | Pide los datos, gestiona `loading` y `error`, calcula KPIs y serie mensual, y compone la página |
| `components/dashboard/` | Componentes de negocio: cabecera, fila y tarjeta de KPI, las 2 gráficas y `chart-data-table.tsx` (tabla `sr-only` con los datos de cada gráfica, como alternativa textual) |
| `components/ui/` | Primitivas de shadcn/ui (`card`, `skeleton`) |
| `lib/financial-types.ts` | Tipos del contrato (`FinancialMovement`…) y de la vista (`KPIMetrics`, `MonthlyDataPoint`) |
| `lib/financial-utils.ts` | Funciones puras: `computeKPIs`, `computeMonthlyData`, `formatCurrency` (USD) y `formatPercent` |
| `lib/mock-data.ts` | Datos de 2024 que **no importa nadie** (código heredado) |
| `index.css` | Tema: variables CSS para `:root` y `.dark`, mapeadas a Tailwind en `@theme inline` |

## Acoplamientos que hay que conocer

1. **Contrato duplicado a mano.** `FinancialMovement`, `OperationType`, `Category` y `BusinessType` se definen en `routes.py` (Pydantic) y en `financial-types.ts` (TypeScript). Nada los sincroniza, así que cualquier cambio debe hacerse en los dos (regla BE-03).
2. **Fechas como texto.** `create_date` llega como `YYYY-MM-DD`. Para agrupar por mes, el frontend usa `create_date.slice(0, 7)`. Con `new Date(...)` y métodos locales se producía el bug de zona horaria corregido en `94b6fd1` (regla FE-09).
3. **Los datos dependen de la fecha actual.** Los tests y las comprobaciones deben sacar las fechas y los umbrales de los propios datos (regla TE-03).

## Configuración solo para desarrollo

- `debugpy --listen 0.0.0.0:5678` envuelve siempre a uvicorn ([`backend/Dockerfile`](../backend/Dockerfile)).
- CORS acepta cualquier origen con credenciales.
- Las reglas impiden cambiar esto sin que se pida (BE-04).
