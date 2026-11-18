# Fase 4 — Documentación del contrato de datos

> Proyecto: Aplicando desarrollo guiado por especificaciones · Rama: `feat/frontend-specs`

## Objetivo

Escribir `frontend/specs/README.md`: el contrato de datos de las tres funcionalidades y el punto de entrada a la carpeta `specs/`. Una sesión nueva del agente debe poder implementar con él (y los archivos a los que enlaza) sin hacer preguntas.

## Entregables

| Archivo | Contenido |
|---|---|
| `frontend/specs/plans/phase-4-data-contract.md` | Este plan |
| `frontend/specs/README.md` | Contrato de datos de las tres funcionalidades |
| `verification.md` | Sección "Specs · Fase 4" |
| `memory-bank/` | Estado del proyecto al día con la carpeta `specs/` (regla UR-03) |
| `README.md` y `README.es.md` | Fila nueva en la tabla de entregables, en los dos idiomas (regla GD-02) |

Todo va en **un solo commit**, plan incluido.

## Decisiones tomadas con el usuario

| Decisión | Motivo |
|---|---|
| Actualizar el `memory-bank` y los dos README de la raíz en el commit de esta fase | Las reglas UR-03 (memoria al día en el mismo commit) y GD-02 (los dos README a la vez) del proyecto anterior |

## Pasos

### Paso 1 — Guardar el plan

### Paso 2 — Estructura y parte común

- Para qué sirve la carpeta, orden de lectura e índice de archivos.
- Contrato común: URL base y proxy, cómo construir la query (omitir vacíos), formato de fechas, forma del error 422, respuestas que son listas sin envolver, dataset que cambia con la fecha de hoy.
- Comando de comprobación de tipos.

### Paso 3 — Funcionalidad 1: filtro de fechas

Endpoints (`/api/metrics/facets`, `/api/metrics`), tipos de petición y respuesta, tabla de parámetros con valores válidos y restricciones, y casos límite (solo una fecha, inicio > fin, input vacío, rango sin datos…) con lo que muestra la interfaz.

### Paso 4 — Funcionalidad 2: tabla de anomalías

`/api/metrics/alerts`: tipos, parámetros (umbral de la API frente al del PM) y casos límite (sin anomalías, rango de un mes, umbral fuera de rango, igual al umbral…).

### Paso 5 — Funcionalidad 3: vista B2B vs B2C

`/api/metrics/categories/top` y `facets`: tipos, parámetros y casos límite (panel vacío, solo 2 categorías, olvidar `operation_type`, un panel falla…).

### Paso 6 — Comprobaciones

- `npx tsc --noEmit` en `specs/` (dentro del contenedor) y `npm run lint`.
- Cada ruta, parámetro y caso límite del README se vuelve a comprobar con `curl` contra la API en marcha.
- Los bloques TypeScript del README se compilan contra los tipos.
- Rúbrica de la fase, punto por punto.

### Paso 7 — Revisión con una sesión nueva

Un agente nuevo recibe **solo** el README (y los archivos a los que enlaza) y apunta todas las preguntas que haría antes de implementar. Cada pregunta se resuelve en el README.

### Paso 8 — Rastro de verificación, memoria del proyecto y commit

- Sección "Specs · Fase 4" en `verification.md`.
- `memory-bank/` (al menos `current-state.md`) y la tabla de entregables de `README.md` y `README.es.md`.
- Comandos de commit (los ejecuta el usuario): `docs(specs): add data contract readme for frontend specs`.

## Fuera de alcance

- No hay componentes, `fetch` ni cambios en el backend ni en `src/`.
