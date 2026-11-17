# Fase 5 — Escribir una skill interna del proyecto

> Proyecto: Mejorando el desarrollo con skills de agentes · Rama: `feature/agent-skills`

## Objetivo

Encontrar un hueco propio de este repo que las skills de la comunidad no cubren, y escribir una skill que el equipo pueda volver a cargar aquí. Tiene que tener objetivo claro, inputs definidos, output esperado y criterios de aceptación. Después se prueba con una tarea real del repo para comprobar que da una guía que se puede seguir. Se valora que sea corta y precisa, no que sea larga.

## Entregables

| Archivo | Contenido |
|---|---|
| `plans/phase-5-internal-skill.md` | Este plan |
| `.skills/<nombre>/SKILL.md` | La skill interna (con archivos de apoyo si hacen falta) |
| `memory-bank/progress.md` | Sección "Fase 5": el hueco detectado, la skill y el resultado de la prueba |
| `verification.md` | Sección "Skills · Fase 5": qué se corrigió en la skill tras probarla |

Todo va en **un solo commit**, plan incluido.

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Detectar huecos con evidencia del repo

Candidatas iniciales, que hay que confirmar con el código:

| Hueco | Evidencia en el repo |
|---|---|
| Checks de QA antes del merge | Build, lint y tests se lanzan **dentro del contenedor** porque `node_modules` del host está vacío; TE-04 (zona horaria UTC negativa); los dos README (GD-02); memory-bank en el mismo commit (UR-03) |
| Añadir un endpoint o campo de métricas sin romper el contrato | El contrato está duplicado entre `backend/app/routes.py` y `frontend/src/lib/financial-types.ts` (hallazgo D1) |
| Convenciones UI del dashboard | Estilo distinto por archivo (FE-04), solo colores del tema en `.dark` (FE-06), `Skeleton` en la carga (FE-05) y textos en inglés (FE-07) |

Se presentan al usuario con lo que ya cubren las skills de la comunidad, y **el usuario elige una**.

### Paso 3 — Redactar la skill

El agente la redacta y después se ajusta a la estructura de clase:

- `name` y `description` en el frontmatter (la descripción dice **cuándo** se carga).
- **Objetivo:** qué resuelve, en una o dos frases.
- **Inputs:** qué necesita (por ejemplo, la rama o los archivos cambiados).
- **Pasos:** comandos exactos de este repo, que no sean genéricos.
- **Output esperado:** qué entrega el agente al terminar (por ejemplo, un informe con ✅/❌ por check).
- **Criterios de aceptación:** cuándo se da por cumplida.

Cita los IDs de las reglas y los archivos reales, y no repite lo que ya está en `.agents/rules`: lo enlaza.

### Paso 4 — Probarla con una tarea real

- Un agente nuevo, sin contexto, carga solo la skill y la aplica a una tarea real de esta rama (por ejemplo, la revisión antes del PR).
- Comprobar que su guía se puede seguir sin preguntar, y que los comandos funcionan tal cual.
- Corregir la skill con lo que falle y anotarlo en `verification.md`.

### Paso 5 — Commit

- `progress.md` actualizado.
- Comandos de commit (los ejecuta el usuario, sin línea de coautor), por ejemplo: `docs: add internal <nombre> skill for this dashboard`.

## Criterios de aceptación

- [ ] La skill está en `.skills/` y tiene objetivo, inputs, output y criterios de aceptación.
- [ ] Su contenido es propio de este repo (comandos, rutas e IDs de reglas reales) y no es relleno genérico.
- [ ] Se ha probado con una tarea real y el resultado está anotado.

## Fuera de alcance

- Publicar la skill en skills.sh.
- Cambiar las reglas de `.agents/rules`. Si la prueba revela que hace falta, se le propone al usuario aparte.
