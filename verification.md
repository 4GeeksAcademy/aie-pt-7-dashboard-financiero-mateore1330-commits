# Rastro de verificación

Registro de las afirmaciones generadas por el coding agent y su contraste con el código real del repositorio.

Leyenda: ✅ verificada en código o ejecución · ❌ incorrecta (con corrección) · ❓ sin verificar

---

## Fase 1: Comprender el handover

**Fecha de verificación:** 2026-11-13 (este dato importa porque los datos mock dependen de la fecha, ver #6).

### 1. Arranque del proyecto

Comando de arranque, tomado de [`README.es.md`](README.es.md) y [`docker-compose.yml`](docker-compose.yml):

```bash
docker compose up --build
```

| Comprobación | Comando / URL | Resultado |
|---|---|---|
| Servicios en ejecución | `docker compose ps` | ✅ `backend` en 8000 y 5678, `frontend` en 5173 |
| Health del backend | `curl localhost:8000/health` | ✅ `{"status":"ok"}` (200) |
| Documentación de la API | `localhost:8000/docs` | ✅ 200 |
| API a través del proxy de Vite | `curl localhost:5173/api/metrics` | ✅ 360 movimientos |
| Dashboard | `localhost:5173` en el navegador | ✅ 4 KPIs y 2 gráficas renderizadas |
| Tests del backend | `docker compose exec backend python -m pytest -q` | ✅ 15 passed, 1 warning |
| Tests del frontend | `docker compose exec frontend npm test` | ✅ 5 passed |
| Lint del frontend | `docker compose exec frontend npm run lint` | ✅ sin errores |

#### Incidencias de entorno

| Error | Causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon at unix:///Users/.../.docker/run/docker.sock. Is the docker daemon running?` | Docker Desktop estaba instalado pero no arrancado | Abrir Docker Desktop (`open -a Docker`), esperar a que muestre *Engine running* y volver a lanzar `docker compose up --build` |

### 2. Resumen del proyecto (verificado)

#### A. Qué hace

| # | Afirmación | Estado | Evidencia |
|---|---|---|---|
| 1 | Es un dashboard de métricas financieras: ingresos, gastos, beneficio y margen | ✅ | [`frontend/src/App.tsx`](frontend/src/App.tsx), cabecera *Financial Overview* |
| 2 | Muestra 4 KPIs: Total Income, Total Outcome, Profit y Profit Margin | ✅ | [`kpi-row.tsx`](frontend/src/components/dashboard/kpi-row.tsx) |
| 3 | Muestra 2 gráficas mensuales: *Income vs. Outcome* y *Profit Margin %* | ✅ | [`income-outcome-chart.tsx`](frontend/src/components/dashboard/income-outcome-chart.tsx), [`profit-percent-chart.tsx`](frontend/src/components/dashboard/profit-percent-chart.tsx) |
| 4 | Los datos corresponden a "2024 - Full Year" | ❌ | Es un texto fijo en [`App.tsx:50`](frontend/src/App.tsx#L50). La API devuelve datos del 2025-11-01 al 2026-10-28 |
| 5 | Los datos son mock y el backend los genera en cada petición | ✅ | Cada endpoint llama a `generate_mock_movements(seed=42)` en [`routes.py`](backend/app/routes.py) |
| 6 | Por la semilla fija, los datos son siempre los mismos | ❌ | Ver corrección más abajo |
| 7 | Cada movimiento tiene fecha, importe, tipo, categoría y tipo de negocio | ✅ | `FinancialMovement` en [`routes.py`](backend/app/routes.py) coincide con [`financial-types.ts`](frontend/src/lib/financial-types.ts) |
| 8 | Los ingresos son casi siempre `sales`. Los gastos se reparten entre `suppliers`, `operational`, `administrative` y `others` | ✅ | `_build_movement` en `routes.py`. En la API real: income = 175 `sales` y 22 `others` |

#### B. Cómo se conectan las piezas

| # | Afirmación | Estado | Evidencia |
|---|---|---|---|
| 9 | Hay 2 servicios (`frontend`, `backend`) y no hay base de datos | ✅ | [`docker-compose.yml`](docker-compose.yml). No hay ningún driver de base de datos en [`requirements.txt`](backend/requirements.txt) |
| 10 | Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts y shadcn/ui | ✅ | [`package.json`](frontend/package.json), [`components.json`](frontend/components.json) |
| 11 | Backend: Python 3.13, FastAPI y Pydantic, servido con uvicorn | ✅ | [`backend/Dockerfile`](backend/Dockerfile). Versiones instaladas: fastapi 0.162.6, pydantic 2.14.3, uvicorn 0.54.0. Uvicorn se lanza a través de `debugpy` |
| 12 | El frontend solo llama a `GET /api/metrics` y calcula los KPIs y los datos mensuales en el navegador | ✅ | Es el único `fetch` del frontend, en [`App.tsx:16`](frontend/src/App.tsx#L16), y usa `computeKPIs` y `computeMonthlyData` de [`financial-utils.ts`](frontend/src/lib/financial-utils.ts) |
| 13 | El backend expone 8 endpoints bajo `/api/metrics` y `/health`. El frontend no usa 7 de ellos | ✅ | 9 `@router.get` en `routes.py`. `grep "/api" frontend/src` solo encuentra `/api/metrics` |
| 14 | El proxy de Vite reenvía `/api` a `http://backend:8000`, así que no hacen falta variables de entorno | ✅ con un matiz | [`vite.config.ts`](frontend/vite.config.ts). Ver corrección más abajo |
| 15 | `VITE_API_BASE_URL` es opcional | ✅ | `import.meta.env.VITE_API_BASE_URL ?? ""` en [`App.tsx:13`](frontend/src/App.tsx#L13), [`.env.example`](frontend/.env.example) |
| 16 | El backend tiene CORS abierto a cualquier origen | ✅ | `allow_origins=["*"]` y `allow_credentials=True` en [`main.py`](backend/app/main.py) |
| 17 | `mock-data.ts` y `hero.png` no se usan en ningún sitio | ✅ | `grep` no encuentra ningún import de [`mock-data.ts`](frontend/src/lib/mock-data.ts) ni de [`hero.png`](frontend/src/assets/hero.png) |

#### C. Cómo se ejecuta

| # | Afirmación | Estado | Evidencia |
|---|---|---|---|
| 18 | Se arranca con `docker compose up --build`, sin pasos previos | ✅ con un matiz | Requiere tener Docker Desktop arrancado (ver incidencias de entorno) |
| 19 | Puertos: frontend 5173, backend 8000, documentación en `/docs` y debugpy en 5678 | ✅ | `docker-compose.yml` y `docker compose ps`. Los tres primeros respondieron 200 |
| 20 | Los dos servicios tienen recarga en caliente | ✅ | Volúmenes en el compose y `--reload` en el Dockerfile del backend. Probado con `touch` sin cambiar contenido. Logs: `[vite] (client) hmr update /src/App.tsx` y `WatchFiles detected changes in 'app/main.py'. Reloading...` |
| 21 | Tests del backend con pytest y del frontend con Vitest (`npm test`) | ✅ | 15/15 y 5/5 en verde |
| 22 | Las dependencias del backend no tienen versiones fijas. Las del frontend sí, con `package-lock.json` | ✅ con un matiz | [`requirements.txt`](backend/requirements.txt) no tiene versiones. El [`frontend/Dockerfile`](frontend/Dockerfile) usa `npm install` en lugar de `npm ci` |

### 3. Correcciones (afirmación incorrecta → corrección)

- **#4. "Los datos son de 2024 - Full Year"** → Los datos cubren los 12 meses anteriores al mes actual. Hoy (2026-11-13) eso es de noviembre de 2025 a octubre de 2026. La etiqueta `period="2024 - Full Year"` está escrita a mano en `App.tsx:50` y no se calcula a partir de los datos.
- **#6. "La semilla `seed=42` hace que los datos sean siempre iguales"** → La semilla fija los importes, los tipos y los días del mes, pero **el año de cada mes depende de `date.today()`** (`_year_for_month` en `routes.py`). Simulando `today = 2026-03-15`, el rango pasa a ser de 2025-03-01 a 2026-02-28, con los mismos `(mes, día, importe)`. Los datos solo son idénticos entre ejecuciones del mismo mes.
- **#14. "No necesitas variables de entorno ni en desarrollo local"** (README) → Solo es cierto si se ejecuta con Docker. `backend` es un nombre de host de la red de Docker Compose y no se puede resolver desde el Mac. Si se ejecuta `npm run dev` fuera de Docker, el proxy no llegará al backend.

### 4. Observaciones para fases siguientes

Estos hallazgos no forman parte del resumen, pero se detectaron durante la verificación y se analizarán en la Fase 2:

- `pytest` muestra el aviso `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated`. Es una consecuencia directa de no fijar versiones en `requirements.txt` (#22).
- `/health` no pasa por el proxy de Vite. Si se pide en `localhost:5173/health`, devuelve el HTML del frontend y no el JSON.
- El `<title>` de [`index.html`](frontend/index.html) es `frontend`.
- Toda la lógica del backend (modelos, generación de datos, filtros y endpoints) está en un único archivo, `routes.py`.
- `generate_mock_movements(seed=...)` llama a `random.seed()`, que modifica el estado global del módulo `random`.

---

## Fase 2: Hallazgos de ingeniería

**Fecha de verificación:** 2026-11-13. El análisis completo está en [`engineering-findings.md`](engineering-findings.md).

### Correcciones (afirmación incorrecta → corrección)

- **"El agrupado mensual funciona en cualquier zona horaria: `TZ=America/New_York npm test` pasa dentro del contenedor"** → Era un falso negativo. La imagen `node:24-alpine` no trae datos de zonas horarias, así que `TZ` no tiene efecto (`getTimezoneOffset()` devolvía 0). Repitiendo la prueba con Node en el host, `new Date("2024-02-01").getMonth()` devuelve enero en `America/New_York`. Con los datos reales de la API salen 13 meses en lugar de 12. Se documenta como bug D2 y riesgo T3.
- **"Tras el filtrado quedan 16 hallazgos"** → Recuento erróneo del agente. Al contar las filas de la tabla salen **22** hallazgos. Las fusiones eran correctas y la cifra se corrigió antes de redactar las reglas.
- **"El idioma de la interfaz es inglés porque casi todos los textos lo están"** → La conclusión era correcta pero la evidencia era débil. La revisión humana aportó una prueba explícita: `lang="en"` en [`frontend/index.html:2`](frontend/index.html#L2). Se añadió a la evidencia de N6.

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Agrupación por mes con los datos reales de `/api/metrics` en `Europe/Madrid` y `America/New_York` (Node en el host) | 12 meses frente a 13 meses. Bug confirmado |
| Recuento de estilos de comillas y `;` en los imports de `frontend/src` | Dos estilos distintos según la carpeta (N3) |
| Búsqueda de configuración de formateador, linter de Python o CI | No existe ninguna (N3, T4) |
| `git log` | Conventional Commits solo en los commits recientes (G1) |
