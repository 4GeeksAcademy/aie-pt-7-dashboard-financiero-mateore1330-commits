# Fase 1 — Descubrir y cargar las skills proporcionadas

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Encontrar las skills `accessibility` y `vercel-react-best-practices` con `npx skills find`, leer qué instrucciones le dan al agente e instalarlas en el repositorio. Antes de cambiar nada, confirmar con evidencia del repo cómo se arranca la app y qué comandos validan el frontend, y anotar su resultado de partida. En esta fase no se toca el código de la app.

## Decisiones tomadas con el usuario

| Tema | Decisión |
|---|---|
| Nombre de la rama | `feature/agent-skills`, el que pide el ejercicio |
| Base de la rama | `main`. El PR #1 (specs) sigue abierto y no se mezcla con este |
| Uso de `npx skills` | Permitido. Las skills se instalan en `.agents/skills/` (donde `AGENTS.md` dice que viven) y se commitean |
| Memory bank | Se crea `memory-bank/progress.md`. `current-state.md` se actualiza cuando cambie algo de lo que dice (regla UR-03) |
| Dónde van los planes | `plans/` en la raíz, separados de las skills para que el agente no los cargue como si lo fueran |

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-1-discover-skills.md` | Este plan. Los de las fases 2 a 6 ya están escritos, pero cada uno entra en el commit de su fase |
| `.agents/skills/accessibility/` | La skill instalada |
| `.agents/skills/vercel-react-best-practices/` | La skill instalada |
| `memory-bank/progress.md` | Sección "Fase 1": skills encontradas, qué aplica y qué no, y resultado de partida de build, lint y tests |
| `verification.md` | Sección "Skills · Fase 1" con el rastro de verificación |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Crear la rama y guardar el plan

- El usuario crea la rama: `git switch main && git pull origin main && git switch -c feature/agent-skills`.
- Comprobar que `memory-bank/` y `.agents/rules/` están commiteados en `main`, como pide el ejercicio.

### Paso 2 — Confirmar cómo se arranca y cómo se valida

- Sacar de `README.md`, `docker-compose.yml`, `frontend/package.json` y `memory-bank/tech-stack.md` los comandos de arranque, build (`tsc -b && vite build`), lint y test.
- Ejecutarlos dentro del contenedor, porque los `node_modules` del host están vacíos, y anotar el resultado y las advertencias que **ya existían**. Es el punto de partida para poder afirmar luego que no hay advertencias nuevas.

### Paso 3 — Buscar las skills

- `npx skills find accessibility` y `npx skills find vercel-react-best-practices`.
- Anotar de cada resultado el repositorio de origen, el nombre exacto y las alternativas que aparezcan.

### Paso 4 — Revisar cada skill antes de instalarla

- Leer su `SKILL.md` y sus archivos de reglas.
- Explicar en español qué cubre cada una.
- Clasificar sus instrucciones para este proyecto (Vite + React 19, sin Next.js):
  - ✅ las que se aplican,
  - ❌ las que no se aplican, y por qué (por ejemplo, `next/image`, `next/font` o la metadata por página de Next),
  - ❓ las dudosas, que se le preguntan al usuario.

### Paso 5 — Instalar las skills en `.agents/skills/`

- `npx skills add <repo> --skill <nombre>`, con alcance de proyecto y sin instalación global.
- Comprobar con `git status` qué archivos crea exactamente. Si crea algo fuera de `.agents/skills/` (enlaces en `.claude/`, un lock file…), se le enseña al usuario y se decide qué hacer.
- Leer enteros los archivos instalados y confirmar que no ejecutan nada.

### Paso 6 — Revisión independiente

Un agente nuevo, sin contexto, contrasta `progress.md` con las skills instaladas y con el repo, y busca afirmaciones sin evidencia (por ejemplo, una regla marcada como "no aplica" que sí aplica). Lo que encuentre se verifica antes de corregirlo.

### Paso 7 — Rastro de verificación y commit

- Añadir a `verification.md` la sección "Skills · Fase 1".
- Comandos de commit (los ejecuta el usuario, sin línea de coautor): `chore: add accessibility and vercel-react-best-practices agent skills`.

## Criterios de aceptación

- [ ] Las dos skills están en `.agents/skills/` y se han leído enteras.
- [ ] `progress.md` dice qué aplica y qué no de cada skill, con su motivo.
- [ ] El resultado de partida de build, lint y tests está anotado.
- [ ] `git diff main --stat` no muestra cambios en `frontend/src/` ni en `backend/`.

## Fuera de alcance

- No se aplica ninguna corrección (son las fases 2 y 3).
- No se instalan otras skills del ecosistema (es la Fase 4).
