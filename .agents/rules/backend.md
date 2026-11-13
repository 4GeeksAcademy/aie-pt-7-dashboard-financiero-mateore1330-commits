---
name: backend
description: Patrones de endpoints, estabilidad de la API, contrato de datos y configuración sensible del backend FastAPI
scope: backend/app/**
---

# Reglas de backend

Aplican a `backend/app/**`: Python 3.13, FastAPI, Pydantic y uvicorn.

## BE-01 · Endpoints nuevos con `Literal`, `response_model` y los helpers existentes

**Regla:** En un endpoint nuevo:

1. Declara los valores permitidos con los tipos `Literal` existentes (`OperationType`, `Category`, `BusinessType`, `GroupBy`). Si necesitas uno nuevo, crea otro `Literal`.
2. Declara la respuesta con un modelo Pydantic (`BaseModel`) en `response_model=`.
3. Reutiliza los helpers en lugar de reescribir filtros: `filter_movements`, `filter_movements_by_date`, `summarize_movements`, `build_top_categories`, `calculate_net_value` y `ensure_chronological_order`.
4. Si añades lógica nueva, ponla en un helper puro (sin `Query` ni `router`) y llámalo desde el endpoint.
5. Añádelo en `routes.py`, salvo que la tarea pida dividir el archivo.

**Por qué:** todos los endpoints de [`routes.py`](../../backend/app/routes.py) siguen este patrón (por ejemplo, `get_metrics_summary` usa `GroupBy`, `response_model=list[MetricsSummaryItem]` y los helpers `filter_movements` y `summarize_movements`). El archivo concentra todo el backend en un solo `APIRouter` (hallazgos A3 y A4).

**✅ Haz:**
```python
@router.get("/api/metrics/categories/top", response_model=list[TopCategoryItem])
def get_top_categories(operation_type: OperationType = Query(default="outcome"), ...):
    movements = generate_mock_movements(seed=42)
    filtered = filter_movements(movements, start_date, end_date, category=None, operation_type=operation_type)
    return build_top_categories(filtered, operation_type, limit)
```

**❌ Evita:** parámetros `str` sin validar (`category: str`), devolver `dict` sin `response_model`, repetir `[m for m in movements if m.create_date >= start_date]` en el endpoint, o crear `services/` y `models/` sin que se pida.

**Cómo comprobarlo:** el endpoint aparece en `localhost:8000/docs` con su esquema de respuesta, y un valor no permitido devuelve 422.

## BE-02 · No elimines ni renombres endpoints ni campos de respuesta

**Regla:** No elimines ni renombres endpoints, parámetros ni campos de los modelos de respuesta, aunque el frontend no los use. Solo se pueden añadir campos opcionales o endpoints nuevos, salvo que la tarea pida explícitamente un cambio incompatible.

**Por qué:** el backend expone 8 endpoints `/api/metrics*` más `/health`, y el frontend solo llama a `/api/metrics` ([`App.tsx:16`](../../frontend/src/App.tsx#L16)). Aun así, todos tienen tests en [`test_routes.py`](../../backend/tests/test_routes.py) y forman parte de la API documentada en `/docs` (hallazgo A5).

**✅ Haz:** dejar `/api/metrics/b2b` y `/api/metrics/b2c` aunque se pueda filtrar con `business_type`.

**❌ Evita:** borrar `/api/metrics/alerts` "porque no lo usa nadie", o renombrar `delta_pct` a `delta_percent`.

**Cómo comprobarlo:** `pytest` sigue en verde **sin haber borrado ni cambiado tests existentes**.

## BE-03 · Cambia el contrato de datos en los dos lados a la vez

**Regla:** Si cambias `FinancialMovement` o los tipos `OperationType`, `Category` o `BusinessType` en `routes.py`, en el **mismo cambio** actualiza:

1. [`frontend/src/lib/financial-types.ts`](../../frontend/src/lib/financial-types.ts) (`FinancialMovement` y los tipos equivalentes).
2. Los datos de ejemplo tipados como `FinancialMovement[]`: `sampleMovements` y `unsortedCrossYearMovements` en `financial-utils.test.ts`, y `mockMovements` en `mock-data.ts` (si el campo es obligatorio, `npm run build` fallará).
3. Los tests del backend que comprueben los campos o valores afectados.

**Por qué:** el contrato está duplicado a mano en Pydantic (`routes.py`) y en TypeScript (`financial-types.ts`) y nada los sincroniza. Un desajuste no da error al compilar: aparece en ejecución (hallazgo D1).

**✅ Haz:** al añadir `currency: Literal["EUR", "USD"]` al modelo Pydantic, añadir `currency: 'EUR' | 'USD'` a la interfaz de TypeScript y a los datos de ejemplo.

**❌ Evita:** cambiar solo `routes.py` y dar la tarea por terminada porque `pytest` pasa.

**Cómo comprobarlo:** los campos de `FinancialMovement` coinciden en los dos archivos, y pasan `pytest`, `npm test` y `npm run build` ([TE-01](testing.md#te-01--verifica-todo-antes-de-terminar)).

## BE-04 · No toques la configuración de depuración ni de CORS

**Regla:** No cambies la configuración de debugpy ni de CORS salvo que la tarea lo pida explícitamente, y no la copies a ningún otro entorno ni archivo de configuración: es solo para desarrollo.

**Por qué:** el backend arranca siempre con `debugpy --listen 0.0.0.0:5678` ([`backend/Dockerfile`](../../backend/Dockerfile)), con el puerto 5678 publicado en [`docker-compose.yml`](../../docker-compose.yml). [`main.py`](../../backend/app/main.py) combina `allow_origins=["*"]` con `allow_credentials=True` (hallazgo E3).

**✅ Haz:** si una tarea necesita otro origen o desactivar el depurador, proponer el cambio y explicar el motivo antes de aplicarlo.

**❌ Evita:** añadir más middlewares CORS, quitar debugpy "para limpiar", o reutilizar este `Dockerfile` como base de un despliegue.

**Cómo comprobarlo:** `git diff backend/app/main.py backend/Dockerfile docker-compose.yml` está vacío, salvo que la tarea lo pida.
