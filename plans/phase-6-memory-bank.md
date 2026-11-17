# Fase 6 — Actualizar el memory bank

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Dejar el memory bank tal y como está el repo al final de la sesión. `memory-bank/progress.md` tiene que recoger las skills aplicadas, los cambios verificados, las skills del ecosistema elegidas (y por qué) y la skill interna creada. El resto de archivos del memory bank no puede describir nada que no exista en el código (UR-03).

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-6-memory-bank.md` | Este plan |
| `memory-bank/progress.md` | Repaso final: resumen de las skills, cambios verificados, la skill del ecosistema y la interna |
| `memory-bank/current-state.md`, `architecture.md`, `tech-stack.md` | Solo si algo de lo que dicen ya no es cierto. `last_verified` con la fecha y el commit |
| `verification.md` | Sección "Skills · Fase 6" |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Completar `progress.md`

Un resumen al principio con las cuatro cosas que pide el ejercicio, enlazando a la sección de cada fase:

| Pide el ejercicio | Dónde está |
|---|---|
| Skills aplicadas | Fases 2, 3 y 4 |
| Cambios verificados | Tabla con el cambio, cómo se verificó y el commit |
| Skills del ecosistema elegidas y por qué | Fase 4 (`seo` y `fastapi`) |
| Skill interna creada | Fase 5 |

### Paso 3 — Comprobar el resto del memory bank

- Contrastar cada afirmación de `current-state.md`, `architecture.md` y `tech-stack.md` con el código de la rama (número de tests, comandos, carpetas `.agents/skills/` y `.skills/`).
- Actualizar `last_verified`.

### Paso 4 — Revisión independiente

Un agente nuevo, sin contexto, aplica la skill interna [`pre-merge-qa`](../.skills/pre-merge-qa/SKILL.md) a la rama como QA final antes del PR. Además, contrasta todo el memory bank con el repo y busca afirmaciones falsas o funcionalidades descritas que no existen.

### Paso 5 — Commit

- Comandos de commit (los ejecuta el usuario, sin línea de coautor): `docs: update memory bank with agent skills progress`.

## Criterios de aceptación

- [ ] `progress.md` cubre los cuatro puntos del ejercicio.
- [ ] El memory bank no dice nada que no sea cierto en la rama.
- [ ] El build, el lint y los tests siguen en verde en el último commit.

## Después de la fase: entrega

- Abrir el PR `feature/agent-skills → main`, en español y sin ninguna mención a Claude, con casillas por fase. Lo crea el agente con `gh pr create --repo <fork> --base main`.
- El usuario comparte la URL con el instructor. **El agente no fusiona.**
- Se le pregunta al usuario si quiere añadir una sección de entregables en `README.md` y `README.es.md` (GD-02), como en el proyecto anterior. El ejercicio no lo pide.

## Fuera de alcance

- Cambios de código: si se detecta algo pendiente, se anota como carencia en `current-state.md`.
