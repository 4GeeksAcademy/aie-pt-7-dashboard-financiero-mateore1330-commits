---
name: testing
description: Verificación obligatoria antes de terminar y cómo escribir tests fiables en backend y frontend
scope: backend/tests/**, frontend/src/**/*.test.ts, y cualquier tarea que cambie código
---

# Reglas de testing

Aplican a cualquier tarea que cambie código, además de a los tests en `backend/tests/**` y `frontend/src/**/*.test.ts`.

## TE-01 · Verifica todo antes de terminar

**Regla:** Antes de dar una tarea por terminada, con los servicios levantados (`docker compose up --build`), ejecuta estos cuatro comandos y comprueba que pasan:

```bash
docker compose exec backend python -m pytest -q
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Informa del resultado de cada uno. Si alguno falla, la tarea no está terminada.

**Por qué:** no hay CI, ni linter o formateador de Python, ni `pre-commit` (hallazgo T4). Además, `npm run lint` no detecta las variables ni los parámetros sin usar, pero `npm run build` sí (`tsc -b` con `noUnusedLocals` y `noUnusedParameters`, en [`tsconfig.app.json:22-23`](../../frontend/tsconfig.app.json#L22-L23)), así que pasar el lint no basta (hallazgo T5).

**✅ Haz:** "pytest 15 passed · vitest 5 passed · lint OK · build OK".

**❌ Evita:** ejecutar solo los tests del lado que has cambiado, o dar por bueno un cambio porque pasa el lint. Un cambio en el contrato de datos rompe el otro lado (BE-03).

**Cómo comprobarlo:** el resumen final de la tarea incluye el resultado de los cuatro comandos. El aviso `StarletteDeprecationWarning` de pytest y el aviso de tamaño de chunk del build ya existían y no cuentan como fallo.

## TE-02 · Estilo de los tests del backend

**Regla:** Escribe los tests del backend en [`backend/tests/test_routes.py`](../../backend/tests/test_routes.py) (o en otro `test_*.py` de `backend/tests/`), usando el `client = TestClient(app)` del módulo. Nómbralos `test_<qué>_<resultado_esperado>` y sigue el orden preparar → ejecutar → comprobar.

**Por qué:** los 15 tests existentes siguen este patrón, por ejemplo `test_b2b_endpoint_only_returns_b2b_records`, y [`conftest.py`](../../backend/tests/conftest.py) ya configura las importaciones de `app` (hallazgo T1).

**✅ Haz:**
```python
def test_top_categories_returns_limited_sorted_categories():
    response = client.get("/api/metrics/categories/top", params={"operation_type": "outcome", "limit": 3})

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 3
```

**❌ Evita:** nombres como `test_1` o `test_endpoint`, levantar un servidor real con `requests`, o tocar `sys.path` en el propio test.

**Cómo comprobarlo:** `docker compose exec backend python -m pytest -q` encuentra y ejecuta el test nuevo.

## TE-03 · No escribas fechas fijas en tests que dependen de los datos mock

**Regla:** Los datos mock dependen de la fecha actual, así que no escribas fechas fijas en tests que usen esos datos. Obtén las fechas de los propios datos (de la respuesta de la API o de `generate_mock_movements(seed=42)`). Comprueba **valores**, no solo que existan las claves.

**Por qué:** `_year_for_month` asigna los años según `date.today()` ([`routes.py`](../../backend/app/routes.py)), así que el rango de datos cambia cada mes (hallazgo D3). [`test_routes.py:160`](../../backend/tests/test_routes.py#L160) consulta `2025-03-01` a `2025-03-31`, que ya queda fuera del rango, y pasa porque solo comprueba los nombres de las claves (hallazgo T2).

**✅ Haz:** como `test_metrics_endpoint_respects_date_filters`:
```python
first_date = client.get("/api/metrics").json()[0]["create_date"]
response = client.get("/api/metrics", params={"start_date": first_date, "end_date": first_date})
assert all(item["create_date"] == first_date for item in response.json())
```

**❌ Evita:** `params={"start_date": "2025-03-01", ...}` seguido solo de `assert set(payload.keys()) == {...}`.

**Cómo comprobarlo:** el test no contiene literales de fecha `YYYY-MM-DD` (salvo en datos construidos dentro del propio test) y falla si se rompe el cálculo que comprueba.

## TE-04 · Prueba la lógica de fechas en una zona horaria UTC negativa

**Regla:** Si cambias la lógica de fechas del frontend (agrupación por mes, etiquetas, filtros):

1. Añade un caso de test con una fecha en **día 1** (por ejemplo `"2026-02-01"`) y comprueba que cae en su mes.
2. Ejecuta los tests también en una zona horaria con UTC negativo:

```bash
docker compose exec -u root frontend apk add --no-cache tzdata   # una vez por contenedor
docker compose exec -e TZ=America/New_York frontend npm test
```

**Por qué:** la imagen `node:24-alpine` no trae datos de zonas horarias: sin `tzdata`, `TZ=America/New_York` no tiene efecto (`getTimezoneOffset()` devuelve 0) y el bug D2 queda oculto. Además, los tests actuales de [`financial-utils.test.ts:63-104`](../../frontend/src/lib/financial-utils.test.ts#L63-L104) solo usan los días 3, 5 y 8 (hallazgo T3). El `node_modules` del host está vacío porque el compose lo monta como volumen anónimo, así que los tests no se pueden ejecutar fuera del contenedor sin instalar dependencias.

**✅ Haz:** comprobar primero que la zona horaria se aplica (`docker compose exec -e TZ=America/New_York frontend node -e 'console.log(new Date().getTimezoneOffset())'` debe dar `300` o `240`) y después ejecutar `npm test` con ese `TZ`.

**❌ Evita:** ejecutar `TZ=America/New_York npm test` sin `tzdata` y concluir que funciona.

**Cómo comprobarlo:** el test del día 1 pasa con y sin `TZ=America/New_York`, y fallaría con el código anterior a la corrección. `tzdata` desaparece al reconstruir la imagen, así que hay que repetir el paso 2 tras cada `docker compose up --build`.
