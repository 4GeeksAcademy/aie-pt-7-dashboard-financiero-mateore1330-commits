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

---

## Fase 4: Construir la memoria del proyecto

**Fecha:** 2026-11-13. Se creó [`memory-bank/`](memory-bank/) con 4 archivos (`product-overview.md`, `tech-stack.md`, `architecture.md` y `current-state.md`) y la regla UR-03 para mantenerlos.

### Datos recogidos antes de redactar

Para no reutilizar sin más lo de fases anteriores, se volvió a comprobar el estado del repositorio:

| Comprobación | Resultado |
|---|---|
| Runtimes (`python --version`, `node --version`, `npm --version` en los contenedores) | Python 3.13.18, Node 24.22.3, npm 11.19.1 |
| Versiones instaladas (`npm ls --depth=0`, `pip freeze`, `package-lock.json`) | Por ejemplo, React **19.2.5** instalado frente a `^19.2.4` en `package.json` |
| Endpoints (`openapi.json`) y llamada real a los 9 | Todos 200 con parámetros válidos. `/comparison` sin fechas da 422 |
| Ausencia de autenticación y base de datos (`grep`) | Sin resultados |
| Tests, lint y build | 15 passed · 6 passed · OK · OK (bundle JS de 584 kB) |

### Correcciones (afirmación incorrecta → corrección)

- **"En la imagen `node:24-alpine`, `TZ` no tiene efecto sin `tzdata`" (TE-04 y hallazgo T3)** → Ya no es cierto. Tras reconstruir la imagen en la Fase 3, el contenedor no tiene `tzdata` ni `/usr/share/zoneinfo`, pero `TZ=America/New_York` sí se aplica (`getTimezoneOffset()` = 300, `new Date("2024-02-01").getMonth()` = enero), porque Node 24.22.3 trae sus propios datos de zonas horarias en ICU (tz 2026e). No se pudo determinar por qué la imagen anterior se comportaba de otra forma, porque ya no está disponible para compararla. TE-04 se reescribió para **comprobar primero** el offset e instalar `tzdata` solo si da 0.
- **El agente escribió que la verificación de "los 9 endpoints" ya estaba hecha** → Solo se habían probado algunos. Se llamó a los 9 antes de dar el dato por bueno, y se precisó que `/comparison` sin fechas devuelve 422.

### Auditoría independiente del `memory-bank`

Un **agente nuevo, sin contexto**, revisó los 4 archivos contra el código, los contenedores en marcha y `git log`, con la instrucción de buscar afirmaciones falsas, sin evidencia, inventadas o desactualizadas. **No encontró afirmaciones de producto, usuarios ni roadmap inventados.** Confirmó como correctos, entre otros datos, los 9 endpoints y sus parámetros, todas las versiones, los valores de los KPIs, los recuentos de tests, el tamaño del bundle, las referencias de línea del frontend y los 8 hashes de commit.

Encontró estos problemas, todos comprobados antes de corregirlos:

| Archivo | Afirmación | Realidad | Gravedad | Corrección |
|---|---|---|---|---|
| `tech-stack.md` | "`tsc` estricto" | **Ningún `tsconfig` activa `strict`**: solo `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` y `noFallthroughCasesInSwitch` | ❌ Incorrecta | Indica que `strict` no está activado. Se añadió como carencia en `current-state.md` |
| `architecture.md`, `current-state.md`, `backend.md` (BE-01) | Filtro `business_type` "en 4 endpoints (`:280`, `:298`, `:314`, `:353`)" | Está en **6**: 4 con el parámetro opcional (los bloques empiezan en `:278`, `:296`, `:312` y `:351`) y 2 con valor fijo (`/b2b` `:370` y `/b2c` `:386`) | Imprecisa | Los tres archivos corregidos |
| `product-overview.md` | `/alerts`: "gasto que supera la media histórica" | Compara con la media de los periodos **anteriores**, el umbral es una proporción y el primer periodo nunca alerta | Imprecisa | Descripción exacta con la fórmula |
| `product-overview.md` | "`sales` el 90 %", "B2B el 55 %" | Son probabilidades del generador. Con `seed=42`, B2B = 203/360 (56,4 %) y `sales` = 175/197 ingresos (88,8 %) | Imprecisa | Separa las probabilidades de los valores observados |
| `product-overview.md` | La semilla fija "importes, tipos, categorías y días" | También fija `business_type` y la proporción de ingresos de cada mes (45-70 %) | Incompleta | Lista completa |
| `architecture.md` | "`/health` y `/docs` solo responden en el 8000" | En el 5173 responden **200 con el HTML del frontend** (hallazgo E1) | Imprecisa | Aviso explícito |
| `architecture.md` | "Fuera de Docker, el proxy no funciona sin `VITE_API_BASE_URL`" | La variable no arregla el proxy, lo **evita**: las peticiones van directas al backend gracias a CORS `*` | Imprecisa | Explicación corregida |
| `current-state.md` y **`engineering-findings.md`** | "22 hallazgos" | Las tablas tienen **25** (10 convenciones y 15 riesgos), y la trazabilidad, 25 filas. Las 22 **reglas** sí eran correctas | ❌ Incorrecta | Total corregido en `engineering-findings.md` y nota en `current-state.md` |
| Los 4 archivos | `last_verified: … (commit 1b46bed)` | El `memory-bank` y UR-03 aún no estaban en ese commit | Desactualizada | "Sobre 1b46bed y los cambios de la Fase 4" |
| `product-overview.md` | "Si la API falla, aparece un mensaje de error" | Además, los KPIs muestran "—" y las gráficas "No data available to display" | Incompleta | Ampliado |

**Corrección sobre una corrección anterior:** en la Fase 2 se registró *"16 hallazgos → recuento erróneo, son 22"*. Esa segunda cifra también estaba mal: son **25**. Al contar, se tomaron las 22 reglas por hallazgos. Lo detectó la auditoría de esta fase.

El auditor también señaló **información que faltaba**, y se añadió:
- El `StrictMode` de `main.tsx` ejecuta dos veces el `useEffect` en desarrollo, así que hay 2 peticiones por carga.
- `components.json` declara `"cssVariables": false` aunque el tema se basa en variables CSS.
- Los datos se regeneran en cada petición.
- Las claves de periodo de `/summary`.
- El valor por defecto de `/categories/top`.

---

## Skills · Fase 1: Descubrir y cargar las skills

**Fecha:** 2026-11-16. Plan: [`plans/phase-1-discover-skills.md`](plans/phase-1-discover-skills.md).

Se instalaron `accessibility` (`addyosmani/web-quality-skills`) y `vercel-react-best-practices` (`vercel-labs/agent-skills`) en [`.agents/skills/`](.agents/skills/), y se registraron en [`skills-lock.json`](skills-lock.json). El detalle está en [`memory-bank/progress.md`](memory-bank/progress.md).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Build, lint y tests antes de cambiar nada | ✅ Build OK, con 1 advertencia ya existente (JS de 584,17 kB > 500 kB) · lint limpio · 6 tests de frontend · 15 de backend |
| Instalación de prueba en una carpeta temporal | ✅ Solo crea `.agents/skills/<skill>/` y `skills-lock.json` |
| `diff -r` entre lo instalado y los repos de origen | ✅ Idénticos |
| Archivos ejecutables o scripts en las skills | ✅ Ninguno: solo `.md` y `.json` |
| Afirmación del enunciado: "la skill de Vercel cubre `next/image`, `next/font` y metadatos" | ❌ `grep` sin resultados en sus 72 archivos de reglas y en `AGENTS.md` |

### Correcciones (afirmación incorrecta → corrección)

- **"La palabra `metadata` no aparece en la skill de Vercel"** → Sí aparece, pero como *request metadata* en `async-cheap-condition-before-await.md:10`, que no habla de los metadatos de la página. Se detectó al releer antes de la revisión.

### Revisión independiente de `progress.md`

Un **agente nuevo, sin contexto**, contrastó `progress.md` con las skills instaladas, el código y `node_modules`, y volvió a ejecutar build, lint y tests. Confirmó como correctos los recuentos (70 reglas y su reparto por prefijo, los 3 archivos de `accessibility`), las referencias de línea de los landmarks y del título, el resultado de partida y `skills-lock.json`. **No encontró ninguna regla mal clasificada.**

Encontró estos problemas, todos comprobados antes de corregirlos:

| Afirmación | Realidad | Gravedad | Corrección |
|---|---|---|---|
| "Los únicos comandos que aparecen son `pnpm install` y `npx svgo`" | `accessibility/SKILL.md:413` y `:416` traen `npx lighthouse` y `npm install @axe-core/cli -g`, y el README de Vercel, 5 comandos `pnpm` | ❌ Incorrecta | Lista completa |
| "Hoy no hay botones ni enlaces", como si no hubiera nada que usar con el teclado | Recharts 3.8.1 activa `accessibilityLayer` por defecto (`CartesianChart.js:24`), y con eso cada gráfico recibe `tabIndex=0` y `role="application"` (`RootSurface.js:44-54`). **Los dos gráficos se pueden enfocar con Tab** | Imprecisa | Fila reescrita: el teclado y el foco se comprueban en los gráficos |
| "Falta comprobar si los iconos se anuncian" | `lucide-react` 1.8.0 ya pone `aria-hidden="true"` (`Icon.js:36`) a los iconos sin hijos ni props de accesibilidad | Imprecisa | Con la evidencia. Queda confirmarlo en el navegador |
| "Movimiento reducido: Recharts anima los gráficos" | También `ui/skeleton.tsx:7` (`animate-pulse`) y `kpi-card.tsx:53` (`transition-colors`) | Incompleta | Añadidos |
| "La carga y el error de `App.tsx:51`" | Esa línea es solo el error (`:51-55`). La carga son los `Skeleton` de cada componente | Imprecisa | Referencias corregidas |
| "`App.tsx:24-27` guarda `metrics` y `monthlyData`" | Están en `:24-25`. `:26-27` son `loading` y `error` | Imprecisa | Corregido |
| Clasificación de las 70 reglas de Vercel | Faltaban 9 reglas (`bundle-preload`, `bundle-analyzable-paths`, `rendering-usetransition-loading`, `async-defer-await`…) | Incompleta | Clasificadas: 5 posibles y 4 que no aplican |
| Fila "Arranque": `up --build` en la tabla y `up -d` en el texto | Las imágenes ya estaban construidas, así que se usó `up -d` | Poco clara | Se indican los dos comandos |

**No verificable sin conexión** por el revisor: el número de instalaciones, la versión del CLI y el `diff -r` con los repos de origen. Los comprobó el agente principal durante la instalación.

---

## Skills · Fase 2: Aplicar la skill `accessibility`

**Fecha:** 2026-11-16/17. Plan: [`plans/phase-2-accessibility.md`](plans/phase-2-accessibility.md). El detalle de los cambios está en [`memory-bank/progress.md`](memory-bank/progress.md) (Fase 2).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Lighthouse Accessibility (Snapshot, Mobile) antes y después | ✅ 100 → 100. Fallan 0 → 0, pasan 20 → 23 (las 3 nuevas validan la tabla) |
| TE-01 tras los cambios | ✅ pytest 15 · vitest 6 · lint OK · build OK. Sin advertencias nuevas (JS de 585,86 kB) |
| Árbol de accesibilidad, teclado y foco en el navegador | ✅ Gráficas con nombre, `h2`, tablas, `status` y tooltip anunciado. Foco sólido (4,6:1) |
| Estado de error (backend parado un momento) | ✅ `role="alert"` con el mensaje. El backend se volvió a arrancar (`/health` → ok) |
| Contraste (16 pares `.dark`, calculado en el navegador) | ✅ Todos pasan salvo el anillo de foco al 50 % (2,02:1), que se corrigió en A7 |

### Correcciones (afirmación incorrecta → corrección)

- **"Lighthouse en modo Navigation no puede auditar la app (`NO_FCP`)"** → La app pinta en 0,1 s con la pestaña en primer plano; con la pestaña oculta, Chrome retrasa el pintado (9,9 s medidos). Se usó el modo Snapshot, que la skill admite.
- **"`title` en `<LineChart>` da nombre a la gráfica" (A2)** → Chrome no tomaba el `<title>` del SVG como nombre del `role="application"`: el árbol seguía mostrando `application` sin nombre. Se cambió por `aria-label`, y ahora sí lo muestra.
- **"`sr-only` en la `<table>` la reduce a 1 px" (A3)** → Las tablas no respetan el `width`/`height` de `sr-only`: la caja medía 221×336 px, aunque no se veía (`clip-path`). Se envolvió en un `div.sr-only`, que mide 1×1 px.

### Revisión independiente del diff

Un **agente nuevo, sin contexto**, revisó el diff contra la skill y contra `.agents/rules/frontend.md`, y volvió a ejecutar build, lint y tests. Confirmó como correctos:
- `sr-only` y `motion-safe:` en Tailwind 4, con el CSS generado comprobado;
- el `aria-label` en el SVG (Recharts lo deja pasar);
- la leyenda discontinua;
- que el cambio de foco solo afecta al `outline-color` y da 4,68:1;
- los `h2`, la tabla y el `role="alert"`;
- y FE-01/02/03/04/06/07/08.

Encontró estos problemas, todos comprobados antes de decidir:

| # | Afirmación o cambio | Realidad | Gravedad | Decisión |
|---|---|---|---|---|
| R1 | `role="status"` con "Loading financial data…" anuncia la carga | El texto ya estaba al crear la región, y los lectores de pantalla solo anuncian **cambios**. Después se vaciaba, así que en la práctica no anunciaba nada (patrón de *live regions* de la skill) | Debe corregirse | La región empieza vacía y dice "Financial data loaded." |
| R2 | El `desc` dice "use las flechas" | Al usarlas no se anunciaba nada: el tooltip de Recharts por defecto tiene `role="status"` (`DefaultTooltipContent.js:133-136`), pero los `CustomTooltip` no | Debe corregirse | `role="status" aria-live="polite"` en los dos tooltips |
| R3 | `aria-busy` en las secciones | No aparece en la skill (`grep` sin resultados) y no aportaba nada | Detalle | Quitado |
| R4 | `motion-safe:animate-pulse` | Es válido, pero el parpadeo es de opacidad y no de movimiento | Detalle | Se mantiene, justificado por la sección "Motion (2.3)" de la skill |
| R5 | Hijos de `<>` sin sangrar | Decisión deliberada por FE-04 | Detalle | Sin cambios |
| R6 | Iconos de la leyenda | Recharts les pone `aria-label="income legend icon"` (`DefaultLegendContent.js:133`) | Detalle | Limitación aceptada |
| R7 | Etiqueta y valor de cada KPI | Sin relación programática (1.3.1) | Detalle | `<dl>/<dt>/<dd>` aplicado, con el mismo aspecto |

---

## Skills · Fase 3: Aplicar la skill `vercel-react-best-practices`

**Fecha:** 2026-11-17. Plan: [`plans/phase-3-vercel-react-best-practices.md`](plans/phase-3-vercel-react-best-practices.md). El detalle está en [`memory-bank/progress.md`](memory-bank/progress.md) (Fase 3).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Composición del bundle (*source maps*) | Recharts y sus dependencias ≈ 58 % del JS; lucide, solo 5 iconos |
| Build antes → después | 585,86 kB con advertencia → 229 kB iniciales + Recharts en diferido, **sin advertencias** |
| CLS (backend en pausa, `PerformanceObserver`) | 0,0116 → **0**, con la misma altura en 8 anchos (320-1366 px) |
| Orden de descarga | El código de las gráficas se descarga en paralelo a la API (~52-64 ms) |
| Fallo de carga de una gráfica (`throw` temporal, retirado) | ✅ Solo esa gráfica muestra el error; el resto sigue funcionando |
| TE-01 | ✅ pytest 15 · vitest 6 · lint OK · build OK |

### Correcciones (afirmación incorrecta → corrección)

- **"El CLS es 0" (primera medición)** → La API responde en ~0,1 s y los *skeletons* casi no se llegaban a ver. Con el backend en pausa (`docker compose pause backend`), el CLS real era 0,0116.
- **"V3 deja el CLS a 0" (medido solo a 1366 px y en 3 iframes)** → La revisión independiente lo dudó. Al medir 320, 360, 640 y 700 px, seguía habiendo saltos de ~20 px: el texto de ayuda de las KPI y la descripción de las gráficas pasan a 2 líneas. Se corrigió reservando esas líneas (F2 y F3).
- **Referencias de línea en reglas y documentación** → `income-outcome-chart.tsx:113` (FE-06) estaba desfasada desde la Fase 2, y `App.tsx:16/37/46/49` se movieron en esta fase. 14 referencias corregidas en `.agents/rules/`, `engineering-findings.md` y el memory-bank.

### Revisión independiente del diff

Un **agente nuevo, sin contexto**, revisó el diff contra la skill y contra `frontend.md`, y volvió a ejecutar build, lint y tests. Confirmó como correcto:
- `React.lazy` con exportaciones con nombre (FE-02 se mantiene);
- un `Suspense` por gráfica;
- **sin cascada**: el código de las gráficas y la API se piden en paralelo, y Recharts se descarga una sola vez;
- rutas de `import()` estáticas (`bundle-analyzable-paths`);
- que `bundle-preload` no aportaría nada;
- FE-02/03/04 y eslint;
- la accesibilidad de la Fase 2 intacta;
- que no faltaba ninguna regla que aplique.

| # | Hallazgo | Comprobación | Gravedad | Decisión |
|---|---|---|---|---|
| F1 | Sin *error boundary*, un fallo al cargar el código de una gráfica desmonta toda la app | ✅ No había ninguno (`grep`) | Debe corregirse | `ChartErrorBoundary` por gráfica, comprobado con un fallo provocado |
| F2 | El *skeleton* del texto de ayuda no encaja por debajo de `xl` | ✅ Medido: salto en 320, 640 y 700 px | Debe corregirse | `min-h-[3.25em]` en el `<dd>` y en el *skeleton* |
| F3 | La descripción de las gráficas ocupa 2 líneas en el móvil | ✅ Medido: 422 → 442 px en 320 y 360 px | Debe corregirse | `max-sm:min-h-10` en la descripción y en el *skeleton* |
| F4 | El trozo `chart-skeleton-*.js` tiene un nombre confuso: es código compartido | ✅ | Detalle | Se deja: es el comportamiento del bundler |
| F5 | El *skeleton* del *fallback* se cambia por el de la gráfica, y el parpadeo se reinicia | ✅ | Detalle | Se deja: misma altura, sin salto |
| F6 | "Financial data loaded." puede anunciarse antes de que se pinte la gráfica | ✅ En teoría | Detalle | Se deja: el código de las gráficas empieza a descargarse antes que la API |

## Skills · Fase 4: Explorar el ecosistema y aplicar `seo` y `fastapi`

**Fecha:** 2026-11-17. Plan: [`plans/phase-4-explore-ecosystem.md`](plans/phase-4-explore-ecosystem.md). El detalle está en [`memory-bank/progress.md`](memory-bank/progress.md) (Fase 4).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npx skills find` en 6 temas | `seo`, `testing`, `typescript`, `tailwind`, `fastapi` y `performance`, con los resultados anotados |
| Skills instaladas = skills leídas | ✅ `diff` sin diferencias entre los `SKILL.md` leídos antes de instalar y los instalados |
| Lighthouse SEO (Snapshot, Mobile) | 60 → **100** (informes `lighthouse-seo-antes.json` y `lighthouse-seo-despues.json`) |
| `openapi.json` antes y después | ✅ Idéntico |
| Validación de parámetros | ✅ 422 en `/comparison` sin fechas, `limit=99` y `category=foo` |
| TE-01 | ✅ pytest 15 · vitest 6 · lint OK · build sin advertencias |

### Correcciones (afirmación incorrecta → corrección)

- **"Frontend en TypeScript estricto" (plan)** → Ningún `tsconfig` activa `strict`. Corregido en el plan antes de buscar.
- **Primer informe `lighthouse-seo-antes.json`** → Solo traía la categoría Accesibilidad. Se repitió marcando SEO.
- **"Con `noindex` bajará la nota SEO"** → En modo Snapshot no corre `is-crawlable`, así que la nota no baja. Solo fallaría en modo Navigation.
- **Meta description "…monthly income, outcome, net profit and profit margin for 2024"** → Incorrecta: repetía el "2024" del bug A6 (los datos son de los 12 meses anteriores) y llamaba mensuales a los KPI, que son totales. Detectado por la revisión independiente y corregido.

### Revisión independiente del diff

Un **agente nuevo, sin contexto**, revisó el diff contra las dos skills y las reglas de `.agents/rules/`, y volvió a pasar pytest. Confirmó como correcto:
- los 31 parámetros reescritos (en 7 endpoints) conservan tipo, valor por defecto y restricciones;
- las fechas de `/comparison` siguen siendo obligatorias, y no queda ningún `Query(` antiguo ni `...`;
- `from __future__ import annotations` es compatible con `Annotated`;
- se cumplen BE-01 (`response_model` en todos) y BE-02;
- no se ha desplazado ninguna referencia de línea;
- la combinación `robots.txt` con `Allow: /` + `noindex` es correcta;
- `skills-lock.json` es coherente.

| # | Hallazgo | Comprobación | Gravedad | Decisión |
|---|---|---|---|---|
| R1 | La meta description dice "2024" y llama mensuales a los KPI | ✅ A6 y `kpi-row.tsx` | Debe corregirse | Texto nuevo, aprobado por el usuario |
| R2 | El ejemplo de BE-01 sigue con `Query(default=...)` | ✅ | Debe corregirse | Ejemplo con `Annotated` y "Evita" ampliado |
| R3 | El 100 de Lighthouse puede malinterpretarse con `noindex` | ✅ | Documentar | Anotado: modo Snapshot, `is-crawlable` fallaría a propósito |
| R4 | `robots.txt` no cubre el backend en `:8000` ni lleva `Sitemap:` | ✅ | Detalle | Anotado, fuera de alcance |
| R5 | El plan no recoge `robots.txt` | ✅ | Detalle | Añadido al plan |
| R6/R7 | Falta la documentación de la fase y el memory-bank | ✅ | Paso pendiente | `progress.md`, `verification.md`, `current-state.md` y `architecture.md` actualizados |

## Skills · Fase 5: Skill interna `pre-merge-qa`

**Fecha:** 2026-11-17. Plan: [`plans/phase-5-internal-skill.md`](plans/phase-5-internal-skill.md). El detalle está en [`memory-bank/progress.md`](memory-bank/progress.md) (Fase 5).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `npx skills find` (`pre-merge`, `api contract`, `shadcn`) | Nada específico de este repo; solo `shadcn` (oficial) cubre en parte la UI |
| Cada comando de la skill, ejecutado antes de guardarla | ✅ Todos funcionan |
| `fingerprint.py` en 4 casos | ✅ Sin cambios: iguales · campo nuevo: cambian `openapi` y `contract` · llamada extra a `random`: solo `mock` · `HEAD` frente a `main`: iguales |
| Prueba 1 con un agente nuevo | 0 comandos fallidos · 3 ❌ reales en la rama · 13 problemas de la skill |
| Prueba 2 con otro agente nuevo | 0 comandos fallidos · 1 ❌ real en la rama · 10 problemas de la skill |

### Correcciones (afirmación incorrecta → corrección)

**Antes de la primera prueba:**
- **"Sin `-T`, `exec` falla si no hay terminal"** → Probado: en esta versión de Docker funciona igual. Se quitó la afirmación.
- **`grep -vE "==\|^#\|^$"` dentro de la tabla** → Al copiarlo tal cual, buscaba un `|` literal. Cambiado por `grep -v -e "==" -e "^#" -e "^$"`.

**Tras la prueba 1:**

| # | Problema | Corrección |
|---|---|---|
| M1 | Solo había ✅, ❌ o N/A | Nuevo estado ⚠️ (justificado o aceptado por el usuario), que no bloquea |
| M2 | No decía qué hacer con ❌ en commits ya subidos | No reescribir: dar las dos opciones al usuario |
| M3 | BE-02, BE-03 y BE-05 sin comando ("a ojo") | `fingerprint.py`, con 3 huellas |
| M4 | Los tests sin comando | `grep -cE` de aserciones quitadas, que debe dar 0 |
| M5 | UR-03 a nivel de rama, pero la regla exige "en el mismo commit" | Comprobación commit a commit con `git log --name-only` |
| M6 | El comando de cuerpos no decía de qué commit era cada línea | Imprime el hash |
| M7 | GD-02 confundía el README de una skill de terceros | Solo los README de la raíz |
| M8 | `index.html` y `public/` no tenían fila | Fila con FE-07 |
| M9 | "Sin cambiar ningún archivo" era imposible (`dist/`, cachés) | "Ningún archivo versionado" |
| M10 | Aviso de Starlette atribuido a E2 | "Conocido (ver TE-01)" |

Al probar los comandos de M1-M10 aparecieron dos fallos más: el de la longitud del asunto dependía de la longitud del hash (ahora usa un tabulador) y el de los encabezados de GD-02 contaba las líneas vacías (ahora `grep -oE "^#+"`).

**Tras la prueba 2:**

| # | Problema | Corrección |
|---|---|---|
| N1 | **La huella "de HEAD" leía el archivo en disco** | `git show HEAD:backend/app/routes.py` |
| N2 | UR-03 no comprobaba `last_verified` ni aclaraba si un resultado de Lighthouse cuenta | Comando para `last_verified` y aclaración (cuenta para `current-state.md`) |
| N3 | `git log --stat` daba más de 100 líneas por las skills de terceros | Excluye `.agents/skills` (59 líneas) |
| N4 | El comando de cuerpos podía confundir una línea con un hash y no mostraba la línea | Marcador `--- %h`; imprime hash, longitud e inicio de la línea |
| N5 | El paso 1 sin criterio, y N/A o ✅ sin definir | Paso 1: ✅, o ⚠️ con cambios sin commitear. N/A puede llevar evidencia |
| N6 | ¿Pueden ir `memory-bank/`, `plans/` y `verification.md` en un `feat`/`fix`? | Sí, lo pide UR-03 |

**No cambiado:** la carpeta `.skills/`, que es la que pide el enunciado (los enlaces funcionan desde ahí), y la revisión de FE-01 a FE-10, que es de criterio y remite al "Cómo comprobarlo" de cada regla.

### Hallazgos reales en la rama, aceptados como excepción por el usuario

| Regla | Commit | Problema |
|---|---|---|
| GD-01 | `35a50a5` | Asunto de 84 caracteres (máximo 72) |
| GD-01 | `4cd1088`, `35a50a5`, `8adab72`, `662e7f3` | Cuerpo en una sola línea de 239-308 caracteres |
| GD-01 | `8adab72`, `662e7f3` | La skill se instaló dentro de su `feat`/`refactor`, no en un `chore` aparte |
| UR-03 | `8adab72` | El resultado de Lighthouse SEO se anotó en `current-state.md` en el commit siguiente |

Ya estaban subidos, así que no se reescribe la historia. Los commits de esta fase en adelante cumplen GD-01 (cuerpo a 72) y UR-03.

## Skills · Fase 6: Memory bank al día

**Fecha:** 2026-11-17. Plan: [`plans/phase-6-memory-bank.md`](plans/phase-6-memory-bank.md).

### Comprobaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| `tech-stack.md` frente a `pip freeze` y `npm ls` | ✅ Python 3.13.18, Node 24.22.3, npm 11.19.1, 31 paquetes fijados y todas las versiones de las tablas |
| Datos y API | ✅ 360 movimientos (2025-11-01 a 2026-10-28) y 9 endpoints con 200 |
| Referencias de línea de `current-state.md`, `architecture.md` y `product-overview.md` | ✅ Las 8 apuntan a lo que dicen |
| QA final con la skill interna [`pre-merge-qa`](.skills/pre-merge-qa/SKILL.md), por un agente nuevo | ✅ **Lista para PR (0 ❌)** en 30 checks. Los ⚠️ son el *error boundary* como clase, las excepciones aceptadas en la Fase 5 y el trabajo de esta fase sin commitear |

### Auditoría independiente del memory bank

Un **agente nuevo, sin contexto**, contrastó cada afirmación del memory bank con el repo, los contenedores, los informes de Lighthouse y `git show --stat` de cada commit citado. No encontró funcionalidades descritas que no existan. Confirmó los 17 hashes del historial, las versiones, los Lighthouse (Accessibility 100 → 100 con 20 → 23 auditorías; SEO 60 → 100), los tamaños del build y las anclas del resumen de `progress.md`.

| # | Afirmación incorrecta | Corrección |
|---|---|---|
| 1 | `progress.md`, Fase 4: "31 parámetros con `Query(default=...)`" | 29 con `Query(default=...)` y 2 con `Query(...)` (31 en total) |
| 2 | `progress.md`, resumen: `8adab72` como commit del lock | El lock de `seo` y `fastapi` entró en `662e7f3` |
| 3 | `progress.md`, Fase 4: "pendiente V4 de la Fase 3" | V4 no existe en la documentación: "pendiente de la Fase 3, ver «No aplicado»" |
| 4 | `current-state.md`: "Qué funciona (comprobado el 2026-11-13)" | 2026-11-17 |
| 5 | `architecture.md` y `progress.md`: `Annotated[T, Query(...)] = valor` | `Query(...)` es la forma con Ellipsis que se quitó: `Annotated[T, Query()] = valor`, y las fechas obligatorias sin valor |
| 6 | `progress.md`, Fase 1: referencias de línea de `App.tsx` y `kpi-card.tsx` desfasadas | Eran correctas en `8022d3e`, el punto de partida: se indica así |
| 7 | `product-overview.md`: la cabecera dice "Financial Overview · Executive metrics dashboard" | Es título y subtítulo por separado; unidos son el `<title>` |

**No cambiado (decisión del usuario):** `tech-stack.md` no menciona las skills (`.agents/skills/`, `skills-lock.json`, `.skills/`). No es falso, y están en `progress.md`.

---

# Proyecto de especificaciones (rama `feat/frontend-specs`)

## Specs · Fase 1: Explorar la API

Entregable: [`frontend/specs/api-exploration.md`](frontend/specs/api-exploration.md). Plan: [`frontend/specs/plans/phase-1-api-exploration.md`](frontend/specs/plans/phase-1-api-exploration.md).

### Fuentes de evidencia

- Contrato OpenAPI 3.1.0 en vivo (`http://localhost:8000/docs` y `/openapi.json`) sobre el commit `8022d3e`.
- Unas 40 peticiones `curl` a la API en marcha (casos límite de fechas, `threshold`, `limit`, `business_type` y errores 422).
- Recálculo de `baseline_average` con los datos de `/api/metrics/summary`.
- Lectura de `backend/app/routes.py` y de `frontend/src`.

### Suposiciones del brief que resultaron incorrectas (❌)

| Suposición | Evidencia | Cómo lo resuelve la spec |
|---|---|---|
| Existen `AlertsResponse` y `TopCategoriesResponse` como objetos de respuesta | `/alerts` y `/categories/top` devuelven **listas sin envolver** | Serán alias de `AlertEntry[]` y `CategoryEntry[]` |
| La media de la tabla de anomalías es la de los 3 períodos anteriores | `baseline_average` es la media de **todos** los períodos anteriores del rango (p. ej. `2026-03`: 55334.29 frente a 59977.58 con 3 períodos) | Se usa `/alerts` tal cual y se documenta el desajuste como pregunta abierta para el PM (decisión del usuario) |
| El umbral va de 0.01 a 1.0 | La API acepta cualquier valor `≥ 0`, sin máximo | El frontend aplica el rango del PM |
| `increase_ratio` es un "incremento porcentual" | Es un ratio: `1.4968` = +149,68 % | Se muestra multiplicado por 100 |
| Las categorías de cada grupo salen de `facets` | `facets` no tiene parámetros y no separa por B2B/B2C | Las categorías de cada panel salen de `/categories/top` |
| Habrá un "top 5" de ingresos | Los ingresos solo usan `sales` y `others`: como mucho 2 filas | Se muestran las filas que lleguen |
| Un input de fecha vacío equivale a "sin filtro" | `start_date=` da **422** | El parámetro vacío se omite |
| Una fecha de inicio posterior a la de fin da error | La API devuelve `[]` con 200 | El frontend lo valida antes de pedir |
| Hay un router para la "nueva página" | No hay ninguna dependencia de router | Pestañas con estado de React (decisión del usuario) |

### Revisión independiente (agente sin contexto)

Comprobó unas 62 afirmaciones correctas y encontró 9 puntos. Se verificaron uno a uno (con `curl` o leyendo el código) antes de corregirlos:

| Afirmación | Realidad | Tipo | Corrección |
|---|---|---|---|
| Comparación estricta en `routes.py:229` | Está en `routes.py:230` (la 229 calcula el ratio) | ❌ Incorrecta | Referencia corregida |
| Orden y redondeo del top en `routes.py:203` | `sorted` en `:200`, `round` en `:205` | Imprecisa | `routes.py:200-205` |
| `HTTPValidationError { detail: ... }` | `detail` no es `required` en el contrato | Imprecisa | `detail?`, con la nota de que siempre llega |
| "Solo acepta `YYYY-MM-DD`" | `2026-03-01T00:00:00` → 200; `T10:00:00` → 422 `date_from_datetime_inexact` | Imprecisa | Dos filas nuevas en la tabla de fechas |
| "Un rango de un solo mes da siempre `[]`" | Solo dentro de un mes natural. `2026-03-15` → `2026-04-15` da una alerta comparando dos medios meses | Imprecisa | Matizado, y aviso de meses parciales en F2-6 |
| (Faltaba) Parámetros desconocidos | `/api/metrics?business_type=B2B` → 200 con los 360 movimientos | Omisión | Subsección nueva |
| (Faltaba) Parámetros repetidos | Gana el último valor, sin error | Omisión | Subsección nueva |
| (Faltaba) Detalles de la media | No se evalúa si es ≤ 0 (`:228`), usa importes redondeados (`:183`) y cambia con `business_type` | Omisión | Añadidos |
| (Faltaba) `threshold=0` | Es válido en la API (`ge=0`) | Omisión | F2-4 aclara que el mínimo 0.01 es solo del frontend |

## Specs · Fase 2: Tipos TypeScript

Entregables: [`frontend/specs/api-types.ts`](frontend/specs/api-types.ts), [`frontend/specs/param-types.ts`](frontend/specs/param-types.ts) y [`frontend/specs/tsconfig.json`](frontend/specs/tsconfig.json). Plan: [`frontend/specs/plans/phase-2-typescript-types.md`](frontend/specs/plans/phase-2-typescript-types.md).

### Suposiciones que resultaron incorrectas (❌)

| Suposición | Evidencia | Corrección |
|---|---|---|
| "`npx tsc --noEmit` en `frontend/` comprueba los tipos" | `--listFilesOnly` devuelve **0 archivos**: el `tsconfig.json` raíz tiene `"files": []` y solo delega con `-b`; además, `tsconfig.app.json` solo incluye `src` y no tiene `strict` | `frontend/specs/tsconfig.json` propio, con `strict: true`. Se comprobó que detecta un `any` implícito (TS7006) y un tipo incorrecto (TS2322) en un archivo de prueba, que después se borró |
| "`tsc` también detecta el uso de `object`" | `object` es un tipo válido para el compilador | Comprobación aparte, buscando en el texto: 0 apariciones de `any`/`object` como tipo |
| `TopCategoriesParams` solo necesita tipo de operación, `limit` y fechas (enunciado) | Sin `business_type`, `/categories/top` mezcla B2B y B2C (Fase 1, F3-3) | Se añade `business_type` (decisión del usuario), explicado en su JSDoc |

### Comparación automática con `/openapi.json`

Un script usa el compilador de TypeScript para leer los tipos y los compara con el contrato en vivo: nombre, tipo, enum, si es opcional, si admite `null` y que tenga JSDoc. El script no se guarda en el repositorio. Resultado: **28/28 propiedades coinciden**.

| Tipo TS | Fuente en /docs | Propiedad | Tipo en TS | En /docs | Resultado |
|---|---|---|---|---|---|
| FacetsResponse | MetricsFacets | operation_types | income\|outcome[] | income\|outcome[] | ✅ |
| FacetsResponse | MetricsFacets | business_types | B2B\|B2C[] | B2B\|B2C[] | ✅ |
| FacetsResponse | MetricsFacets | categories | administrative\|operational\|others\|sales\|suppliers[] | administrative\|operational\|others\|sales\|suppliers[] | ✅ |
| FacetsResponse | MetricsFacets | min_date | string | string (date) | ✅ |
| FacetsResponse | MetricsFacets | max_date | string | string (date) | ✅ |
| AlertEntry | MetricsAlert | period | string | string | ✅ |
| AlertEntry | MetricsAlert | outcome_total | number | number | ✅ |
| AlertEntry | MetricsAlert | baseline_average | number | number | ✅ |
| AlertEntry | MetricsAlert | increase_ratio | number | number | ✅ |
| CategoryEntry | TopCategoryItem | category | administrative\|operational\|others\|sales\|suppliers | administrative\|operational\|others\|sales\|suppliers | ✅ |
| CategoryEntry | TopCategoryItem | operation_type | income\|outcome | income\|outcome | ✅ |
| CategoryEntry | TopCategoryItem | total_amount | number | number | ✅ |
| AlertsResponse | /api/metrics/alerts 200 | (raíz) | `AlertEntry[]` | array of MetricsAlert | ✅ |
| TopCategoriesResponse | /api/metrics/categories/top 200 | (raíz) | `CategoryEntry[]` | array of TopCategoryItem | ✅ |
| DateRangeFilter | /api/metrics | start_date | string (opt) | string [format date, opt] | ✅ |
| DateRangeFilter | /api/metrics | end_date | string (opt) | string [format date, opt] | ✅ |
| DateRangeFilter | /api/metrics/alerts | start_date | string (opt) | string [format date, opt] | ✅ |
| DateRangeFilter | /api/metrics/alerts | end_date | string (opt) | string [format date, opt] | ✅ |
| DateRangeFilter | /api/metrics/categories/top | start_date | string (opt) | string [format date, opt] | ✅ |
| DateRangeFilter | /api/metrics/categories/top | end_date | string (opt) | string [format date, opt] | ✅ |
| AlertsParams | /api/metrics/alerts | threshold | number | number [min 0, default 0.3, opt] | ✅ |
| AlertsParams | /api/metrics/alerts | start_date (de DateRangeFilter) | string (opt) | string [format date, opt] | ✅ |
| AlertsParams | /api/metrics/alerts | end_date (de DateRangeFilter) | string (opt) | string [format date, opt] | ✅ |
| TopCategoriesParams | /api/metrics/categories/top | operation_type | income\|outcome | income\|outcome [opt] | ✅ |
| TopCategoriesParams | /api/metrics/categories/top | limit | number | number [min 1, max 20, default 5, integer, opt] | ✅ |
| TopCategoriesParams | /api/metrics/categories/top | business_type | B2B\|B2C | B2B\|B2C [opt] | ✅ |
| TopCategoriesParams | /api/metrics/categories/top | start_date (de DateRangeFilter) | string (opt) | string [format date, opt] | ✅ |
| TopCategoriesParams | /api/metrics/categories/top | end_date (de DateRangeFilter) | string (opt) | string [format date, opt] | ✅ |

`opt` = opcional. En los parámetros, `/docs` los declara todos opcionales. Los tipos hacen obligatorios `threshold`, `operation_type`, `limit` y `business_type` porque el frontend siempre los envía (si se omitiera `operation_type`, la API devolvería gastos).

Otras comprobaciones:
- `docker compose exec -T -w /app/specs frontend npx tsc --noEmit` → exit 0. Revisa `api-types.ts`, `param-types.ts` y el `src/lib/financial-types.ts` importado.
- `npm run lint` → exit 0. ESLint revisa también `specs/` (configuración `**/*.{ts,tsx}`, confirmado con `--debug`).

### Revisión independiente (agente sin contexto)

No encontró errores en los nombres ni en los tipos, y confirmó unas 32 afirmaciones de los JSDoc. Encontró 11 imprecisiones, que se verificaron con `curl` o leyendo el código antes de corregirlas:

| Afirmación en el JSDoc | Realidad | Tipo | Corrección |
|---|---|---|---|
| `limit`: "los no enteros dan 422" | `5.5` → 422, pero `5.0` → 200 | Imprecisa | Matizado |
| Fechas: un formato distinto de `YYYY-MM-DD` da 422 | También se aceptan `2026-03-01T00:00:00` y un timestamp Unix (200) | Imprecisa | "Envía solo `YYYY-MM-DD`; no confíes en la API para validar" |
| `increase_ratio` siempre `> threshold` | Se compara **antes** de redondear (`routes.py:230`) y se redondea después (`:236`): el valor devuelto puede ser igual al umbral | Imprecisa | Explicado, y "muéstralo, no lo recalcules" |
| `outcome_total` siempre `>= 0` | Solo hay alerta si el gasto supera la media, que es `> 0` (`routes.py:228-230`) | Imprecisa (correcta pero débil) | "Siempre `> baseline_average`" |
| `baseline_average`: media de todos los períodos anteriores | Los períodos sin movimientos no generan fila en el resumen (`routes.py:165-187`) | Incompleta | Añadido |
| "Las fechas fuera del dataset devuelven vacío" | Un rango que se solapa en parte devuelve la parte común (`2026-10-01` → `2027-01-31`: 30 movimientos) | Imprecisa | "Un rango que no se solapa…" |
| `threshold` "en pasos de 0.01" | El PM no lo dice | Sin evidencia | Eliminado |
| % sobre el total del grupo = suma del panel | Solo es el total real porque `limit` (5) ≥ 2 categorías de ingreso | Ambigua | Explicado. También que la gráfica usa esa suma y que un rango corto puede dar 1 fila o ninguna (un día sin ingresos B2B → `[]`) |
| (Faltaba) Tipo de la respuesta de `/api/metrics` | Ya existe `FinancialMovement[]` en `src/lib/financial-types.ts` | Ambigüedad | Nota en la cabecera de `api-types.ts` |
| `tsconfig.json`: `cd frontend/specs && npx tsc --noEmit` | En el host, `node_modules` está vacío y el comando falla | Imprecisa | Comando de Docker |
| Orden del top: de mayor a menor | Confirmado. Con empate se mantiene el orden de inserción | Sin impacto | Sin cambios (solo hay 2 categorías) |

Después de corregir: `tsc` exit 0, `lint` exit 0 y comparación con OpenAPI 28/28.

## Specs · Fase 3: Especificación de componentes

Entregable: [`frontend/specs/components.md`](frontend/specs/components.md). Plan: [`frontend/specs/plans/phase-3-component-specs.md`](frontend/specs/plans/phase-3-component-specs.md).

### Decisiones del usuario

- **Un único filtro de fechas compartido** por las dos pestañas (el brief no aclaraba si la funcionalidad 3 tenía su propio rango).
- Se aplican las de la Fase 1: pestañas sin router (F3-1), cabecera con el rango aplicado (F1-9) y `/alerts` tal cual, con el desajuste de la media documentado (F2-1).

### Suposiciones que resultaron incorrectas (❌)

| Suposición | Evidencia | Corrección |
|---|---|---|
| Con el dataset actual, un umbral alto deja vacía la tabla de anomalías | El máximo del input es `1` (100 %) y `2025-12` sube un +149.7 %: **sin filtro, ningún umbral válido da `[]`** | Ejemplos de estado vacío con rangos reales comprobados con `curl` (`2026-03-01`→`2026-03-31`; `2026-07-01`→`2026-10-28` con `0.4`) |
| Ejemplo de importe `$88,086` para `2026-03` | La API devuelve `outcome_total` 88076.9 → `$88,077` | Corregido |
| Todos los desajustes de la Fase 1 estaban resueltos | **F2-8** (comparación estricta `>`) no aparecía en la spec | Nota añadida en §2.3 y tabla de trazabilidad completa (§5, 31 desajustes) |

### Comprobaciones

- Los 9 bloques TypeScript de `components.md` se extraen y se compilan en modo estricto junto a `api-types.ts` y `param-types.ts` (en una carpeta temporal del contenedor, sin guardarlos en el repo): exit 0. Un error introducido a propósito sí se detecta (exit 2).
- Los números de los ejemplos (alertas, paneles B2B/B2C y sus porcentajes, rangos vacíos) se comprobaron con la API en marcha el 2026-11-14.
- Rúbrica: 7 componentes con nombre, props y tipos; tablas de estados en cada uno; estado vacío explícito de la tabla de anomalías; comportamiento con un solo input de fecha; estado vacío de cada panel B2B/B2C.

### Revisión independiente (agente en el papel de implementador)

Un agente sin contexto leyó solo la spec y los tipos como si tuviera que programarlos. Su veredicto inicial: **no podía construirlo sin preguntar**. Se verificaron sus puntos contra las reglas de `.agents/rules/` y el código antes de corregirlos. Uno resultó falso (`index.css:25-32` era correcto).

| Problema | Tipo | Corrección |
|---|---|---|
| No estaba claro qué peticiones se lanzan en cada pestaña, si hay caché ni qué pasa con una petición cancelada al cambiar de pestaña | Bloqueante | Tabla de efectos en §1.3: dependencias, pestaña, `AbortController` en el *cleanup* y sin caché |
| Qué reciben `KPIRow` y las gráficas si `/api/metrics` falla, y dónde va la caja de error | Bloqueante | Tabla de estado → props en §1.4 |
| Los tipos de `specs/` están fuera de `include: ["src"]`; los imports relativos incumplen FE-03 | Bloqueante | §0.3: los tipos se copian a `src/lib/` y se importan con `@/lib/...` |
| Validaciones, formatos y totales sin función ni test (regla FE-08) | Bloqueante | §0.5: 9 funciones puras con sus casos de test; los componentes solo reciben datos calculados |
| "`<input type="date">` solo emite fechas completas" | ❌ Incorrecta | Algunos navegadores emiten `''` mientras se edita: se distingue con `validity.badInput` para no pedir el dataset completo a mitad de escribir |
| Disposición de la barra de fechas sin definir | Bloqueante | §1.5, disposición con `flex-wrap` |
| "No hace falta borrar" el valor por defecto de la cabecera | ❌ Contradice FE-10 | Se cambian los dos sitios de la etiqueta |
| `{appliedThreshold × 100}` en los textos | ❌ Error de coma flotante (`0.07*100` = `7.000000000000001`) | `formatThreshold` (`formatPercent(t * 100)`) |
| `loading: boolean` obligatorio | ❌ Contradice FE-05 | `loading?: boolean` en todas las props |
| Tabla de estados ("sin `min`/`max`") frente a tabla de elementos | Contradicción | Tabla única: límites cruzados siempre, los del dataset solo si `facets` cargó |
| Mensaje de error de la gráfica incorrecto si fallan los dos paneles; precedencia de estados sin definir | Contradicción | Texto nuevo y estados evaluados en orden |
| `businessTypes` y `Record<BusinessType, …>` podían no coincidir | Contradicción | Una sola lista `businessTypes` de la que salen paneles y barras |
| `income-outcome-chart.tsx:78-110` | ❌ Incorrecta | `:78-119` |
| `DashboardTab` compartido frente a "Props no exportadas" | Contradicción | Los tipos compartidos van a `src/lib/dashboard-types.ts` |
| Props del filtro que permitían combinaciones imposibles | Contradicción | `facets: RequestState<FacetsResponse>` |
| Menores: cabecera con rango al revés, `aria-invalid` en las fechas, `tabpanel`/`aria-controls`, `Cell`/leyenda/tooltip de la gráfica, mapa de categorías, estilo FE-04 de los ejemplos, dos cajas de error a la vez | Ambigüedades | Todas resueltas en la spec |

Después de corregir: los 9 bloques compilan en modo estricto y los 31 desajustes de la Fase 1 siguen trazados.

## Specs · Fase 4: Contrato de datos

Entregable: [`frontend/specs/README.md`](frontend/specs/README.md). Plan: [`frontend/specs/plans/phase-4-data-contract.md`](frontend/specs/plans/phase-4-data-contract.md).

### Decisión del usuario

- Actualizar en este mismo commit el `memory-bank` (regla UR-03) y la tabla de entregables de `README.md` y `README.es.md` (regla GD-02). En el `memory-bank` solo se registra lo que existe: las specs como archivos y que las funcionalidades **no** están implementadas (UR-03 prohíbe describir como existente lo que no está en el código).

### Comprobaciones

| Comprobación | Resultado |
|---|---|
| `docker compose exec -T -w /app/specs frontend npx tsc --noEmit` (el `npx tsc --noEmit` del ejercicio, dentro del contenedor) | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| Los 3 bloques TypeScript del README, compilados en modo estricto contra los tipos | ✅ exit 0; un `AlertsRequest` sin `threshold` añadido a propósito sí falla |
| Tipos contra el OpenAPI en vivo (script de la Fase 2) | ✅ 28/28 |
| Rutas, parámetros y valores de ejemplo del README, con `curl` | ✅ Unas 35 peticiones al redactar y unos 65 valores en la revisión independiente: todos coinciden |
| Enlaces relativos y anclas de `README.md` y `components.md` | ✅ 26 enlaces, 0 rotos |
| Archivos cambiados en la rama respecto a `main` | ✅ Solo `frontend/specs/`, `verification.md`, `memory-bank/` y los dos README: ni componentes, ni `fetch`, ni backend |
| Rúbrica | ✅ Las tres funcionalidades con endpoints, tipos de petición y respuesta, valores válidos y restricciones, y 11, 11 y 13 casos límite con lo que muestra la interfaz |

### Revisión con una sesión nueva

Un agente sin contexto partió **solo** del README, siguiendo únicamente los enlaces que el README le indicaba. Verificó unos 65 valores con `curl`, todos correctos. Su veredicto: una sesión nueva aún tendría que hacer 2 o 3 preguntas. Se verificaron sus puntos antes de corregirlos:

| Afirmación | Realidad | Tipo | Corrección |
|---|---|---|---|
| "No escribas fechas fijas (reglas FE-10 y TE-02)" | TE-02 es el estilo de los tests del backend; la regla de las fechas fijas es **TE-03**. FE-10 trata de la etiqueta "2024" | ❌ Incorrecta | TE-03 en el README y en `components.md`; FE-10 solo para la etiqueta |
| README: "El input del umbral es texto" | `components.md` lo define como `<input type="number">` | ❌ Contradicción | Los dos dicen `type="number"`, cuyo valor llega como texto (`''` si no es numérico) |
| (Pregunta) ¿Se envía una fecha escrita a mano fuera de `min`/`max`? | No estaba definido; el caso 1.8 lo necesitaba | Ambigüedad | Sí se envía: solo bloquean `badInput` e inicio > fin (README y `components.md` §1.5) |
| (Pregunta) ¿Y si `facets.business_types` tiene un solo valor? | No estaba definido | Ambigüedad | Hoy no puede ocurrir; si ocurriera, un panel y una barra (caso 3.11) |
| "Inicio > fin devuelve `[]`" | Solo constaba para `/api/metrics` | Incompleta | Comprobado también en `/alerts` y `/categories/top` |
| Menores | `formatMonthYearLabel` es privada; reglas sin enlace; funciones de `lib/` sin referencia; alias de tipos que parecían importables; tests no mencionados; caso 1.3 poco claro | Claridad | Todos corregidos |

Después de corregir: `tsc` exit 0 y 26 enlaces sin romper.
