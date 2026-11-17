# Fase 2 — Aplicar la skill `accessibility`

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Con la skill `accessibility` cargada, auditar el dashboard y corregir lo que impida usarlo con lector de pantalla, con teclado o en alto contraste. Cada cambio tiene que poder ligarse a un archivo real y a una instrucción concreta de la skill. No se reescribe el dashboard: son mejoras dirigidas.

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-2-accessibility.md` | Este plan |
| `frontend/src/**` | Solo las correcciones aceptadas |
| `memory-bank/progress.md` | Sección "Fase 2": hallazgos, cambios aceptados y rechazados, y cómo se verificó |
| `memory-bank/current-state.md` | Si cambia la línea base de calidad o el resultado de las comprobaciones (UR-03) |
| `verification.md` | Sección "Skills · Fase 2" |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Guardar el plan y cargar la skill

- Guardar este plan.
- Volver a leer `.agents/skills/accessibility/` y las reglas del repo que tocan el frontend: `frontend.md`, `testing.md` y `git-and-docs.md` (regla UR-01).

### Paso 2 — Auditoría, sin cambiar nada

Recorrer `frontend/index.html`, `App.tsx`, `components/dashboard/*` y `components/ui/*` con la lista de la skill. Lo que pide el ejercicio como mínimo:

- **Teclado:** que todo lo interactivo se pueda alcanzar con Tab y tenga el foco visible.
- **`aria-*` / `role`:** etiquetas en controles e iconos, gráficos de Recharts con nombre accesible y estados de carga y error anunciados.
- **`alt`:** imágenes e iconos, tanto los decorativos como los que dan información.
- **Contraste:** texto y controles de la variante `.dark` de `index.css`, que es la que se ve (regla FE-06). Se calcula con un script a partir de los colores reales.

### Paso 3 — Propuesta de cambios para el usuario

Una tabla con: archivo y línea, problema, instrucción de la skill que lo pide, cambio propuesto, y si se acepta o se rechaza. Se rechaza lo que no encaje con el código o con las reglas del repo, por ejemplo textos en un idioma que no sea inglés (FE-07) o colores fijos (FE-06). **El usuario aprueba la tabla antes de tocar nada.**

### Paso 4 — Aplicar los cambios aceptados

- Uno a uno, con el estilo de cada archivo (FE-04).
- Si un cambio crea lógica, va en `lib/` con su test (FE-08).
- Si se cambia un color, en `:root` y en `.dark` (FE-06).

### Paso 5 — Verificar en la app y con los comandos

- Build, lint y tests dentro del contenedor: el mismo resultado de partida, sin advertencias nuevas.
- En el navegador (app en `localhost:5173`): recorrer la página solo con Tab y Shift+Tab, comprobar el foco visible y leer el árbol de accesibilidad (roles y nombres).
- Volver a calcular el contraste de los colores que hayan cambiado.
- Opcional, lo hace el usuario: Lighthouse → Accessibility en las DevTools de Chrome, antes y después.

### Paso 6 — Revisión independiente

Un agente nuevo, sin contexto, revisa el diff contra la skill y busca cambios que no estén ligados a una instrucción, o problemas que se hayan quedado sin tratar.

### Paso 7 — Rastro de verificación y commit

- `progress.md` y `verification.md` actualizados.
- Comandos de commit (los ejecuta el usuario, sin línea de coautor). El mensaje cita la skill, por ejemplo: `fix: improve dashboard accessibility with accessibility skill`.

## Criterios de aceptación

- [ ] Se puede recorrer todo el dashboard con el teclado y el foco se ve.
- [ ] Los `aria-*` y los `role` están donde hacen falta, y no hay ARIA de más donde el HTML ya basta.
- [ ] Las imágenes y los iconos tienen `alt`, o están marcados como decorativos.
- [ ] El texto y los controles pasan el contraste AA (4.5:1 para texto normal, 3:1 para texto grande y componentes de interfaz).
- [ ] El build, el lint y los tests pasan sin advertencias nuevas.

## Fuera de alcance

- Rediseño visual, componentes nuevos o funcionalidades de las specs.
- Patrones de despliegue y rendimiento (es la Fase 3).
