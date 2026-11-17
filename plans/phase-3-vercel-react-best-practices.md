# Fase 3 — Aplicar la skill `vercel-react-best-practices`

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Con la skill `vercel-react-best-practices` cargada, auditar los patrones del frontend que afectan al despliegue y a Lighthouse: layout shift, fuentes, imágenes, metadatos de la página y antipatrones de React. Se aplican las correcciones que encajen con este proyecto. El proyecto es **Vite + React 19, no Next.js**: lo que dependa de Next (`next/image`, `next/font`, la API `metadata`) no se aplica tal cual. Se busca su equivalente en Vite y, si no lo hay, se descarta dejando escrito el motivo.

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-3-vercel-react-best-practices.md` | Este plan |
| `frontend/**` | Solo las correcciones aceptadas |
| `memory-bank/progress.md` | Sección "Fase 3": reglas aplicadas, reglas descartadas por ser de Next.js y resultado del build |
| `memory-bank/tech-stack.md` y `current-state.md` | Si cambian dependencias, comandos o la línea base (UR-03) |
| `verification.md` | Sección "Skills · Fase 3" |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Guardar el plan y cargar la skill

- Guardar este plan.
- Volver a leer `.agents/skills/vercel-react-best-practices/`, su clasificación de la Fase 1 (qué aplica y qué no) y las reglas `frontend.md`, `environment.md`, `testing.md` y `git-and-docs.md`.

### Paso 2 — Auditoría, sin cambiar nada

Revisar con la lista de la skill, como mínimo, lo que cita el ejercicio:

| Tema de la skill | Dónde mirarlo en este repo |
|---|---|
| Imágenes (`next/image`) | `src/assets/`, `public/` y las etiquetas `<img>`, si las hay |
| Fuentes (`next/font`) | `index.css`, `index.html` y si se cargan fuentes externas |
| Layout shift | Si los `Skeleton` ocupan lo mismo que el contenido final (FE-05) y si los gráficos tienen alto fijo |
| Metadatos de la página | `index.html`: `<title>`, `description`, `lang` y favicon |
| Antipatrones de React y del bundle | `App.tsx` y los componentes: efectos, estado derivado, re-renders y tamaño del bundle que da `vite build` |

### Paso 3 — Propuesta de cambios para el usuario

Una tabla con: archivo y línea, regla de la skill, cambio propuesto (o su equivalente en Vite) y si se acepta o se rechaza, con su motivo. **El usuario la aprueba antes de tocar nada.** Si algún cambio necesita una dependencia nueva, se pregunta aparte (regla `environment.md` y `minimumReleaseAge`).

### Paso 4 — Aplicar los cambios aceptados

Uno a uno, con el estilo de cada archivo (FE-04) y sin cambiar el comportamiento de la app.

### Paso 5 — Verificar

- `npm run build` (el comando que documenta el repo), dentro del contenedor: pasa, y cualquier advertencia nueva frente al resultado de partida de la Fase 1 tiene que estar justificada.
- Lint y tests en verde.
- En el navegador: la app carga los datos, los gráficos se ven y no hay saltos de layout al pasar de carga a datos.
- Opcional, lo hace el usuario: Lighthouse → Performance y Best Practices, antes y después.

### Paso 6 — Revisión independiente

Un agente nuevo, sin contexto, revisa el diff contra la skill y comprueba que cada cambio está ligado a una regla y que lo descartado por ser de Next.js está bien descartado.

### Paso 7 — Rastro de verificación y commit

- `progress.md` y `verification.md` actualizados.
- Comandos de commit (los ejecuta el usuario, sin línea de coautor). El mensaje cita la skill, por ejemplo: `refactor: apply vercel-react-best-practices skill to frontend`. El tipo se elige según lo que cambie de verdad (GD-01).

## Criterios de aceptación

- [ ] Cada cambio está ligado a una regla de la skill.
- [ ] Las reglas de Next.js que no aplican están listadas con su motivo.
- [ ] El build pasa sin advertencias nuevas injustificadas, y el lint y los tests están en verde.
- [ ] La app funciona igual en el navegador.

## Fuera de alcance

- Migrar a Next.js o cambiar la herramienta de build.
- Configurar un despliegue real en Vercel.
