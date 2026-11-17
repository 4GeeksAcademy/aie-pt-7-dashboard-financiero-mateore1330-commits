---
name: progress
description: Progreso del proyecto de skills de agentes — skills aplicadas, cambios verificados, skill del ecosistema elegida y skill interna
last_verified: 2026-11-17 (sobre el commit 8c44273 y los cambios de la Fase 2)
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
