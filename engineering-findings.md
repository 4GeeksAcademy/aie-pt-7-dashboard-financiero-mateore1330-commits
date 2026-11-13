# Hallazgos de ingeniería y reglas propuestas

Fase 2 del proyecto. Este documento recoge las convenciones que ya sigue el código y los patrones arriesgados que afectarían a futuros contribuidores o coding agents. A partir de ellos se proponen las reglas que se implementarán en `.agents/rules/` en la Fase 3.

**Fecha del análisis:** 2026-11-13

## Método

1. **Inventario:** el agente revisó todos los archivos de código, configuración, tests e historial de git, y ejecutó comprobaciones donde hacía falta (tests, lint, simulación de zonas horarias).
2. **Filtrado:** un hallazgo solo se queda si cumple dos criterios:
   - Tiene **evidencia concreta**: un archivo, una línea o un comportamiento ejecutado.
   - **Cambia cómo debería actuar un agente** al editar el repositorio.
3. **Agrupación** por categoría.
4. **Reglas propuestas:** cada regla cita al menos un hallazgo. La [tabla de trazabilidad](#trazabilidad-hallazgo--regla) comprueba que la relación se cumple en los dos sentidos.

Leyenda: 🟢 convención (hay que respetarla) · 🔴 riesgo (hay que evitarlo o tenerlo en cuenta)

---

## Hallazgos

### 1. Arquitectura

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| A1 | `components/ui/` contiene las primitivas de shadcn/ui y `components/dashboard/` los componentes de negocio | 🟢 | [`components.json`](frontend/components.json) (alias `ui`), [`components/ui/`](frontend/src/components/ui/) | Podría meter lógica de negocio en `ui/` o modificar primitivas que se regeneran con shadcn |
| A2 | La lógica de cálculo está en funciones puras de `src/lib/`, con un test al lado | 🟢 | [`financial-utils.ts`](frontend/src/lib/financial-utils.ts) y [`financial-utils.test.ts`](frontend/src/lib/financial-utils.test.ts) | Podría poner cálculos dentro de los componentes, donde no se pueden testear |
| A3 | Backend: valores permitidos con `Literal`, respuestas con modelos Pydantic en `response_model`, y helpers puros separados de los endpoints | 🟢 | [`routes.py`](backend/app/routes.py): `OperationType`, `Category`, `filter_movements`, `summarize_movements`… | Un endpoint nuevo debe reutilizar los helpers y no duplicar filtros |
| A4 | `routes.py` concentra modelos, generación de datos, filtros y los 9 endpoints | 🔴 | `routes.py` (unas 390 líneas, un único `APIRouter`) | Tenderá a seguir engordándolo, o a dividirlo sin que se lo pidan |
| A5 | 7 de los 8 endpoints `/api` no los usa el frontend, pero tienen tests | 🔴 | `@router.get` en `routes.py`. El único `fetch` del frontend está en [`App.tsx:16`](frontend/src/App.tsx#L16). Tests en [`test_routes.py`](backend/tests/test_routes.py) | Podría borrarlos por "código muerto" y romper la API y los tests |
| A6 | Restos de una versión anterior con datos de 2024: `mock-data.ts` y `hero.png` no se usan, y la etiqueta "2024" está escrita a mano en dos sitios **que no coinciden** | 🔴 | [`mock-data.ts`](frontend/src/lib/mock-data.ts) (fechas `2024-*`), [`hero.png`](frontend/src/assets/hero.png), [`App.tsx:49`](frontend/src/App.tsx#L49) `"2024 - Full Year"`, [`dashboard-header.tsx:7`](frontend/src/components/dashboard/dashboard-header.tsx#L7) `'2024 — Full Year'` | Podría tomar `mock-data.ts` como fuente de datos, o editar solo una de las dos etiquetas |

### 2. Naming, estilo e interfaz (frontend)

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| N1 | Archivos en `kebab-case`, componentes `PascalCase` con `export function` nombrado, y props tipadas como `interface <Componente>Props`. Solo `App` usa `export default` | 🟢 | Los 5 archivos de [`components/dashboard/`](frontend/src/components/dashboard/), por ejemplo `kpi-card.tsx` → `KPICard` y `KPICardProps` | Los componentes nuevos deben seguir el mismo patrón |
| N2 | Imports entre carpetas con el alias `@/`. Imports relativos solo dentro de la misma carpeta | 🟢 | [`tsconfig.app.json:12-14`](frontend/tsconfig.app.json#L12-L14), [`vite.config.ts`](frontend/vite.config.ts), [`kpi-row.tsx:1`](frontend/src/components/dashboard/kpi-row.tsx#L1) | Evita mezclar imports relativos largos |
| N3 | Estilo mezclado y sin formateador: comillas dobles con `;` en `App.tsx` y `lib/financial-utils*.ts`, y comillas simples sin `;` en `components/`, `main.tsx` y `mock-data.ts` | 🔴 | Recuento de imports por archivo. No existe Prettier, `.editorconfig` ni configuración equivalente | Podría reformatear archivos enteros y generar diffs enormes y difíciles de revisar |
| N4 | Los componentes que muestran datos reciben `loading?` y muestran un `Skeleton` | 🟢 | [`kpi-card.tsx`](frontend/src/components/dashboard/kpi-card.tsx), [`income-outcome-chart.tsx`](frontend/src/components/dashboard/income-outcome-chart.tsx), [`profit-percent-chart.tsx`](frontend/src/components/dashboard/profit-percent-chart.tsx) | Un componente nuevo sin estado de carga rompe la coherencia visual |
| N5 | Los colores salen de variables CSS del tema, definidas para el modo claro y el oscuro | 🟢 | [`index.css:25-39`](frontend/src/index.css#L25-L39) (`:root`) y `.dark`. `variantStyles` en `kpi-card.tsx` | Tenderá a escribir colores fijos (`text-green-500`, hex) |
| N6 | La interfaz está en inglés, salvo un mensaje de error en español | 🔴 | [`index.html:2`](frontend/index.html#L2) `lang="en"`, y todos los textos de los componentes. La excepción está en [`App.tsx:37`](frontend/src/App.tsx#L37) | Sin regla, cada cambio podría usar un idioma distinto |

### 3. Contratos y datos

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| D1 | El contrato `FinancialMovement` y sus tipos están duplicados a mano en Pydantic y en TypeScript | 🔴 | `FinancialMovement`, `OperationType`, `Category` y `BusinessType` en `routes.py` y en [`financial-types.ts`](frontend/src/lib/financial-types.ts) | Si cambia un lado y no el otro, el fallo aparece en ejecución, no al compilar |
| D2 | 🐞 **Bug de zona horaria:** `new Date("YYYY-MM-DD")` se interpreta como UTC, pero `getMonth()` y `getFullYear()` usan la hora local | 🔴 | [`financial-utils.ts:8`](frontend/src/lib/financial-utils.ts#L8) y [`:42`](frontend/src/lib/financial-utils.ts#L42). Con los datos reales de la API: en `Europe/Madrid` salen 12 meses (desde 2025-11) y en `America/New_York` salen **13** (desde **2025-10**). Los 16 movimientos fechados en día 1 caen en el mes anterior | Al manejar fechas, repetirá el mismo patrón incorrecto |
| D3 | Los datos mock dependen de `date.today()`, y `random.seed()` modifica el estado global del módulo `random` | 🔴 | `_year_for_month` y `generate_mock_movements` en `routes.py` (ver Fase 1, corrección #6 en [`verification.md`](verification.md)) | Escribirá tests o asunciones con fechas fijas que fallarán con el paso del tiempo |

### 4. Testing y calidad

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| T1 | Tests del backend con `TestClient`, nombres `test_<qué>_<resultado>` y la estructura preparar / ejecutar / comprobar | 🟢 | [`test_routes.py`](backend/tests/test_routes.py), [`conftest.py`](backend/tests/conftest.py) | Los tests nuevos deben ser coherentes con los existentes |
| T2 | Un test usa fechas fijas que ya quedan fuera del rango de datos y solo comprueba las claves de la respuesta | 🔴 | [`test_routes.py:160`](backend/tests/test_routes.py#L160) (`2025-03-01` a `2025-03-31`, cuando los datos actuales empiezan en 2025-11) | Es un ejemplo de test que "pasa" sin comprobar nada útil, y no conviene copiarlo |
| T3 | Los tests del frontend no cubren fechas en día 1 ni otras zonas horarias, y el contenedor siempre funciona en UTC | 🔴 | [`financial-utils.test.ts:63-104`](frontend/src/lib/financial-utils.test.ts#L63-L104) (fechas en días 3, 5 y 8). En `node:24-alpine`, `TZ=America/New_York` no tiene efecto (`getTimezoneOffset()` sigue siendo 0), así que `npm test` pasa aunque exista D2 | Puede dar por bueno un cambio en fechas porque el test pasa en Docker |
| T4 | No hay CI, ni linter o formateador de Python. Nada obliga a pasar tests ni lint | 🔴 | No existe `.github/`, `pyproject.toml`, `ruff` ni `pre-commit` | El agente debe verificar a mano antes de dar algo por terminado |
| T5 | TypeScript estricto en lo que no se usa: `npm run build` falla con variables o parámetros sin usar, y `npm run lint` no lo detecta | 🟢 | [`tsconfig.app.json:22-23`](frontend/tsconfig.app.json#L22-L23), `"build": "tsc -b && vite build"` en [`package.json`](frontend/package.json) | Hay que ejecutar el build, no solo el lint |

### 5. Entorno, dependencias y seguridad

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| E1 | El proxy de Vite apunta a `backend:8000`, un nombre que solo existe en la red de Docker. `/health` no pasa por el proxy | 🔴 | [`vite.config.ts`](frontend/vite.config.ts). El Mac no resuelve el nombre `backend`. `localhost:5173/health` devuelve HTML y `localhost:8000/health` devuelve el JSON | Puede probar en el sitio equivocado y sacar conclusiones falsas |
| E2 | Las dependencias del backend no tienen versión fija, y el frontend instala con `npm install` en lugar de `npm ci` | 🔴 | [`requirements.txt`](backend/requirements.txt), [`frontend/Dockerfile:6`](frontend/Dockerfile#L6). `pytest` ya muestra `StarletteDeprecationWarning` por httpx (Starlette 1.10.0 instalado) | Cada build puede instalar versiones distintas, y añadir dependencias sin fijar agrava el problema |
| E3 | debugpy está siempre activo y expuesto en el puerto 5678, y CORS usa `allow_origins=["*"]` junto con `allow_credentials=True` | 🔴 | [`backend/Dockerfile`](backend/Dockerfile) (`CMD`), [`docker-compose.yml`](docker-compose.yml), [`main.py`](backend/app/main.py) | Es configuración solo apta para desarrollo, que no se debe ampliar ni copiar a otros entornos |

### 6. Documentación y Git

| ID | Hallazgo | Tipo | Evidencia | Por qué afecta a un agente |
|---|---|---|---|---|
| G1 | Los commits recientes siguen Conventional Commits en inglés (los más antiguos no) | 🟢 | `git log`: `eeece05 feat: …`, `fb7dd96 docs: …`, `9c3e480 chore: …`, `cb29403 docs: …` | Debe proponer mensajes con el mismo formato |
| G2 | README duplicado en inglés y en español | 🔴 | [`README.md`](README.md), [`README.es.md`](README.es.md) | Editará uno solo y el otro quedará desactualizado |

**Total: 22 hallazgos** (9 convenciones y 13 riesgos).

### Descartados

| Candidato | Motivo |
|---|---|
| Interfaces `TooltipPayload` / `CustomTooltipProps` y skeleton de carga duplicados en las dos gráficas | La duplicación es real pero pequeña. El proyecto no requiere refactors y no cambia cómo debe trabajar un agente |
| La fuente `Inter` se declara en [`index.css:79`](frontend/src/index.css#L79) pero nunca se carga | Es cosmético: el navegador usa la fuente de respaldo y no se rompe nada |
| ESLint usa `ecmaVersion: 2020` mientras TypeScript compila a `es2023` | Sin impacto práctico: `npm run lint` pasa sin errores con la sintaxis actual |

---

## Reglas propuestas

Cada regla indica el archivo de `.agents/rules/` donde se implementará en la Fase 3.

### `frontend.md`

| ID | Regla | Hallazgos |
|---|---|---|
| FE-01 | Los componentes de negocio nuevos van en `components/dashboard/`. No añadas lógica de negocio a `components/ui/`, que es solo para primitivas de shadcn/ui. | A1 |
| FE-02 | Nombra los archivos en `kebab-case`. Exporta componentes `PascalCase` con `export function` nombrado (sin `export default`, salvo `App`) y tipa sus props con `interface <Componente>Props`. | N1 |
| FE-03 | Usa el alias `@/` para importar entre carpetas. Usa rutas relativas solo dentro de la misma carpeta. | N2 |
| FE-04 | Respeta el estilo del archivo que editas y no reformatees líneas que no cambias. En archivos nuevos, sigue el de su carpeta: comillas simples sin `;` en `components/`, y comillas dobles con `;` en `lib/`. | N3 |
| FE-05 | Todo componente que muestre datos de la API debe aceptar `loading?: boolean` y mostrar un `Skeleton` mientras carga. | N4 |
| FE-06 | Usa las variables de color del tema (`var(--chart-income)`, `var(--income-badge)`…) en lugar de colores fijos. Si necesitas uno nuevo, defínelo en `index.css` en `:root` y en `.dark`. | N5 |
| FE-07 | Escribe en inglés todos los textos visibles de la interfaz. | N6 |
| FE-08 | Haz los cálculos con funciones puras en `src/lib/`, con su test en `*.test.ts`. Los componentes solo reciben datos ya calculados y los muestran. | A2 |
| FE-09 | No agrupes ni compares fechas `YYYY-MM-DD` con `new Date(str)` y métodos locales (`getMonth`, `getFullYear`). Usa la parte de texto de la fecha (por ejemplo `create_date.slice(0, 7)`) o los métodos UTC. | D2 |
| FE-10 | No uses `src/lib/mock-data.ts` como fuente de datos: los datos vienen de `/api/metrics`. Si cambias la etiqueta del periodo, cámbiala en `App.tsx` y en el valor por defecto de `dashboard-header.tsx`. | A6 |

### `backend.md`

| ID | Regla | Hallazgos |
|---|---|---|
| BE-01 | En un endpoint nuevo, declara los valores permitidos con `Literal`, la respuesta con un modelo Pydantic en `response_model`, y reutiliza los helpers existentes (`filter_movements`, `summarize_movements`…) en lugar de duplicar filtros. Ponlo en `routes.py` salvo que se pida dividir el archivo. | A3, A4 |
| BE-02 | No elimines ni renombres endpoints ni campos de respuesta aunque el frontend no los use: forman parte de la API y tienen tests. | A5 |
| BE-03 | Si cambias `FinancialMovement` o los tipos `OperationType`, `Category` o `BusinessType`, actualiza en el mismo cambio `frontend/src/lib/financial-types.ts` y los tests de ambos lados. | D1 |
| BE-04 | No cambies la configuración de debugpy ni de CORS salvo que se pida explícitamente, y no la copies a otro entorno: es solo para desarrollo. | E3 |

### `testing.md`

| ID | Regla | Hallazgos |
|---|---|---|
| TE-01 | Antes de dar una tarea por terminada, ejecuta dentro de Docker: `pytest` en el backend, y `npm test`, `npm run lint` y `npm run build` en el frontend. No hay CI que lo haga, y el lint no detecta los errores de TypeScript que detecta el build. | T4, T5 |
| TE-02 | Escribe los tests del backend en `backend/tests/` con `TestClient` y nómbralos `test_<qué>_<resultado_esperado>`. | T1 |
| TE-03 | No escribas fechas fijas en tests que dependan de los datos mock. Obtenlas de la respuesta de la API, como hace `test_metrics_endpoint_respects_date_filters`. Comprueba valores, no solo que existan las claves. | D3, T2 |
| TE-04 | Si cambias la lógica de fechas del frontend, añade un caso con una fecha en día 1 y ejecuta los tests con una zona horaria de UTC negativo (por ejemplo `TZ=America/New_York`). *(Propuesta original: "fuera del contenedor". En la Fase 3 se comprobó que eso no es posible y la regla final instala `tzdata` dentro del contenedor; ver `verification.md`.)* | D2, T3 |

### `environment.md`

| ID | Regla | Hallazgos |
|---|---|---|
| EN-01 | Arranca y verifica con `docker compose up --build`. Comprueba el backend en `localhost:8000/health` (no en el 5173) y la API a través del proxy en `localhost:5173/api/...`. No ejecutes `npm run dev` fuera de Docker sin definir `VITE_API_BASE_URL`. | E1 |
| EN-02 | Si añades una dependencia de backend, fíjala con `==` en `requirements.txt`. Si añades una de frontend, instálala para que se actualice `package-lock.json` e incluye el lockfile en el commit. No actualices dependencias que no tengan que ver con la tarea. | E2 |

### `git-and-docs.md`

| ID | Regla | Hallazgos |
|---|---|---|
| GD-01 | Usa Conventional Commits en inglés (`feat:`, `fix:`, `docs:`, `chore:`, `test:`), con un commit por cambio lógico. | G1 |
| GD-02 | Si cambias el README, aplica el cambio en `README.md` y en `README.es.md`. | G2 |

---

## Trazabilidad hallazgo → regla

| Hallazgo | Regla(s) |
|---|---|
| A1 | FE-01 |
| A2 | FE-08 |
| A3 | BE-01 |
| A4 | BE-01 |
| A5 | BE-02 |
| A6 | FE-10 |
| N1 | FE-02 |
| N2 | FE-03 |
| N3 | FE-04 |
| N4 | FE-05 |
| N5 | FE-06 |
| N6 | FE-07 |
| D1 | BE-03 |
| D2 | FE-09, TE-04 |
| D3 | TE-03, BE-05 |
| T1 | TE-02 |
| T2 | TE-03 |
| T3 | TE-04 |
| T4 | TE-01 |
| T5 | TE-01 |
| E1 | EN-01 |
| E2 | EN-02 |
| E3 | BE-04 |
| G1 | GD-01 |
| G2 | GD-02 |

Los 22 hallazgos tienen al menos una regla, y las 22 reglas citan al menos un hallazgo.

**Reglas añadidas en la Fase 3:** [`using-rules.md`](.agents/rules/using-rules.md) incluye UR-01 (qué archivo de reglas leer según lo que se edite) y UR-02 (toda regla debe apoyarse en evidencia). No proceden de un hallazgo de este documento, sino de [`AGENTS.md`](AGENTS.md), que obliga a revisar `./.agents/rules` pero no dice qué archivo aplica a cada tarea, y de las instrucciones del proyecto, que exigen que cada regla mapee a un hecho del repositorio. UR-01 se apoya además en D1, porque el contrato de datos obliga a leer las reglas de backend y frontend a la vez.

**Regla añadida tras la validación (Fase 3):** BE-05 (no alterar la secuencia aleatoria de los datos mock) amplía el hallazgo D3. Al planificar un campo nuevo, el agente de validación detectó que cualquier llamada extra a `random` cambia todo el conjunto de `seed=42`, y se comprobó que con una sola llamada extra solo 2 de 360 movimientos siguen iguales.

## Pendiente para fases siguientes

- **Bug D2 (zona horaria):** se documenta aquí y no se arregla en esta fase. Se propone usarlo como tarea real para validar las reglas FE-08, FE-09, TE-01 y TE-04 en la Fase 3.
- Las incoherencias A6 (etiqueta "2024") y N6 (mensaje en español) quedan documentadas. Solo se corregirán si hace falta para validar una regla.

## Estado tras la Fase 3

Las tablas de arriba reflejan el repositorio en la Fase 2. Durante la validación de reglas de la Fase 3 se corrigieron estos hallazgos:

| Hallazgo | Estado | Commit | Qué lo protege ahora |
|---|---|---|---|
| D2 (bug de zona horaria) | ✅ Corregido | `94b6fd1` | Test `"groups movements dated on the 1st into their own month"`, regla FE-09 |
| T2 (test con fechas fijas) | ✅ Corregido | `f0dfdc5` | `test_routes.py` sin fechas literales, regla TE-03 |
| T3 (sin tests de día 1 ni zonas horarias) | ✅ Corregido en parte | `94b6fd1` | Existe el caso de día 1. La imagen sigue sin `tzdata`, de ahí el método de TE-04 |
| E1 (confusión de puertos y `/health`) | ✅ Documentado | `a99e418` | README en los dos idiomas, regla EN-01 |
| E2 (dependencias sin versión fija) | ✅ Corregido en el backend | Fase 3 (T-C) | 31 paquetes fijados con `==`, regla EN-02. El aviso de Starlette sigue: fijar versiones lo congela pero no lo elimina |

Los demás hallazgos siguen vigentes.
