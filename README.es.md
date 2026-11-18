# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Entregables del proyecto

El contexto del repositorio se construyó fase por fase con un coding agent. Cada afirmación se comprobó contra el código.

| Fase | Entregable | Commits |
|---|---|---|
| 1 · Comprender el handover | [`verification.md`](./verification.md) (Fase 1): el resumen de la IA, comprobado afirmación por afirmación (✅/❌), con sus correcciones | `cb29403` |
| 2 · Hallazgos de ingeniería | [`engineering-findings.md`](./engineering-findings.md): 25 hallazgos con evidencia y 22 reglas propuestas, con trazabilidad | `add3d9f` |
| 3 · Reglas implementadas y probadas | [`.agents/rules/`](./.agents/rules/) (empieza por [`using-rules.md`](./.agents/rules/using-rules.md)). Validación con tareas reales en [`verification.md`](./verification.md) (Fase 3) | `537f82b`, `94b6fd1`, `f0dfdc5`, `a99e418`, `da0fccc`, `1b46bed` |
| 4 · Memoria del proyecto | [`memory-bank/`](./memory-bank/): descripción del producto, stack tecnológico, arquitectura y estado actual | `290c865` |

El rastro de verificación de cada fase (afirmación incorrecta → corrección) está en [`verification.md`](./verification.md) y en el cuerpo de los mensajes de commit.

### Desarrollo guiado por especificaciones (rama `feat/frontend-specs`)

Tres funcionalidades nuevas (filtro de rango de fechas, tabla de alertas de anomalías y vista B2B vs B2C) especificadas antes de implementarlas, en [`frontend/specs/`](./frontend/specs/). Empieza por su [`README.md`](./frontend/specs/README.md), el contrato de datos. El plan de cada fase está en [`frontend/specs/plans/`](./frontend/specs/plans/).

| Fase | Entregable | Commits |
|---|---|---|
| 1 · Explorar la API | [`api-exploration.md`](./frontend/specs/api-exploration.md): endpoints, casos límite reales y 31 desajustes entre el brief del PM y la API | `65d5b3e` |
| 2 · Tipos TypeScript | [`api-types.ts`](./frontend/specs/api-types.ts), [`param-types.ts`](./frontend/specs/param-types.ts): verificados contra el OpenAPI en vivo (28/28 propiedades), con un `tsconfig.json` estricto | `0cf4626` |
| 3 · Especificación de componentes | [`components.md`](./frontend/specs/components.md): componentes, props tipadas y estados de renderizado | `2c92ea5` |
| 4 · Contrato de datos | [`README.md`](./frontend/specs/README.md): endpoints, tipos, restricciones de los parámetros y casos límite de cada funcionalidad | `docs(specs): add data contract readme…` |

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
./.agents
└─ /rules
   └─ <nombre-regla>.md
└─ /skills
   └─ /<nombre-skill>
      └─ /SKILL.md
```

## Cómo ejecutar en local

### Requisitos previos

Docker tiene que estar instalado **y en ejecución** antes de empezar. En macOS/Windows, abre Docker Desktop (`open -a Docker` en macOS) y espera a que muestre _Engine running_. Puedes comprobarlo con:

```bash
docker info
```

Si este comando falla, `docker compose up` también fallará.

### Arrancar los servicios

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Comprueba que los dos contenedores están levantados:

```bash
docker compose ps   # backend y frontend deben aparecer como "Up"
```

El frontend usa por defecto el proxy de Vite para `/api`, así que no necesitas variables de entorno extra ni en desarrollo local ni en Codespaces.
Si necesitas apuntar a otro backend, copia `frontend/.env.example` como `.env` y define `VITE_API_BASE_URL`.
Si ejecutas `npm run dev` fuera de Docker, tienes que definir `VITE_API_BASE_URL=http://localhost:8000`: el proxy apunta a `http://backend:8000`, un nombre de host que solo existe dentro de la red de Docker.

### Comprobar que todo funciona

| Qué | URL | Respuesta esperada |
|---|---|---|
| Health del backend | http://localhost:8000/health | JSON `{"status":"ok"}` |
| Documentación de la API | http://localhost:8000/docs | Swagger UI |
| API a través del proxy de Vite (como la usa el navegador) | http://localhost:5173/api/metrics | Array JSON de movimientos |
| Dashboard | http://localhost:5173 | La página del dashboard |

```bash
curl http://localhost:8000/health        # {"status":"ok"}
curl http://localhost:5173/api/metrics   # array JSON
```

> [!WARNING]
> Comprueba el health del backend en el puerto **8000**, no en el 5173. El proxy de Vite solo reenvía `/api/*`, así que `http://localhost:5173/health` devuelve el HTML del frontend con código **200** aunque el backend esté caído. Un 200 por sí solo no significa que el backend esté sano: comprueba que el cuerpo sea `{"status":"ok"}`.

### Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon ... Is the docker daemon running?` | Docker Desktop está instalado pero no arrancado | Abre Docker Desktop, espera a que muestre _Engine running_ y vuelve a lanzar `docker compose up --build` |
| `localhost:5173/health` devuelve HTML | Esa ruta no pasa por el proxy hacia el backend | Usa `http://localhost:8000/health` |
| El dashboard carga pero no muestra datos | El backend no está en marcha o el proxy no llega a él | Ejecuta `docker compose ps` y `docker compose logs backend` |

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
