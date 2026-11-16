---
name: progress
description: Progreso del proyecto de skills de agentes — skills aplicadas, cambios verificados, skill del ecosistema elegida y skill interna
last_verified: 2026-11-16 (sobre el commit 8022d3e y la instalación de la Fase 1)
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
