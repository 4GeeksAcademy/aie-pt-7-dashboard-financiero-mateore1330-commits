---
name: git-and-docs
description: Formato de los mensajes de commit y mantenimiento de la documentación en dos idiomas
scope: mensajes de commit, README.md, README.es.md
---

# Reglas de git y documentación

Aplican a cualquier tarea que termine en un commit o que cambie la documentación del proyecto.

## GD-01 · Conventional Commits en inglés, un commit por cambio lógico

**Regla:** Escribe los mensajes de commit con el formato [Conventional Commits](https://www.conventionalcommits.org/), en inglés y en imperativo:

```text
<tipo>: <resumen en minúsculas, sin punto final, como máximo 72 caracteres>

<cuerpo opcional: qué cambia y por qué, con líneas de 72 caracteres como máximo>
```

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un bug |
| `test` | Solo añade o cambia tests |
| `docs` | Solo documentación (incluidas `.agents/rules`, `memory-bank`, `*.md`) |
| `chore` | Mantenimiento: dependencias, configuración, tooling |
| `refactor` | Cambia el código sin cambiar el comportamiento |

Haz un commit por cambio lógico. No mezcles, por ejemplo, un `fix` con una actualización de dependencias. Los tests que acompañan a un `feat` o un `fix` van **en el mismo commit**: usa `test:` solo cuando el commit solo toca tests. Si dos cambios tocan el mismo archivo, hazlos y commitéalos uno detrás de otro, porque `git add -p` (interactivo) no está disponible para el agente. Haz `git add` con rutas explícitas, nunca `git add .` si hay cambios ajenos sin commitear.

**Por qué:** los commits recientes ya siguen este formato: `eeece05 feat: use Vite API proxy and document frontend env setup`, `fb7dd96 docs: clarify project objectives and setup steps` y `9c3e480 chore: Ensure dates are generated in the correct order`. Los más antiguos no lo seguían, como `0c07552 Add anomaly alerts endpoint…` (hallazgo G1).

**✅ Haz:** `fix: group monthly data by date string to avoid timezone shift`

**❌ Evita:** `Fixed bug`, `update files`, `fix: arreglo de fechas`, o un único commit que mezcle código, tests de otra zona y dependencias.

**Cómo comprobarlo:** `git log --oneline` muestra cada commit con un tipo de la tabla y un resumen en inglés.

## GD-02 · Cambia los dos README a la vez

**Regla:** Si cambias el README, aplica el mismo cambio en [`README.md`](../../README.md) (inglés) **y** en [`README.es.md`](../../README.es.md) (español), en el mismo commit y en la misma sección.

**Por qué:** los dos archivos tienen la misma estructura (pasos recomendados, estructura de `.agents`, cómo ejecutar en local) y se enlazan entre sí ("These instructions are available in English" / "Estas instrucciones están disponibles en español"). Si se edita solo uno, el otro queda desactualizado (hallazgo G2).

**✅ Haz:** añadir la misma nota sobre `localhost:8000/health` en la sección "How to run locally" y en "Cómo ejecutar en local".

**❌ Evita:** actualizar solo `README.md`, o añadir una sección que solo existe en uno de los dos.

**Cómo comprobarlo:** `git diff --stat` muestra cambios en `README.md` y en `README.es.md`, y los dos tienen las mismas secciones (`grep "^#" README.md README.es.md`).
