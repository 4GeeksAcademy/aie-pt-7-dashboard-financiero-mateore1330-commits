---
name: backend
description: Patrones de endpoints, estabilidad de la API, contrato de datos, datos mock y configuración sensible del backend FastAPI
scope: backend/app/**
---

# Reglas de backend

Aplican a `backend/app/**`: Python 3.13, FastAPI, Pydantic y uvicorn.

## BE-01 · Endpoints y filtros nuevos con `Literal`, `response_model` y helpers puros

**Regla:** En un endpoint nuevo, o al añadir un parámetro a uno existente:

1. Declara los valores permitidos con los tipos `Literal` existentes (`OperationType`, `Category`, `BusinessType`, `GroupBy`). Si necesitas uno nuevo, crea otro `Literal`.
2. Declara la respuesta con un modelo Pydantic (`BaseModel`) en `response_model=`.
3. Reutiliza los helpers en lugar de reescribir filtros: `filter_movements`, `filter_movements_by_date`, `summarize_movements`, `build_top_categories`, `calculate_net_value` y `ensure_chronological_order`.
4. Si añades lógica nueva (por ejemplo, un filtro nuevo), ponla en un helper puro (sin `Query` ni `router`), como `filter_movements_by_<criterio>(movements, valor)`, y llámalo desde el endpoint. No cambies la firma de `filter_movements`, que usan 7 endpoints.
5. Añádelo en `routes.py`, salvo que la tarea pida dividir el archivo.

**Por qué:** los endpoints de [`routes.py`](../../backend/app/routes.py) usan `Literal`, `response_model` y los helpers de filtrado y agregación (por ejemplo, `get_metrics_summary` usa `GroupBy`, `response_model=list[MetricsSummaryItem]`, `filter_movements` y `summarize_movements`). Hay una excepción: el filtro por `business_type` está escrito en línea en 6 endpoints, 4 con el parámetro opcional (`routes.py:278`, `:296`, `:312` y `:351`) y 2 con valor fijo (`/b2b` en `:370` y `/b2c` en `:386`). Es duplicación existente que no hay que copiar. El archivo concentra todo el backend en un solo `APIRouter` (hallazgos A3 y A4).

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

**Regla:** No elimines, renombres ni cambies el tipo de endpoints, parámetros ni campos de los modelos de respuesta, aunque el frontend no los use. Tampoco hagas obligatorio un parámetro que antes era opcional. Lo que sí puedes hacer, porque no rompe a quien ya usa la API:

- Añadir endpoints nuevos.
- Añadir parámetros de consulta **opcionales**.
- Añadir campos nuevos a las respuestas, aunque estén siempre presentes.

Cualquier otro cambio requiere que la tarea pida explícitamente un cambio incompatible.

**Por qué:** el backend expone 8 endpoints `/api/metrics*` más `/health`, y el frontend solo llama a `/api/metrics` ([`App.tsx:16`](../../frontend/src/App.tsx#L16)). Aun así, todos tienen tests en [`test_routes.py`](../../backend/tests/test_routes.py) y forman parte de la API documentada en `/docs` (hallazgo A5).

**✅ Haz:** dejar `/api/metrics/b2b` y `/api/metrics/b2c` aunque se pueda filtrar con `business_type`.

**❌ Evita:** borrar `/api/metrics/alerts` "porque no lo usa nadie", o renombrar `delta_pct` a `delta_percent`.

**Cómo comprobarlo:** `pytest` sigue en verde **sin haber borrado ni debilitado ningún test existente**. Modificar un test para que compruebe más cosas (por ejemplo, para cumplir [TE-03](testing.md#te-03--no-escribas-fechas-fijas-en-tests-que-dependen-de-los-datos-mock)) sí está permitido. Lo que no se permite es quitar aserciones para que un cambio pase.

## BE-03 · Cambia el contrato de datos en los dos lados a la vez

**Regla:** Si cambias `FinancialMovement` o los tipos `OperationType`, `Category` o `BusinessType` en `routes.py`, en el **mismo cambio** actualiza:

1. [`frontend/src/lib/financial-types.ts`](../../frontend/src/lib/financial-types.ts) (`FinancialMovement` y los tipos equivalentes).
2. **Todos** los datos de ejemplo tipados como `FinancialMovement[]`. Búscalos con `grep -rn "FinancialMovement\[\] = \[" frontend/src`: hoy son 4 en `financial-utils.test.ts` y `mockMovements` en `mock-data.ts`. Si el campo es obligatorio y falta alguno, `npm run build` fallará. Aunque `mock-data.ts` no se usa (FE-10), mantenlo compilando y no lo borres salvo que la tarea lo pida.
3. Los tests del backend que comprueben los campos o valores afectados.

**Por qué:** el contrato está duplicado a mano en Pydantic (`routes.py`) y en TypeScript (`financial-types.ts`) y nada los sincroniza. Un desajuste no da error al compilar: aparece en ejecución (hallazgo D1).

**✅ Haz:** al añadir `currency: Currency` (con `Currency = Literal["EUR", "USD"]`) al modelo Pydantic, añadir `currency: Currency` (con `type Currency = 'EUR' | 'USD'`) a la interfaz de TypeScript y a los datos de ejemplo. Añadir un campo a la respuesta es compatible según BE-02, aunque sea obligatorio. Si los valores se generan en los datos mock, aplica también BE-05.

**❌ Evita:** cambiar solo `routes.py` y dar la tarea por terminada porque `pytest` pasa.

**Cómo comprobarlo:** los campos de `FinancialMovement` coinciden en los dos archivos, y pasan `pytest`, `npm test` y `npm run build` ([TE-01](testing.md#te-01--verifica-todo-antes-de-terminar)).

## BE-04 · No toques la configuración de depuración ni de CORS

**Regla:** No cambies la configuración de debugpy ni de CORS salvo que la tarea lo pida explícitamente, y no la copies a ningún otro entorno ni archivo de configuración: es solo para desarrollo.

**Por qué:** el backend arranca siempre con `debugpy --listen 0.0.0.0:5678` ([`backend/Dockerfile`](../../backend/Dockerfile)), con el puerto 5678 publicado en [`docker-compose.yml`](../../docker-compose.yml). [`main.py`](../../backend/app/main.py) combina `allow_origins=["*"]` con `allow_credentials=True` (hallazgo E3).

**✅ Haz:** si una tarea necesita otro origen o desactivar el depurador, comprueba primero si la configuración actual ya lo permite (por ejemplo, con `curl -i -X OPTIONS localhost:8000/api/metrics -H "Origin: <origen>" -H "Access-Control-Request-Method: GET"`). Si ya lo permite, no cambies nada; como mucho, añade un test que lo demuestre. Si no lo permite, propón el cambio y explica el motivo antes de aplicarlo.

**❌ Evita:** añadir más middlewares CORS, quitar debugpy "para limpiar", o reutilizar este `Dockerfile` como base de un despliegue.

**Cómo comprobarlo:** `git diff backend/app/main.py backend/Dockerfile docker-compose.yml` está vacío, salvo que la tarea lo pida.

## BE-05 · No alteres la secuencia aleatoria de los datos mock

**Regla:** No añadas, quites ni reordenes llamadas a `random.*` dentro de `_build_movement` ni de `generate_mock_movements`. Si un campo nuevo necesita valores aleatorios, genéralos con un generador propio con semilla, sin usar el estado global de `random`:

```python
def generate_mock_movements(seed: int | None = None) -> list[FinancialMovement]:
    if seed is not None:
        random.seed(seed)
    currency_rng = random.Random(seed)   # generador independiente para el campo nuevo
    ...
```

**Por qué:** `generate_mock_movements` llama a `random.seed(seed)`, que fija el estado **global** del módulo `random`. Después, cada movimiento consume una secuencia fija de llamadas: `random.random`, `random.randint`, `random.uniform` y `random.choice` en [`routes.py`](../../backend/app/routes.py) (líneas 72-100). Con una sola llamada extra a `random.random()` por movimiento, solo **2 de los 360** movimientos de `seed=42` siguen siendo iguales: cambian importes, días, categorías y tipos de negocio (hallazgo D3).

**✅ Haz:** `currency_rng.choice(CURRENCIES)`, con `currency_rng = random.Random(seed)` creado en `generate_mock_movements` y pasado a `_build_movement`.

**❌ Evita:** `currency = random.choice(["EUR", "USD"])` dentro de `_build_movement`.

**Cómo comprobarlo:** la huella de los datos mock (importe, mes, día, tipo, categoría y tipo de negocio de cada movimiento) es la misma antes y después del cambio:

```bash
docker compose exec backend python -c "import hashlib, app.routes as r; print(hashlib.sha256(repr([(m.amount, m.create_date.month, m.create_date.day, m.operation_type, m.category, m.business_type) for m in r.generate_mock_movements(seed=42)]).encode()).hexdigest()[:16])"
```

Ejecútalo antes y después del cambio: el resultado debe ser el mismo. La huella no incluye el año, que depende de `date.today()`.
