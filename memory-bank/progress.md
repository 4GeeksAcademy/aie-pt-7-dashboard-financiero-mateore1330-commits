---
name: progress
description: Progreso del proyecto de skills de agentes — skills aplicadas, cambios verificados, skill del ecosistema elegida y skill interna
last_verified: 2026-11-17 (sobre el commit 4cd1088 y los cambios de la Fase 3 de skills)
---

# Progreso: mejora del dashboard con skills de agentes

> Rama `feature/agent-skills`. Una sección por fase, con su plan en [`plans/`](../plans/). Las skills de la comunidad viven en [`.agents/skills/`](../.agents/skills/), y su origen y su huella están en [`skills-lock.json`](../skills-lock.json). Mantén este archivo al día cuando cambie lo que dice (regla UR-03).

## Fase 1: Descubrir y cargar las skills

**Fecha:** 2026-11-16. Plan: [`plans/phase-1-discover-skills.md`](../plans/phase-1-discover-skills.md).

### Cómo se arranca y cómo se valida (punto de partida)

Comandos sacados de [`tech-stack.md`](tech-stack.md) (sección de comandos) y de [`README.md`](../README.md). Se ejecutaron **antes de cambiar nada**, sobre `8022d3e`, con los contenedores en marcha (`docker compose up -d`). Van dentro del contenedor porque los `node_modules` del host están vacíos (volumen anónimo `/app/node_modules` de `docker-compose.yml`).

| Comprobación | Comando | Resultado de partida |
|---|---|---|
| Arranque | `docker compose up --build` (documentado). Se usó `docker compose up -d` porque las imágenes ya estaban construidas | ✅ `backend` y `frontend` en `running`; `localhost:8000/health` → `{"status":"ok"}` y `localhost:5173` → 200 |
| Build | `docker compose exec frontend npm run build` | ✅ Pasa, con **1 advertencia ya existente**: *"Some chunks are larger than 500 kB"* (JS de 584,17 kB, 175,13 kB gzip) |
| Lint | `docker compose exec frontend npm run lint` | ✅ Sin avisos |
| Tests del frontend | `docker compose exec frontend npm test` | ✅ 6 passed |
| Tests del backend | `docker compose exec backend python -m pytest -q` | ✅ 15 passed, con 1 aviso de deprecación ya existente (`httpx` en `starlette.testclient`) |

Cualquier advertencia del build distinta de la de 500 kB que aparezca en las fases siguientes es **nueva** y tiene que estar justificada.

### Búsqueda (`npx skills find`)

CLI `skills` de vercel-labs (v1.7.6, la que resuelve npx con `min-release-age=7`). Se ejecutó fuera del repo.

| Búsqueda | Elegida | Instalaciones | Motivo |
|---|---|---|---|
| `accessibility` | `addyosmani/web-quality-skills@accessibility` | 71K | Nombre exacto, web genérica y la más instalada. Alternativas descartadas: `jakubkrehel/skills@better-accessibility` (37K), `ibelick/ui-skills@fixing-accessibility` (24K), `wshobson/agents@accessibility-compliance` (15K) y las de Flutter, iOS o PixiJS, que son de otras tecnologías |
| `vercel-react-best-practices` | `vercel-labs/agent-skills@vercel-react-best-practices` | 904K | La oficial de Vercel. Las demás (de 9 a 383 instalaciones) son copias en otros repos |

### Instalación

- **Comando:** `npx skills add <repo> --skill <nombre> -a universal --copy -y`, con la telemetría desactivada (`DISABLE_TELEMETRY=1`).
- **Agente `universal`:** es el que escribe en `.agents/skills/`, la carpeta que indica [`AGENTS.md`](../AGENTS.md).
- **`--copy`:** copia los archivos en lugar de crear enlaces simbólicos.
- **Prueba previa:** se instaló primero en una carpeta temporal para ver qué archivos crea.

| Archivo creado | Contenido |
|---|---|
| `.agents/skills/accessibility/` | `SKILL.md` y `references/` (`A11Y-PATTERNS.md`, `WCAG.md`) |
| `.agents/skills/vercel-react-best-practices/` | `SKILL.md`, `AGENTS.md` (todas las reglas compiladas), `README.md`, `metadata.json` y `rules/` (70 reglas, más `_sections.md` y `_template.md`) |
| `skills-lock.json` | Origen (`source`, `skillPath`) y huella (`computedHash`) de cada skill. Se mantiene para la trazabilidad y para reinstalar con `npx skills experimental_install` |

No crea nada en `.claude/` ni de forma global.

**Comprobaciones de seguridad:**
- Los archivos instalados son idénticos (`diff -r`) a los de los repos de origen que se revisaron.
- Solo contienen `.md` y `.json`, sin ejecutables ni scripts.
- Los comandos que aparecen son documentación y ninguno se ejecuta solo:
  - **`accessibility/SKILL.md:413` y `:416`:** `npx lighthouse …` y `npm install @axe-core/cli -g`, como opciones de auditoría. Si se usan, se decide en la Fase 2.
  - **`README.md` de la skill de Vercel:** `pnpm install`, `pnpm build`, `pnpm validate`, `pnpm extract-tests` y `pnpm dev`. Sirven para compilar la skill en su propio repo.
  - **Un `npx svgo` de ejemplo:** en `rules/rendering-svg-precision.md:27` y en `AGENTS.md:2477`.

**Alcance de la lectura:**
- `accessibility`: se leyeron enteros sus 3 archivos.
- `vercel-react-best-practices`: se leyeron enteros `SKILL.md` (el índice de las 70 reglas) y 5 reglas (`bundle-dynamic-imports`, `bundle-barrel-imports`, `bundle-conditional`, `rendering-conditional-render` y `rerender-derived-state-no-effect`). El resto se revisó con `diff` y con la búsqueda de patrones de riesgo. Las reglas que se apliquen en la Fase 3 se leerán enteras antes de aplicarlas.

### Qué cubre cada skill y qué se aplica a este repo

El repo es **Vite + React 19 (SPA), sin Next.js ni SSR** (ver [`tech-stack.md`](tech-stack.md)).

#### `accessibility`

Sigue WCAG 2.2 con un método basado en pruebas:
1. Pasar una auditoría automática (Lighthouse o axe).
2. Revisar el árbol de accesibilidad y probar con el teclado.
3. Corregir el código fuente.
4. Volver a pasar la misma auditoría.

| | Instrucción de la skill | Evidencia en el repo |
|---|---|---|
| ✅ | Iconos con `aria-hidden` o nombre accesible (1.1.1) | Iconos de `lucide-react` en `kpi-card.tsx:60` y `dashboard-header.tsx:12`, todos decorativos. `lucide-react` 1.8.0 ya les pone `aria-hidden="true"` cuando no tienen hijos ni props de accesibilidad (`node_modules/lucide-react/dist/esm/Icon.js:36`). Probablemente ya se cumple, pero falta confirmarlo en el navegador |
| ✅ | Contraste AA (1.4.3, 1.4.11) | Los colores `.dark` de `index.css` son los que se ven (FE-06) |
| ✅ | Título de la página (2.4.2) | `frontend/index.html` tiene `<title>frontend</title>` |
| ✅ | Encabezados y landmarks (1.3.1) | `<main>` en `App.tsx:46`, `<header>` y `<h1>` en `dashboard-header.tsx`, y `<section aria-label>` en `App.tsx:57` y `:61` |
| ✅ | Mensajes de estado (4.1.3) | El error (`App.tsx:51-55`) y la carga (los `Skeleton` de `kpi-card.tsx:37-49`, `income-outcome-chart.tsx:50-62` y `profit-percent-chart.tsx`) no se anuncian: no hay ningún `role=` ni `aria-live` en `src/` |
| ✅ | Movimiento reducido (2.3) | Recharts anima los gráficos por defecto, `ui/skeleton.tsx:7` usa `animate-pulse` sin variante `motion-reduce` y `kpi-card.tsx:53` tiene `transition-colors` |
| ✅ | Alternativa textual de los gráficos (1.1.1, 4.1.2) | Los dos gráficos de Recharts son SVG. Recharts 3.8.1 activa `accessibilityLayer` por defecto (`recharts/es6/chart/CartesianChart.js:24`), y con eso el SVG recibe `tabIndex=0` y `role="application"` (`recharts/es6/container/RootSurface.js:44-54`). Hay que revisar qué nombre accesible tienen |
| ✅ | Teclado, foco visible, zoom al 200% y reflow (2.1, 2.4.7, 1.4.4, 1.4.10) | No hay botones ni enlaces (`grep` de `<button`, `<a ` y `onClick` en `src/` sin resultados), pero **los dos gráficos se pueden enfocar con Tab** y se recorren con las flechas por la capa de accesibilidad de Recharts. El foco visible y el orden se comprueban en ellos |
| ❌ | Formularios, errores de formulario, autenticación, vídeo, audio, modales, pestañas, arrastrar y límites de tiempo | No existen en la app actual. Las pestañas y el filtro de fechas son specs del PR #1, sin implementar |
| ❌ | Navegación y ayuda coherentes entre páginas (3.2.3, 3.2.6) | Una sola página |
| ❓ | Skip link (2.4.1) | No hay navegación repetida que saltar. Se decide en la Fase 2 |
| ❓ | Auditoría automática (Lighthouse o axe) | `npx lighthouse` descarga un paquete nuevo. Se decide en la Fase 2 (la otra opción es Lighthouse de las DevTools de Chrome) |

#### `vercel-react-best-practices`

70 reglas de **rendimiento** para React y Next.js, en 8 categorías ordenadas por impacto. Cada regla tiene su archivo con un ejemplo incorrecto y uno correcto.

**Diferencia con el enunciado del ejercicio:** el enunciado dice que la skill cubre `next/image`, `next/font`, metadatos por página y layout shift. La skill instalada **no tiene reglas sobre nada de eso**: `grep` de `next/image`, `next/font` y `generateMetadata` en sus 72 archivos de `rules/` y en `AGENTS.md` no da resultados. "metadata" solo aparece como *request metadata* en `async-cheap-condition-before-await.md`, que no habla de los metadatos de la página. "layout shift" solo aparece de pasada en `async-suspense-boundaries.md`. El título de la página se trata en la Fase 2, por la instrucción 2.4.2 de `accessibility`.

| | Categoría (n.º de reglas) | Evidencia en el repo |
|---|---|---|
| ✅ | `bundle-dynamic-imports` y `bundle-conditional` | En Vite, `next/dynamic` equivale a `React.lazy` con `import()`. Es la vía para la advertencia de 584 kB |
| ✅ | `rerender-*` (15) | `App.tsx:24-25` guarda en estado `metrics` y `monthlyData`, que se calculan dentro del `useEffect` de `App.tsx:29` (líneas 32-33) |
| ✅ | `rendering-*` de cliente: condicionales, JSX estático, precisión de los SVG y *resource hints* | Componentes de `dashboard/` y los gráficos |
| ✅ | `bundle-preload` | Si se separa Recharts en otro chunk, se puede precargar |
| ✅ | `rendering-usetransition-loading` | Hay un estado de carga (`loading` en `App.tsx:26`). Hay que valorar si encaja con una sola carga inicial |
| ✅ | `async-defer-await` y `async-cheap-condition-before-await` | Se revisan en `fetchFinancialData` (`App.tsx:16`). Probablemente no tengan efecto con un solo `await` |
| ✅ | `bundle-analyzable-paths` | Los imports son estáticos. Se confirma en la auditoría |
| ✅ | `js-*` (14) | Solo si hay un caso real en `financial-utils.ts` |
| ✅ | `advanced-*` (4) | Solo si aparece el patrón |
| ❌ | `server-*` (10), `async-api-routes`, `async-suspense-boundaries` y `rendering-hydration-*` (2) | No hay servidor de React (RSC/SSR) ni hidratación |
| ❌ | `bundle-defer-third-party`, `client-event-listeners`, `client-passive-event-listeners` y `client-localstorage-schema` | No hay analítica, ni listeners globales, ni `localStorage` |
| ❌ | `rendering-activity`, `rendering-content-visibility`, `rendering-animate-svg-wrapper` y `rendering-script-defer-async` | No hay contenido que se oculte y se muestre, ni listas largas, ni SVG animados a mano, ni `<script>` aparte del módulo de Vite en `index.html` |
| ❌ | `async-parallel` y `async-dependencies` | Solo hay una petición (`GET /api/metrics` en `App.tsx`) |
| ❓ | `client-swr-dedup` | Añadiría la dependencia SWR para una sola petición. Propuesta: no aplicarla |
| ❓ | `bundle-barrel-imports` en `lucide-react` | La solución que recomienda es de Next (`optimizePackageImports`). En Vite el build de producción ya descarta los iconos que no se usan. Se medirá en la Fase 3 antes de proponer nada |

## Fase 2: Aplicar la skill `accessibility`

**Fecha:** 2026-11-16/17. Plan: [`plans/phase-2-accessibility.md`](../plans/phase-2-accessibility.md). Skill: [`.agents/skills/accessibility/`](../.agents/skills/accessibility/).

### Método (el de la skill)

1. **Auditoría automática:** Lighthouse Accessibility desde las DevTools de Chrome, en modo **Snapshot** y Mobile.
   - El modo Navigation falló dos veces con `NO_FCP`: Chrome no pinta las pestañas que considera ocultas mientras Lighthouse las recarga. Se comprobó que la app pinta en 0,1 s con la pestaña en primer plano.
   - Los JSON se guardaron fuera del repo.
2. **Revisión manual en el navegador:**
   - árbol de accesibilidad;
   - teclado: Tab, Shift+Tab y flechas en las gráficas;
   - reflow a 320 px (iframe);
   - contraste de 16 pares de colores `.dark`, calculado en el navegador.
3. **Revisión del código** de `index.html`, `App.tsx`, `components/dashboard/*` y `components/ui/*` con la lista de la skill.
4. **Corregir, y repetir** la misma auditoría y las mismas pruebas manuales.

### Lighthouse antes y después

| | Antes | Después |
|---|---|---|
| Puntuación | 100 | 100 |
| Pasan / no aplican / manuales / fallan | 20 / 46 / 10 / 0 | 23 / 43 / 10 / 0 |

Las 3 que pasan de más son las de tablas (`td-has-header`, `td-headers-attr` y `table-fake-caption`): validan la tabla nueva. Como dice la skill, un 100 no es conformidad con WCAG. **Ninguno de los problemas corregidos lo detectaba Lighthouse.** `document-title`, por ejemplo, pasaba con el título "frontend", porque solo comprueba que exista.

### Cambios aplicados (todos aprobados por el usuario antes de aplicarse)

| # | Archivo | Problema | Instrucción de la skill | Cambio |
|---|---|---|---|---|
| A1 | `index.html` | El título de la pestaña era "frontend" | 2.4.2 Page Titled | `Financial Overview · Executive metrics dashboard` |
| A2 | `income-outcome-chart.tsx`, `profit-percent-chart.tsx` | Las gráficas eran `role="application"` sin nombre | 4.1.2 Name, Role, Value | `aria-label` y `desc` en `<LineChart>` |
| A3 | `chart-data-table.tsx` (nuevo) y las 2 gráficas | Con lector de pantalla no se llegaba a los datos | 1.1.1 alternativa textual de una imagen compleja | Tabla `sr-only` con `<caption>` y `th` de fila y de columna, envuelta en un `div.sr-only` |
| A4 | `App.tsx` | El error no se anunciaba | 4.1.3 Status messages | `role="alert"` |
| A5 / R1 | `App.tsx` | El estado de los datos no se anunciaba | 4.1.3 y patrón de *live regions* | `<p role="status" className="sr-only">`, que empieza vacío y dice "Financial data loaded." |
| A6 | `ui/skeleton.tsx` | `animate-pulse` ignoraba el movimiento reducido | 2.3 Motion (`prefers-reduced-motion`) | `motion-safe:animate-pulse` |
| A7 | `index.css` | El anillo de foco al 50 % daba 2,02:1 | 1.4.11 (el foco también necesita contraste) y 2.4.7 | `outline-ring/50` → `outline-ring` (4,6:1) |
| A8 | Las 2 gráficas | Los títulos no eran encabezados | 1.3.1 y "Missing heading structure" | `<h2>` dentro de `CardTitle`, con el mismo aspecto |
| A9 | `income-outcome-chart.tsx` | Ingresos y gastos solo se distinguían por el color (las dos líneas tienen 1,19:1 entre sí) | 1.4.1 Use of Color | Línea de gastos discontinua y leyenda `plainline` |
| R2 | Los 2 `CustomTooltip` | Al recorrer con las flechas no se anunciaba nada. El tooltip de Recharts por defecto sí lo hace (`role="status"`) | 4.1.3 | `role="status" aria-live="polite"` |
| R7 | `kpi-card.tsx` | La etiqueta y el valor de cada KPI no estaban relacionados | 1.3.1 Info and Relationships | `<dl>`, con `<dt>` (etiqueta) y `<dd>` (valor y ayuda) |

### Descartado o aceptado como está

| Punto | Motivo |
|---|---|
| Skip link (2.4.1) | No hay navegación repetida que saltar. Lighthouse marca `bypass` como "no aplica" |
| Tamaño de los objetivos, formularios, modales y pestañas | No existen en la app |
| `aria-busy` en las secciones | Se añadió y después se quitó (R3): no sale de ninguna instrucción de la skill y no aportaba nada |
| Nombre "income legend icon" de los iconos de la leyenda (R6) | Lo pone Recharts. Cambiarlo exige una leyenda hecha a mano, y los datos ya están en la tabla. Limitación menor aceptada |
| Hijos de `<>…</>` sin sangrar en las gráficas (R5) | FE-04: no reformatear líneas que no cambian |
| Etiqueta "2024 - Full Year" | No es de accesibilidad: es la regla FE-10, fuera del alcance de esta skill |

### Ya correcto antes de empezar (comprobado)

- **Contraste:** el texto, entre 5,15 y 16,98:1; las líneas de las gráficas, entre 5,12 y 6,34:1; los iconos, más de 4,5:1.
- **Iconos decorativos:** `lucide-react` ya les pone `aria-hidden`.
- **Animaciones de Recharts:** respetan el movimiento reducido (`isAnimationActive: 'auto'`).
- **Estructura:** `lang="en"`, `<main>`, `<header>` y `h1`.
- **Reflow:** sin scroll horizontal a 320 px.
- **Teclado:** sin trampa de foco.

### Verificación final

- **TE-01:**
  - pytest: 15 passed (el aviso de `httpx` ya existía);
  - vitest: 6 passed;
  - lint: limpio;
  - build: OK, sin advertencias nuevas. Sigue solo la de >500 kB, con el JS en 585,86 kB (+1,7 kB).
- **En el navegador:**
  - el árbol muestra `status "Financial data loaded."`, los `h2`, las gráficas con nombre y las 2 tablas de 12 meses;
  - el tooltip se anuncia al usar las flechas;
  - el foco se ve sólido;
  - las KPI se ven igual que antes.
- **Error:** con el backend parado se muestra `role="alert"`.
- **No comprobado:** el `motion-safe` con "Reducir movimiento" activado en el sistema no se pudo simular desde la extensión. Está comprobado en el código y en el CSS generado (`@media (prefers-reduced-motion: no-preference)`).

## Fase 3: Aplicar la skill `vercel-react-best-practices`

**Fecha:** 2026-11-17. Plan: [`plans/phase-3-vercel-react-best-practices.md`](../plans/phase-3-vercel-react-best-practices.md). Skill: [`.agents/skills/vercel-react-best-practices/`](../.agents/skills/vercel-react-best-practices/).

Antes de la auditoría se leyeron enteras las reglas candidatas que en la Fase 1 solo se habían revisado:
- `bundle-preload`, `bundle-analyzable-paths` y `async-defer-await`;
- `rendering-usetransition-loading`, `rendering-hoist-jsx`, `rendering-resource-hints` y `rendering-svg-precision`;
- el resumen de las 15 `rerender-*`, las 14 `js-*` y las 4 `advanced-*`.

El proyecto **no usa React Compiler** (`vite.config.ts` solo carga `react()` y `tailwindcss()`), así que las reglas que dicen "con React Compiler no hace falta" sí aplican.

### Auditoría (medida, no supuesta)

| Medición | Resultado |
|---|---|
| Composición del JS de 586 kB (*source maps* de un build aparte, en `/tmp` del contenedor) | Recharts y sus dependencias ≈ 58 %, react-dom ≈ 28 %, tailwind-merge ≈ 5 %, código propio ≈ 1,4 %. De `lucide-react` solo se incluyen los 5 iconos que se usan |
| Layout shift (backend en pausa para ver los *skeletons*, `PerformanceObserver` de `layout-shift`) | CLS **0,0116** a 1366 px: tarjetas KPI de 206 → 233 px y gráficas de 414 → 422 px |
| Imágenes, fuentes y metadatos | Sin `<img>` (`hero.png` no se usa); `Inter` se declara pero no se descarga; sin `<meta name="description">` |

### Cambios aplicados (todos aprobados por el usuario antes de aplicarse)

| # | Origen | Archivos | Cambio |
|---|---|---|---|
| V1 | Regla `bundle-dynamic-imports` (CRITICAL). En Vite, `next/dynamic` equivale a `React.lazy` | `App.tsx` y `chart-skeleton.tsx` (nuevo) | Las 2 gráficas se cargan con `React.lazy` + `Suspense`. El *fallback* es el `ChartSkeleton` compartido, que también usan las gráficas como estado de carga (antes estaba duplicado) |
| V3 | **No sale de la skill**: regla FE-05 del repo ("misma forma que el contenido final") y "anti-patrones de layout shift" del enunciado | `kpi-card.tsx`, `chart-skeleton.tsx` y las 2 gráficas | Alturas de los *skeletons* iguales a las del contenido: icono `h-7`, valor `h-9`, título `h-6` y descripción de 20 px |
| F1 | Revisión independiente: V1 introducía un fallo nuevo | `chart-error-boundary.tsx` (nuevo) y `App.tsx` | Un *error boundary* por gráfica. Si falla la carga de su código, solo esa gráfica muestra "Could not load the chart." (`role="alert"`) y el resto de la app sigue funcionando. Es una clase porque React lo exige (excepción a FE-02, comentada en el código) |
| F2 | Revisión independiente (V3 incompleto) | `kpi-card.tsx` | El texto de ayuda reserva siempre 2 líneas (`min-h-[3.25em]`), y el *skeleton* también |
| F3 | Revisión independiente (V3 incompleto) | Las 2 gráficas y `chart-skeleton.tsx` | La descripción reserva 2 líneas en el móvil (`max-sm:min-h-10`), y el *skeleton* también |

### No aplicado (decidido con el usuario)

| Regla o tema | Motivo |
|---|---|
| `js-combine-iterations` en `computeKPIs` | Aplica, pero con 360 movimientos no tiene impacto medible. Se evita tocar código que funciona |
| `<meta name="description">` | No sale de la skill. Se valora en la Fase 4 con una skill de SEO |
| `next/image`, `next/font` y metadata de Next | La skill no tiene esas reglas (Fase 1), el proyecto no es Next, no hay imágenes y no se descarga ninguna fuente |
| `bundle-barrel-imports` | Medido: Vite ya incluye solo los 5 iconos que se usan |
| `rerender-derived-state-no-effect` | `metrics` y `monthlyData` salen de la respuesta de la API, no de props ni de otro estado |
| `rendering-usetransition-loading` | `loading` tiene que valer `true` desde el primer render; `isPending` empieza en `false` |
| `advanced-init-once` | La petición doble solo pasa en desarrollo (`StrictMode`) y es una petición de datos, no una inicialización |
| `client-swr-dedup` | Una dependencia nueva para una sola petición |
| `bundle-preload` | No aporta nada: el código de las gráficas ya empieza a descargarse en el primer render y no hay hover ni intención que anticipar (confirmado por la revisión) |
| `rendering-hoist-jsx`, `rendering-svg-precision` y `rendering-resource-hints` | Impacto nulo: JSX trivial, SVG generados por Recharts y API del mismo origen |

### Verificación final

**Build:**

| | Antes | Después |
|---|---|---|
| JS inicial | 585,86 kB (1 trozo) | **229 kB**: `index` 188,15 + código compartido 40,86 |
| Recharts | En el JS principal | `LineChart` de 342,87 kB, cargado en diferido |
| Advertencia ">500 kB" | Sí | **No** |

Rolldown llama `chart-skeleton-*.js` al trozo de código compartido (React, `Card`, `Skeleton`, `cn`…). Es el comportamiento normal del bundler.

**Sin cascada.** En el navegador, el código de las gráficas empieza a descargarse en el primer render (~52-64 ms), en paralelo a la petición a la API, y Recharts se descarga una sola vez.

**CLS.** Con el backend en pausa y midiendo "cargando → con datos", la altura es igual en **los 8 anchos medidos**: 320, 360, 375, 640, 700, 768 y 1024 px (iframes) y 1366 px (ventana). El CLS a 1366 px pasa de **0,0116 a 0**. Coste aceptado: a algunos anchos, las tarjetas KPI tienen ~20 px más de espacio abajo, porque el texto de ayuda siempre reserva 2 líneas.

**Error de carga.** Se hizo fallar a propósito el módulo de una gráfica con un `throw` temporal, después retirado. Solo esa gráfica mostró el error, a la misma altura, y las KPI, la otra gráfica y "Financial data loaded." siguieron funcionando.

**TE-01:** pytest 15 · vitest 6 · lint OK · build OK, sin avisos.

**Aceptado sin cambios** (de la revisión):
- el *skeleton* de la gráfica se reinicia si su código llega antes que los datos (misma altura, sin salto);
- "Financial data loaded." puede anunciarse un instante antes de que se pinte la gráfica.

**Lighthouse Performance no se pasó.** En modo Snapshot no mide la carga ni el CLS, y en modo Navigation mediría el servidor de desarrollo de Vite, no el build. Las mediciones de arriba son directas.

**Referencias actualizadas.** Al mover código, 14 referencias a números de línea de `.agents/rules/`, `engineering-findings.md` y el memory-bank quedaron desfasadas, entre ellas `income-outcome-chart.tsx:113`, que ya lo estaba desde la Fase 2. Se corrigieron y el ejemplo de FE-05 se actualizó (`h-9`).
