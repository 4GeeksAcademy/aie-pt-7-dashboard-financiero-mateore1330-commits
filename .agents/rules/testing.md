---
name: testing
description: Verificación obligatoria antes de terminar y cómo escribir tests fiables en backend y frontend
scope: backend/tests/**, frontend/src/**/*.test.ts, y cualquier tarea que cambie código
---

# Reglas de testing

Aplican a cualquier tarea que cambie código, además de a los tests en `backend/tests/**` y `frontend/src/**/*.test.ts`.

## TE-01 · Verifica todo antes de terminar

**Regla:** Antes de dar una tarea que cambie código por terminada, ejecuta estos cuatro comandos con los servicios levantados y comprueba que pasan:

```bash
docker compose exec backend python -m pytest -q
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

- Ejecuta los cuatro aunque solo hayas cambiado un lado (backend o frontend).
- Comprueba con `docker compose ps` que los servicios están levantados. Reconstruye (`docker compose up --build`) solo si has cambiado dependencias, un `Dockerfile` o `docker-compose.yml` (ver [EN-02](environment.md#en-02--dependencias-con-versión-fija-y-lockfile-en-el-commit)).
- Si la tarea **solo cambia archivos `.md`**, estos comandos no son obligatorios. En su lugar, ejecuta los comandos y URLs que documentes, para comprobar que funcionan como dices (ver [EN-01](environment.md#en-01--levanta-y-verifica-los-servicios-con-docker-compose)).
- Si `git status` muestra cambios sin commitear que no son tuyos, indícalo en el resumen, porque los resultados también los incluyen. No los toques, y propón un `git add` solo con tus archivos.

Informa del resultado de cada comando. Si alguno falla, la tarea no está terminada.

**Por qué:** no hay CI, ni linter o formateador de Python, ni `pre-commit` (hallazgo T4). Además, `npm run lint` no detecta las variables ni los parámetros sin usar, pero `npm run build` sí (`tsc -b` con `noUnusedLocals` y `noUnusedParameters`, en [`tsconfig.app.json:22-23`](../../frontend/tsconfig.app.json#L22-L23)), así que pasar el lint no basta (hallazgo T5).

**✅ Haz:** "pytest N passed · vitest N passed · lint OK · build OK", con el número real de tests de ese momento.

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

**Regla:** Los datos mock dependen de la fecha actual, así que no escribas fechas fijas en tests que usen esos datos. Obtén las fechas, y también los **umbrales de valor** (importes mínimos, límites…), de los propios datos: de la respuesta de la API o de `generate_mock_movements(seed=42)`. Comprueba **valores**, no solo que existan las claves.

**Por qué:** `_year_for_month` asigna los años según `date.today()` ([`routes.py`](../../backend/app/routes.py)), así que el rango de datos cambia cada mes (hallazgo D3). `test_metrics_comparison_returns_delta_fields` consultaba `2025-03-01` a `2025-03-31`, que ya quedaba fuera del rango, y pasaba porque solo comprobaba los nombres de las claves (hallazgo T2). Se corrigió en el commit `f0dfdc5`, y hoy [`test_routes.py`](../../backend/tests/test_routes.py) no contiene ninguna fecha literal.

**✅ Haz:** como `test_metrics_endpoint_respects_date_filters`:
```python
first_date = client.get("/api/metrics").json()[0]["create_date"]
response = client.get("/api/metrics", params={"start_date": first_date, "end_date": first_date})
assert all(item["create_date"] == first_date for item in response.json())
```

**❌ Evita:** `params={"start_date": "2025-03-01", ...}` o `params={"min_amount": 5000}` seguidos solo de `assert set(payload.keys()) == {...}`. Mejor: `threshold = sorted(m.amount for m in movements)[len(movements) // 2]`.

**Cómo comprobarlo:** el test no contiene literales de fecha `YYYY-MM-DD` (salvo en datos construidos dentro del propio test) y falla si se rompe el cálculo que comprueba.

## TE-04 · Prueba la lógica de fechas en una zona horaria UTC negativa

**Regla:** Si cambias la lógica de fechas del frontend (agrupación por mes, etiquetas, filtros):

1. Añade un caso de test con una fecha en **día 1** (por ejemplo `"2026-02-01"`) y comprueba que cae en su mes.
2. Ejecuta los tests también en una zona horaria con UTC negativo, comprobando antes que esa zona se aplica de verdad:

```bash
docker compose exec -e TZ=America/New_York frontend node -e 'console.log(new Date().getTimezoneOffset())'
# 300 o 240 → la zona se aplica. 0 → instala tzdata y repite la comprobación:
docker compose exec -u root frontend apk add --no-cache tzdata
docker compose exec -e TZ=America/New_York frontend npm test
```

**Por qué:** que `TZ` se aplique depende de la imagen. En la Fase 2, con la imagen `node:24-alpine` de entonces, `TZ=America/New_York` no tenía efecto sin `tzdata` (`getTimezoneOffset()` devolvía 0), y el bug D2 quedó oculto (hallazgo T3). Tras reconstruir la imagen en la Fase 3 (Node 24.22.3, ICU 78.3), la zona se aplica sin `tzdata`. Como no se puede saber de antemano cuál de los dos casos tendrás, la comprobación del paso 2 es obligatoria. Hasta el commit `94b6fd1`, los tests de `computeMonthlyData` solo usaban los días 3, 5 y 8. Ahora existe el caso `"groups movements dated on the 1st into their own month"`, que falla con el código anterior en `America/New_York` y pasa con el actual. El `node_modules` del host está vacío porque el compose lo monta como volumen anónimo, así que los tests no se pueden ejecutar fuera del contenedor sin instalar dependencias.

**✅ Haz:** comprobar primero que la zona horaria se aplica (`docker compose exec -e TZ=America/New_York frontend node -e 'console.log(new Date().getTimezoneOffset())'` debe dar `300` o `240`) y después ejecutar `npm test` con ese `TZ`.

**❌ Evita:** ejecutar `TZ=America/New_York npm test` sin comprobar antes el offset y concluir que funciona.

**Cómo comprobarlo:** el test del día 1 pasa con y sin `TZ=America/New_York`, y fallaría con el código anterior a la corrección. Si instalaste `tzdata`, desaparece cada vez que el contenedor se **recrea** (`docker compose up --build`, `docker compose down` seguido de `up`, o un cambio en `docker-compose.yml`). Por eso hay que repetir la comprobación del offset en cada sesión.
