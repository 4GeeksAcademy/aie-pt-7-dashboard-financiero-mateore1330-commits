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

---

## Fase 3: Implementar y probar reglas

**Fecha:** 2026-11-13

### Correcciones (afirmación incorrecta → corrección)

- **El índice de reglas creado como `.agents/rules/README.md`** → No seguía la estructura que define [`README.es.md`](README.es.md) (`/rules/<nombre-regla>.md`, donde cada archivo es una regla). Tampoco tenía nombre, alcance ni justificación, que es lo que pide la Fase 3 para cada archivo de reglas. Detectado en la revisión humana. Se renombró a [`using-rules.md`](.agents/rules/using-rules.md) y se reescribió como regla (UR-01 y UR-02), con cabecera `name` / `description` / `scope` y el mismo formato que el resto.
- **TE-04 (Fase 2): "Ejecuta los tests con `TZ=America/New_York` fuera del contenedor"** → No era aplicable. El `frontend/node_modules` del host está vacío (el compose lo monta como volumen anónimo), así que Vitest no se puede ejecutar en el host. Se comprobó una alternativa dentro del contenedor: con `docker compose exec -u root frontend apk add --no-cache tzdata`, `TZ=America/New_York` pasa a aplicarse (`getTimezoneOffset()` = 300) y `npm test` se ejecuta en esa zona horaria. TE-04 se redactó con ese método.
- **Referencias de línea en el hallazgo N6 y en las reglas** → `App.tsx:36` no es el mensaje en español (es `setError(`): el mensaje está en `App.tsx:37`. `App.tsx:45` no es la clase `dark` (es `return (`): está en `App.tsx:46`. Se corrigieron en `engineering-findings.md` y `frontend.md`. También se corrigió la comprobación de FE-10, que decía que `grep "mock-data"` devolvía el propio archivo, cuando no devuelve nada.

### Comprobaciones ejecutadas al redactar las reglas

| Comprobación | Resultado |
|---|---|
| `docker compose exec frontend npm run build` (citado en TE-01, que no se había ejecutado antes) | ✅ Build correcto. Muestra un aviso de tamaño de chunk que ya existía |
| Comandos de "Cómo comprobarlo" de FE-01, FE-02, FE-03, FE-06 y FE-10 sobre el código actual | ✅ Dan el resultado que indica cada regla |
| Comando de comprobación de EN-02 | ❌ Lista los 6 paquetes sin versión. Es lo esperado: la tarea de validación T-C debe corregirlo |
| Líneas citadas en las reglas (`kpi-card.tsx:37`, `income-outcome-chart.tsx:50` y `:113`, `profit-percent-chart.tsx:51`, `index.html:2`, `Dockerfile:6`, `test_routes.py:160`) | ✅ Contienen lo que se cita |

### Validación de las reglas con tareas reales

**Método:** cada tarea la hizo un **agente nuevo, sin el contexto de esta conversación**. Solo se le indicó que leyera `AGENTS.md` y siguiera sus instrucciones, sin pistas sobre la solución ni sobre qué reglas aplicar. El agente que redactó las reglas revisó después cada diff y cada plan contra las reglas, y comprobó por su cuenta las afirmaciones nuevas de los agentes. Los agentes no hicieron commits; los hizo la persona responsable del repositorio.

#### Ronda 1: seis tareas

| Tarea | Enunciado dado al agente | Tipo | Resultado | Reglas que guiaron el trabajo |
|---|---|---|---|---|
| T-A | "Usuarios en EE. UU. ven un mes extra (octubre 2025) y los movimientos del día 1 aparecen en el mes anterior. Arréglalo." | Real → `94b6fd1` | ✅ | FE-09 (`slice(0, 7)`), FE-08, FE-04, TE-04 (instaló `tzdata` y comprobó que el test nuevo **falla con el código anterior** en `America/New_York`), TE-01 (eliminó el helper que quedaba sin usar porque `npm run build` habría fallado) |
| T-B | "El test `test_metrics_comparison_returns_delta_fields` parece frágil y no comprueba gran cosa. Mejóralo." | Real → `f0dfdc5` | ✅ | TE-03 (fechas sacadas de los datos y comprobación de valores), TE-02, BE-02. Comprobó con mutaciones en memoria que el test detecta la lógica rota |
| T-C | "Cada build puede instalar versiones distintas y ha aparecido un aviso nuevo en los tests. Haz las instalaciones del backend reproducibles." | Real (pendiente de commit) | ✅ | EN-02 (31 paquetes con `==`, sin cambiar ninguna versión), BE-04 (no tocó el `Dockerfile`; propuso fijar la imagen base en lugar de hacerlo), BE-05 (huella de datos igual antes y después) |
| T-D | "Un compañero se lio al arrancar el proyecto y creyó que el backend estaba bien porque una URL daba 200. Mejora la documentación." | Real → `a99e418` | ✅ | GD-02 (los dos README con los mismos 8 encabezados), EN-01 (tabla de URLs y aviso sobre `5173/health`) |
| T-E | "Queremos una tarjeta KPI de beneficio medio mensual." | Solo plan | ✅ | FE-01, FE-02, FE-05, FE-06, FE-07, FE-08, FE-09 y TE-04 (caso de día 1 por iniciativa propia) |
| T-F | "Los movimientos necesitan un campo `currency` y el frontend quiere llamar a la API desde `localhost:4000`." | Solo plan | ✅ | **BE-04:** comprobó con `curl` que la configuración CORS actual **ya permite** ese origen y no propuso cambiarla. **BE-03:** planificó backend, TypeScript, datos de ejemplo y `mock-data.ts` juntos |

**Fallos de las reglas detectados en la ronda 1 y refinamientos aplicados:**

| # | Regla | Problema detectado | Detectado por | Refinamiento |
|---|---|---|---|---|
| 1 | FE-04 | Decía que `lib/` usa comillas dobles, pero `financial-types.ts` usa simples | T-E | Tabla de estilos por archivo |
| 2 | BE-02 / TE-03 | BE-02 prohibía "cambiar tests existentes", y TE-03 obliga a arreglar los tests frágiles | T-B y T-F | Se permite reforzar tests; se prohíbe borrarlos o debilitarlos |
| 3 | BE-02 / BE-03 | BE-02 decía "solo campos opcionales", pero el ejemplo de BE-03 añadía uno obligatorio | T-F | Lista explícita de cambios compatibles, incluidos los campos nuevos en las respuestas |
| 4 | TE-01 | No decía qué hacer en cambios solo de documentación, con cambios ajenos sin commitear, ni cuándo reconstruir | T-D, T-B y T-A | Tres casos nuevos explícitos |
| 5 | FE-09 | Citaba líneas que ya no existían tras el arreglo | T-A | Cita el commit del arreglo y el test que lo protege |
| 6 | TE-04 | `tzdata` se pierde al **recrear** el contenedor, no solo con `--build`. `engineering-findings.md` mantenía la propuesta antigua ("fuera del contenedor") | T-A y T-E | Texto corregido, con cómo detectarlo (el offset vuelve a dar `0`). Nota en `engineering-findings.md` |
| 7 | *(faltaba)* | Ninguna regla avisaba de que añadir una llamada a `random` cambia todos los datos de `seed=42` | T-F | **Nueva regla BE-05**. Verificado: con una llamada extra a `random.random()`, solo **2 de 360** movimientos siguen iguales. Incluye un comando de huella, cuya estabilidad se comprobó |
| 8 | EN-02 | Solo hablaba de dependencias *nuevas*, y su "Por qué" quedó desactualizado tras T-C | T-C | Cubre las transitivas, `pip check` y el estado actual |

Además, la guía de BE-04 se amplió con lo que hizo bien T-F: comprobar primero si la configuración actual ya permite lo que se pide.

#### Ronda 2: nueva validación de las reglas refinadas

Se dio a otro agente nuevo una tarea distinta, diseñada para pasar por las reglas cambiadas (solo plan): *"Añade un `description` aleatorio por categoría a los movimientos, un filtro opcional `min_amount` en `/api/metrics`, refuerza `test_metrics_summary_by_week_honors_business_type_filter` y documenta el filtro"*.

| Regla refinada | ¿Siguió apareciendo el problema? | Evidencia en el plan |
|---|---|---|
| BE-02 / TE-03 (refinamiento 2) | ✅ No | Reforzó el test conservando todas sus aserciones, sin señalar ninguna contradicción |
| BE-02 / BE-03 (refinamiento 3) | ✅ No | Trató el campo nuevo y el parámetro opcional como cambios compatibles |
| FE-04 (refinamiento 1) | ✅ No | Comillas simples en `financial-types.ts` y `mock-data.ts`, dobles en `financial-utils.test.ts` |
| BE-05 (refinamiento 7) | ✅ Aplicada | Generador `random.Random(seed)` independiente, y huella `653dc99efad4835b` antes y después |
| TE-01 (refinamiento 4) | ✅ Aplicada | Avisó de los cambios ajenos sin commitear y propuso `git add` con rutas explícitas |
| GD-02 | ✅ Aplicada | La misma subsección en los dos README |

**Problemas nuevos detectados en la ronda 2 y refinamientos aplicados** (todos comprobados en el código antes de cambiar la regla):

| # | Regla | Problema | Refinamiento |
|---|---|---|---|
| 9 | BE-03 | Solo listaba 2 de los 4 arrays `FinancialMovement[]` del test (faltaban `onlyOutcomes` y `firstOfMonthMovements`), así que seguirla al pie de la letra rompería el build | Pide **todos** los arrays e incluye el `grep` para encontrarlos. Aclara que `mock-data.ts` se mantiene compilando y no se borra salvo que se pida |
| 10 | BE-01 | Solo cubría endpoints nuevos, no parámetros nuevos en uno existente. Su "Por qué" decía que *todos* los endpoints siguen el patrón, pero el filtro `business_type` está repetido en línea en 4 endpoints (`routes.py:280`, `:298`, `:314` y `:353`) | Cubre los parámetros nuevos, pide un helper `filter_movements_by_<criterio>` sin cambiar la firma de `filter_movements` (usada en 7 endpoints) y marca esa duplicación como algo que no hay que copiar |
| 11 | TE-03 | Su evidencia (`test_routes.py:160`) quedó desactualizada tras `f0dfdc5`. Además, solo hablaba de fechas, no de umbrales de valor | Cita el commit del arreglo e incluye los umbrales de valor con un ejemplo |
| 12 | GD-01 | No decía si los tests de un `feat` van en el mismo commit, ni cómo separar cambios que tocan el mismo archivo sin `git add -p` | Los tests van con su `feat` o `fix`. Los cambios en el mismo archivo se hacen en secuencia. `git add` siempre con rutas explícitas |
| 13 | `engineering-findings.md` | Los hallazgos ya corregidos (T2, D2…) seguían descritos como vigentes, en contra de UR-02 | Nueva sección "Estado tras la Fase 3" con el commit de cada corrección |

**Señalado por los agentes, pero no convertido en regla** (no se apoya en un hecho del repositorio, o es una decisión de producto): cómo definir "beneficio medio mensual", el tratamiento de varias monedas mezcladas, si `min_amount` debe repetirse en `/b2b` y `/b2c`, dónde documentar la API además del README, el idioma de los textos de los datos mock, la ausencia de tests de componentes y el trailer `Co-Authored-By` en los commits.

#### Limitaciones de la validación

- **T-A no es una prueba independiente de FE-09:** la regla nació del propio bug y ya describía la solución. Demuestra que la regla se encuentra y se aplica, pero no que guíe un problema nuevo. Las pruebas más fuertes son T-E, T-F y la ronda 2, donde las reglas se aplicaron a problemas que no describen.
- T-E, T-F y la ronda 2 son **solo planes**: validan cómo razona el agente, no código ejecutado.
- T-A, T-B, T-D, T-E y T-F se ejecutaron en paralelo sobre el mismo árbol de trabajo, así que los resultados de TE-01 de cada agente incluían cambios de los demás. Los diffs se revisaron por separado y cada tarea se commiteó solo con sus archivos.
- Efectos secundarios en el entorno, sin cambios en el repositorio: se instaló `tzdata` en el contenedor del frontend, y T-C reconstruyó las imágenes, con lo que se recrearon los contenedores y `tzdata` desapareció.
