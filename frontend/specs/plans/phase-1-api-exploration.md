# Fase 1 — Explorar la API

> Proyecto: Aplicando desarrollo guiado por especificaciones · Rama: `feat/frontend-specs`

## Objetivo

Mapear con evidencia real (`/docs` y peticiones a la API en marcha) los endpoints, los parámetros y las formas de respuesta que usan las tres funcionalidades. También anotar dónde no coincide lo que pide el PM con lo que hace la API, y cómo lo resolverá la spec. En esta fase no se escribe código.

## Entregables

| Archivo | Contenido |
|---|---|
| `frontend/specs/plans/phase-1-api-exploration.md` | Este plan |
| `frontend/specs/api-exploration.md` | Mapa de endpoints y tabla de desajustes entre el PM y la API |
| `verification.md` | Sección nueva con el rastro de verificación (✅/❌/❓) |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Preparar la carpeta y guardar el plan

- Crear `frontend/specs/` y `frontend/specs/plans/`.
- Guardar este plan.

### Paso 2 — Comprobar que la API está en marcha y leer el contrato

- Comprobar `GET localhost:8000/health` → `{"status":"ok"}` (regla EN-01).
- Leer el contrato en `/docs` (y su fuente, `/openapi.json`). No se guarda ninguna copia en el repo.

### Paso 3 — Mapear los endpoints de cada funcionalidad

Para cada endpoint: los parámetros (nombre, tipo, si es obligatorio, valor por defecto, límites y valores permitidos), el esquema de respuesta (campos, tipos, `null`) y las respuestas de error (422).

| Funcionalidad | Endpoints |
|---|---|
| 1 · Filtro de fechas | `GET /api/metrics/facets`, `GET /api/metrics` (con `start_date`/`end_date`) |
| 2 · Tabla de anomalías | `GET /api/metrics/alerts` |
| 3 · B2B vs B2C | `GET /api/metrics/categories/top`, `GET /api/metrics/facets`. Revisar también `/api/metrics/summary`, por si sirve para la gráfica de totales |

### Paso 4 — Probar casos límite con peticiones reales

Llamar con `curl` a la API en marcha y anotar qué responde:

- **Fechas:** sin fechas, solo inicio, solo fin, inicio > fin, fuera del rango del dataset, formato incorrecto (p. ej. `13/01/2026`).
- **`threshold`:** `0`, `0.01`, `0.3`, `1`, `1.5`, `-1` y un valor que no dé anomalías.
- **`limit`:** `0`, `1`, `5`, `20`, `21`. Con `operation_type=income`, ver cuántas categorías salen de verdad.
- **`business_type`:** `B2B`, `B2C` y un valor no válido.
- **Forma del error 422:** cómo es el cuerpo que tendría que leer el frontend.

### Paso 5 — Contrastar con el frontend actual

Revisar cómo llama hoy el frontend a la API (`App.tsx`, `lib/financial-utils.ts`, `lib/financial-types.ts`, proxy de Vite y `VITE_API_BASE_URL`). Así la spec reutiliza los patrones existentes en lugar de inventarlos.

### Paso 6 — Tabla de desajustes PM ↔ API

Para cada frase del PM que no encaje con la API: la cita del PM, lo que hace la API (con la evidencia), el estado (✅ coincide / ❌ no coincide / ❓ sin verificar) y la decisión que tomará la spec.

Desajustes ya detectados, que hay que confirmar con evidencia:

- "Media móvil de los 3 períodos anteriores" frente a la media de **todos** los meses anteriores.
- Umbral 0.01–1.0 en el PM frente a `ge=0` sin máximo en la API.
- "Incremento porcentual" frente a `increase_ratio`, que es un ratio.
- Las facetas no separan las categorías por B2B ni por B2C.
- El "top 5" de ingresos tiene como mucho 2 categorías.
- El "% sobre el total del grupo" no lo devuelve la API.
- `AlertsResponse` y `TopCategoriesResponse` frente a respuestas que son listas sin envolver.

Las decisiones que dependan del usuario (p. ej. qué hacer con la "media de 3 períodos") se marcan como ❓ y se le preguntan antes de cerrar la fase.

### Paso 7 — Revisión independiente

Un agente nuevo, sin contexto, contrasta `api-exploration.md` con `/docs` y con la API en marcha, y busca errores o afirmaciones sin evidencia. Lo que encuentre se corrige y queda anotado en `verification.md`.

### Paso 8 — Rastro de verificación y commit

- Añadir a `verification.md` una sección "Specs · Fase 1" con lo que se corrigió.
- Comandos de commit (los ejecuta el usuario): `docs(specs): map api endpoints and pm mismatches for frontend specs`.

## Fuera de alcance

- No se crean tipos TypeScript (Fase 2), ni componentes, ni llamadas `fetch`.
- No se toca el backend: los desajustes se resuelven en la spec.
- No se guarda en el repo ninguna copia del `openapi.json`.
