# Fase 4 — Explorar el ecosistema y aplicar una skill más

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Buscar con `npx skills find` skills sobre al menos dos temas relevantes para este repo, decidir con el usuario cuál vale la pena y aplicar al menos una, dejando escrita la justificación.

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-4-explore-ecosystem.md` | Este plan |
| `.agents/skills/seo/` y `.agents/skills/fastapi/` | Las dos skills elegidas por el usuario (y `skills-lock.json`) |
| Archivos del repo que toquen las skills | Solo los cambios aceptados: `frontend/index.html` y `frontend/public/robots.txt` (seo), `backend/app/routes.py` (fastapi) y el ejemplo de BE-01 en `.agents/rules/backend.md` |
| `memory-bank/progress.md` | Sección "Fase 4": búsquedas hechas, candidatas, las elegidas y por qué, y lo que se aplicó |
| `verification.md` | Sección "Skills · Fase 4" |

Van en **dos commits**, uno por skill, como pide el enunciado:

1. `seo`: la skill, los cambios en `frontend/index.html` y el nuevo `frontend/public/robots.txt`.
2. `fastapi`: la skill, los cambios en `backend/app/routes.py`, `skills-lock.json` (el CLI registra las dos skills en el mismo archivo, así que va entero en este commit), este plan y la documentación de la fase.

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Buscar en al menos dos temas

Temas candidatos, elegidos porque el repo los usa de verdad:

| Tema | Por qué encaja |
|---|---|
| `testing` | El frontend tiene Vitest (`financial-utils.test.ts`) y el backend pytest |
| `typescript` | Frontend en TypeScript (sin modo `strict`) |
| `performance` | Recharts y el tamaño del bundle |
| `tailwind` | Tailwind CSS 4 con variables de tema |
| `fastapi` | El backend |
| `seo` | `index.html` no tiene meta description (pendiente V4 de la Fase 3) |

Para cada búsqueda, anotar los resultados (nombre, origen y para qué sirve).

### Paso 3 — Revisar las candidatas y elegir con el usuario

- Leer el `SKILL.md` de las 2 o 3 mejores candidatas.
- Presentar al usuario una comparación: qué aportaría a este repo y qué no.
- **El usuario elige la skill** antes de instalarla.

### Paso 4 — Instalar y aplicar

- `npx skills add …` en `.agents/skills/` y leerla entera.
- Igual que en las fases 2 y 3: auditoría, tabla de propuestas que aprueba el usuario y después aplicar los cambios aceptados, con las reglas del repo.

### Paso 5 — Verificar

- Build, lint y tests en verde, sin advertencias nuevas.
- La comprobación propia de la skill (por ejemplo, si es de testing, que los tests nuevos pasan y fallan cuando deben).

### Paso 6 — Revisión independiente y commit

- Un agente nuevo, sin contexto, revisa el diff y la justificación.
- `progress.md` y `verification.md` actualizados.
- Comandos de los dos commits (los ejecuta el usuario, sin línea de coautor). Cada mensaje cita su skill, por ejemplo: `feat: add <...> with seo skill`. El tipo depende de lo que cambie.

## Criterios de aceptación

- [ ] Hay al menos dos búsquedas `npx skills find` con sus resultados anotados.
- [ ] Hay al menos una skill aplicada (aquí, dos), con su justificación en `progress.md`.
- [ ] Los cambios están ligados a instrucciones de cada skill y verificados.
- [ ] Si una skill choca con una regla del repo, manda la regla del repo y queda escrito (decisión: se mantiene `response_model` por BE-01).

## Fuera de alcance

- Instalar skills que no se apliquen.
- Escribir la skill interna (es la Fase 5).
