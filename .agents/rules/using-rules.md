---
name: using-rules
description: Qué archivo de reglas leer antes de editar y cómo añadir o cambiar reglas
scope: "**"
---

# Uso de las reglas

Reglas para cualquier coding agent (o persona) que edite este repositorio. Todas las reglas de esta carpeta se derivan de hechos concretos del código, documentados en [`engineering-findings.md`](../../engineering-findings.md).

## UR-01 · Lee las reglas que correspondan antes de editar

**Regla:** Antes de modificar un archivo, lee siempre [`testing.md`](testing.md) y [`git-and-docs.md`](git-and-docs.md), y además el archivo de reglas que corresponda a lo que vas a tocar:

| Si vas a tocar… | Lee también |
|---|---|
| `frontend/src/**` | [`frontend.md`](frontend.md) |
| `backend/app/**` | [`backend.md`](backend.md) |
| `docker-compose.yml`, `*/Dockerfile`, `backend/requirements.txt`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/.env*` | [`environment.md`](environment.md) |
| `FinancialMovement` o sus tipos (`OperationType`, `Category`, `BusinessType`) | [`backend.md`](backend.md) **y** [`frontend.md`](frontend.md) |

**Por qué:** [`AGENTS.md`](../../AGENTS.md) obliga a revisar `./.agents/rules` antes de actuar, pero no indica qué archivo aplica a cada tarea. El contrato de datos está duplicado entre `backend/app/routes.py` y `frontend/src/lib/financial-types.ts` (hallazgo D1), así que un cambio en él afecta a los dos lados.

**✅ Haz:** para un cambio en `frontend/src/lib/financial-utils.ts`, lee `testing.md`, `git-and-docs.md` y `frontend.md`.

**❌ Evita:** editar el backend sin haber leído `backend.md`, o cambiar un campo de `FinancialMovement` habiendo leído solo uno de los dos lados.

**Cómo comprobarlo:** al terminar, debes poder citar el ID de cada regla aplicada (por ejemplo, "FE-09, TE-01, GD-01").

## UR-02 · Toda regla nueva debe apoyarse en evidencia del repositorio

**Regla:** Al añadir o cambiar una regla:

1. Apóyala en un hecho verificable del repositorio: un archivo, una línea o un comportamiento ejecutado.
2. Usa el formato de la plantilla de abajo, con su `name`, `scope`, **Por qué** y una guía concreta.
3. Añade o actualiza el hallazgo en `engineering-findings.md` y su fila en la tabla de trazabilidad.
4. Si la cambias después de probarla con una tarea real, deja constancia en [`verification.md`](../../verification.md).

**Por qué:** las instrucciones del proyecto exigen que cada regla mapee al menos a un hecho concreto del repositorio. No se aceptan buenas prácticas genéricas ni preferencias personales.

**✅ Haz:** "Usa `create_date.slice(0, 7)` para agrupar por mes. Motivo: `financial-utils.ts:42` desplaza los movimientos del día 1 en zonas UTC negativas (hallazgo D2)".

**❌ Evita:** "Escribe código limpio" o "Usa buenas prácticas de React", porque no citan ningún hecho del repositorio.

**Cómo comprobarlo:** cada regla de esta carpeta tiene un **Por qué** con una ruta del repositorio, y su hallazgo aparece en la tabla de trazabilidad de `engineering-findings.md`.

## UR-03 · Mantén el `memory-bank` al día

**Regla:** Lee [`memory-bank/`](../../memory-bank/) al empezar a trabajar en el repositorio. Si tu cambio hace que deje de ser cierto algo de lo que dice, actualízalo **en el mismo commit**:

| Si cambias… | Actualiza |
|---|---|
| Dependencias, versiones, Dockerfiles, puertos o comandos | [`tech-stack.md`](../../memory-bank/tech-stack.md) |
| Endpoints, parámetros, campos del contrato o lo que muestra el dashboard | [`product-overview.md`](../../memory-bank/product-overview.md) |
| Cómo fluyen los datos, dónde vive una responsabilidad o un acoplamiento | [`architecture.md`](../../memory-bank/architecture.md) |
| Corriges una carencia, añades una o cambia el resultado de las comprobaciones | [`current-state.md`](../../memory-bank/current-state.md) |

Actualiza también el campo `last_verified` del archivo con la fecha y el commit en que lo comprobaste.

**Por qué:** [`AGENTS.md`](../../AGENTS.md) manda leer el `memory-bank` antes de actuar. Su contenido está ligado a hechos que cambian: por ejemplo, `current-state.md` cita 15 tests de backend y 6 de frontend, y `tech-stack.md` cita las versiones instaladas. En la Fase 3 ya ocurrió que hallazgos corregidos (T2, D2) siguieran descritos como vigentes en `engineering-findings.md` hasta que un agente lo detectó.

**✅ Haz:** al fijar una dependencia nueva, actualizar su fila en `tech-stack.md` en el mismo commit.

**❌ Evita:** corregir una carencia y dejarla en la lista de `current-state.md`, o escribir en el `memory-bank` funcionalidades o planes que no existen en el código.

**Cómo comprobarlo:** en el diff de un cambio que afecta a alguna fila de la tabla, aparece también el archivo correspondiente de `memory-bank/`.

### Plantilla de un archivo de reglas

```markdown
---
name: <nombre-del-archivo>
description: Qué cubre, en una línea
scope: <rutas a las que aplica, por ejemplo frontend/src/**>
---

# <Título>

## <ID> · <Título corto>

**Regla:** qué hacer, en modo imperativo.

**Por qué:** el hecho del repositorio que la justifica, con su ruta y el ID del hallazgo.

**✅ Haz:** ejemplo correcto, tomado del propio código cuando existe.

**❌ Evita:** el error concreto que la regla previene.

**Cómo comprobarlo:** comando o revisión que demuestra que se ha cumplido.
```

## Índice de reglas

| Archivo | Alcance | Reglas |
|---|---|---|
| [`using-rules.md`](using-rules.md) | Todo el repositorio | UR-01 a UR-03 |
| [`frontend.md`](frontend.md) | `frontend/src/**` | FE-01 a FE-10 |
| [`backend.md`](backend.md) | `backend/app/**` | BE-01 a BE-05 |
| [`testing.md`](testing.md) | `backend/tests/**`, `frontend/src/**/*.test.ts` | TE-01 a TE-04 |
| [`environment.md`](environment.md) | Docker, dependencias y configuración de Vite | EN-01, EN-02 |
| [`git-and-docs.md`](git-and-docs.md) | Commits y `README*.md` | GD-01, GD-02 |
