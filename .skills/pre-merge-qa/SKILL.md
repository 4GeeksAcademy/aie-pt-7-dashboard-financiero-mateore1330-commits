---
name: pre-merge-qa
description: Checks de QA de este dashboard antes de abrir o fusionar un PR. Úsala cuando una rama esté lista para PR, cuando pidan "revisar antes del merge" o antes de dar una tarea por terminada. Ejecuta los comandos dentro de Docker, decide qué reglas de .agents/rules aplican según los archivos cambiados y entrega un informe ✅/⚠️/❌.
---

# QA antes del merge

## Objetivo

Comprobar que una rama cumple las reglas de [`.agents/rules/`](../../.agents/rules/) antes del PR. El repo no tiene CI ni pre-commit (hallazgo T4), así que esta skill hace de red de seguridad. **No corrige nada ni fusiona:** informa.

## Inputs

- **Rama base:** `main` si no se indica otra. En los comandos, `<base>`.
- **Servicios levantados** con `docker compose up` (regla EN-01).

## Pasos

Ejecuta todo **dentro de los contenedores**: el `node_modules` del host está vacío (el compose lo monta como volumen anónimo). Los comandos usan `exec -T` (sin pseudo-terminal), que funciona igual desde una terminal o desde un agente.

### 1. Alcance del cambio

```bash
git fetch -q origin
git diff --name-only origin/<base>...HEAD   # archivos de la rama
git status --short                          # cambios sin commitear
```

Resultado: ✅ si el alcance está claro. Si hay cambios sin commitear, ⚠️ con la lista: los resultados también los incluyen (TE-01).

### 2. Servicios (EN-01)

```bash
docker compose ps --format '{{.Service}} {{.State}}'                     # backend y frontend: running
curl -s localhost:8000/health                                            # {"status":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' localhost:5173/api/metrics      # 200
```

No uses `localhost:5173/health`: devuelve el HTML del frontend con 200.

### 3. Siempre: los cuatro comandos (TE-01)

```bash
docker compose exec -T backend python -m pytest -q
docker compose exec -T frontend npm test
docker compose exec -T frontend npm run lint
docker compose exec -T frontend npm run build
```

Anota el número real de tests. El único aviso conocido es `StarletteDeprecationWarning` en pytest (ver TE-01). El build **no tiene avisos**: cualquier aviso es nuevo.

### 4. Según los archivos cambiados

Marca **N/A** lo que no toque la rama, diciendo por qué (si además ejecutas el comando, añade su salida como evidencia). Los comandos de cada regla están en su apartado "Cómo comprobarlo".

**Si cambia `backend/app/routes.py`**, compara la base con `HEAD` con [`fingerprint.py`](fingerprint.py):

```bash
git show origin/<base>:backend/app/routes.py | docker compose exec -T backend python -c "$(cat .skills/pre-merge-qa/fingerprint.py)"
git show HEAD:backend/app/routes.py          | docker compose exec -T backend python -c "$(cat .skills/pre-merge-qa/fingerprint.py)"
```

| Huella distinta | Qué significa |
|---|---|
| `openapi` | Cambia la API pública. Revisa que solo se **añade** (BE-02) |
| `contract` | Cambia `FinancialMovement`: aplica BE-03 |
| `mock` | Cambian los datos mock: incumple BE-05 |

| Si cambia… | Regla | Comprobación |
|---|---|---|
| Lógica de fechas en `frontend/src/lib/` | [TE-04](../../.agents/rules/testing.md) | `docker compose exec -T -e TZ=America/New_York frontend node -e 'console.log(new Date().getTimezoneOffset())'` da `300` o `240`, y después `docker compose exec -T -e TZ=America/New_York frontend npm test` pasa |
| La huella `contract` | [BE-03](../../.agents/rules/backend.md) | Cambian también `frontend/src/lib/financial-types.ts` y los datos de ejemplo (`grep -rn "FinancialMovement\[\] = \[" frontend/src`) |
| Tests (`backend/tests/`, `*.test.ts`) | [BE-02](../../.agents/rules/backend.md) | `git diff origin/<base>...HEAD -- backend/tests 'frontend/src/**/*.test.ts' \| grep -cE '^-\s*(assert\|expect\(\|def test_\|it\(\|test\()'` da `0`, o cada línea quitada se sustituye por una igual o más estricta |
| `main.py`, `backend/Dockerfile`, `docker-compose.yml` | [BE-04](../../.agents/rules/backend.md) | Diff vacío, salvo que la tarea lo pida |
| `requirements.txt`, `package.json` | [EN-02](../../.agents/rules/environment.md) | `grep -v -e "==" -e "^#" -e "^$" backend/requirements.txt` vacío, y `package-lock.json` cambia junto a `package.json` |
| `README.md` o `README.es.md` **de la raíz** | [GD-02](../../.agents/rules/git-and-docs.md) | Cambian los dos, y `grep -oE "^#+" README.md \| sort \| uniq -c` da lo mismo que con `README.es.md` |
| `frontend/src/**` | [FE-01 a FE-10](../../.agents/rules/frontend.md) | Revisa el diff con cada regla que toque (por ejemplo, textos en inglés FE-07 y colores del tema FE-06) |
| `frontend/index.html`, `frontend/public/` | [FE-07](../../.agents/rules/frontend.md) | Los textos visibles o meta están en inglés |
| Algo de la tabla de [UR-03](../../.agents/rules/using-rules.md) | UR-03 | **En el mismo commit** aparece el archivo de `memory-bank/` correspondiente, con `last_verified` actualizado: `git log --format='--- %h %s' --name-only origin/<base>..HEAD -- . ':!.agents/skills'` y `git show <commit> -- memory-bank \| grep -E '^[-+]last_verified'`. Un cambio en el resultado de una comprobación (por ejemplo, Lighthouse) cuenta para `current-state.md` |

En los comandos con `\|` dentro de la tabla, escribe `|` al copiarlos.

### 5. Commits (GD-01)

```bash
git log --stat --format='--- %h %s' origin/<base>..HEAD -- . ':!.agents/skills'                         # un cambio lógico por commit, tests con su feat/fix
git log --format='%s' origin/<base>..HEAD | grep -vE '^(feat|fix|test|docs|chore|refactor): .{1,}$'     # vacío
git log --format='%h%x09%s' origin/<base>..HEAD | awk -F '\t' 'length($2) > 72'                         # vacío
git log --format='--- %h%n%b' origin/<base>..HEAD | awk '/^--- / {h=$2; next} length > 72 {print h " (" length "): " substr($0, 1, 60)}'   # vacío
```

`memory-bank/`, `plans/` y `verification.md` pueden ir dentro de un `feat`/`fix`/`refactor`: UR-03 pide que la documentación vaya con su cambio.

## Resultados

- **✅** cumple, con evidencia.
- **⚠️** incumple, pero está justificado en el código o la documentación, o el usuario lo ha aceptado. No bloquea, pero se lista.
- **❌** incumple. Bloquea el PR.
- **N/A** no aplica, con motivo.

**Si un ❌ está en commits ya subidos**, no reescribas la historia: propón al usuario las dos opciones (rebase y force-push, o aceptarlo como excepción documentada). Si lo acepta, pasa a ⚠️.

## Output esperado

Un informe con esta forma:

```markdown
## QA antes del merge · <rama> → <base>

| # | Check | Regla | Resultado | Evidencia |
|---|---|---|---|---|
| 1 | pytest | TE-01 | ✅ | 15 passed, 1 aviso conocido |
| … | TZ negativa | TE-04 | N/A | La rama no toca `frontend/src/lib/` |

**Veredicto:** listo para PR / no listo (N ❌)

**Qué corregir:** una línea por cada ❌, con el commit o archivo y la regla.
**Avisos:** una línea por cada ⚠️, con su justificación.
```

## Criterios de aceptación

- Los pasos 1, 2, 3 y 5 tienen resultado; en el paso 4, cada fila es ✅, ⚠️, ❌ o N/A con motivo.
- Cada ✅ lleva evidencia real (números, salida de un comando), no "parece correcto".
- El veredicto es "listo para PR" solo si no hay ningún ❌.
- No se ha modificado ningún archivo versionado (`git status` igual que al empezar), ni se ha hecho commit, push o merge. El build y pytest solo escriben `dist/` y cachés, que están en `.gitignore`.
