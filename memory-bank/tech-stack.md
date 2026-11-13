---
name: tech-stack
description: Lenguajes, frameworks, versiones instaladas, infraestructura y herramientas
last_verified: 2026-11-13 (sobre el commit 1b46bed y los cambios de la Fase 4)
---

# Stack tecnológico

> Las versiones son las **instaladas** en los contenedores, no los rangos de `package.json`. Se obtienen con `pip freeze` y `npm ls --depth=0` dentro de cada contenedor.

## Resumen

| Capa | Tecnología |
|---|---|
| Frontend | TypeScript 6 · React 19 · Vite 8 · Tailwind CSS 4 · Recharts 3 · shadcn/ui (estilo `new-york`) |
| Backend | Python 3.13 · FastAPI · Pydantic 2 · uvicorn |
| Infraestructura | Docker Compose con 2 servicios, sin base de datos |
| Tests | pytest (backend) · Vitest (frontend) |
| Calidad | ESLint 9 y `tsc` con `noUnusedLocals` y `noUnusedParameters` (frontend). **El modo `strict` de TypeScript no está activado.** En el backend no hay linter ni formateador |

## Runtimes

| Runtime | Versión | Origen |
|---|---|---|
| Python | 3.13.18 | Imagen `python:3.13-slim` ([`backend/Dockerfile`](../backend/Dockerfile)) |
| Node.js | 24.22.3 (ICU 78.3, tz 2026e) | Imagen `node:24-alpine` ([`frontend/Dockerfile`](../frontend/Dockerfile)) |
| npm | 11.19.1 | Incluido en la imagen de Node |

Las dos imágenes base usan etiquetas **sin versión de parche**, así que una reconstrucción puede traer otra versión de Python o Node.

## Backend: dependencias

[`backend/requirements.txt`](../backend/requirements.txt) fija **31 paquetes** con `==`, separados en dependencias directas y transitivas (desde el commit `da0fccc`).

| Paquete | Versión | Para qué |
|---|---|---|
| fastapi | 0.162.6 | Framework de la API |
| starlette | 1.10.0 | Base de FastAPI (transitiva) |
| pydantic | 2.14.3 | Modelos y validación |
| uvicorn[standard] | 0.54.0 | Servidor ASGI, con `--reload` |
| debugpy | 1.8.22 | Depurador remoto en el puerto 5678 |
| pytest | 9.2.0 | Tests |
| pytest-cov | 7.1.0 | Cobertura (instalado, sin configuración propia) |
| httpx | 0.28.1 | Cliente que usa `TestClient` |

## Frontend: dependencias clave

[`frontend/package.json`](../frontend/package.json), con versiones fijadas por [`package-lock.json`](../frontend/package-lock.json) (lockfileVersion 3):

| Paquete | Versión instalada | Para qué |
|---|---|---|
| react / react-dom | 19.2.5 | Interfaz |
| typescript | 6.0.2 | Tipado. `strict` **no** está activado (no hay `noImplicitAny` ni `strictNullChecks`): solo `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` y `noFallthroughCasesInSwitch`, en [`tsconfig.app.json`](../frontend/tsconfig.app.json). Las variables sin usar rompen `npm run build`, pero no `npm run lint` |
| vite | 8.0.8 | Servidor de desarrollo, proxy `/api` y build |
| @vitejs/plugin-react | 6.0.1 | Plugin de React para Vite |
| tailwindcss / @tailwindcss/vite | 4.2.2 | Estilos, con el tema en variables CSS en [`index.css`](../frontend/src/index.css) |
| recharts | 3.8.1 | Gráficas de líneas |
| lucide-react | 1.8.0 | Iconos |
| class-variance-authority, clsx, tailwind-merge | 0.7.1, 2.1.1, 3.5.0 | Utilidades de clases (`cn()` en [`lib/utils.ts`](../frontend/src/lib/utils.ts)) |
| vitest / @vitest/coverage-v8 | 4.1.4 | Tests |
| eslint / typescript-eslint | 9.39.4 / 8.58.1 | Lint |

Los componentes `ui/card` y `ui/skeleton` provienen de shadcn/ui ([`components.json`](../frontend/components.json)). shadcn no está instalado como dependencia: es código copiado en el repositorio. Ojo: `components.json` declara `"cssVariables": false`, aunque el tema se basa en variables CSS de `index.css`. Si se regeneran componentes con el CLI de shadcn, hay que revisar que usen las variables del tema (regla FE-06).

## Infraestructura y puertos

Definidos en [`docker-compose.yml`](../docker-compose.yml):

| Servicio | Puerto | Uso |
|---|---|---|
| `frontend` | 5173 | Dashboard y proxy `/api` → `http://backend:8000` |
| `backend` | 8000 | API, `/health` y `/docs` |
| `backend` | 5678 | debugpy |

- Los dos servicios montan su código como volumen, con recarga en caliente.
- `frontend/node_modules` es un volumen anónimo: en el host, esa carpeta está vacía.

## Comandos

| Qué | Comando |
|---|---|
| Arrancar | `docker compose up --build` (requiere Docker Desktop abierto) |
| Tests del backend | `docker compose exec backend python -m pytest -q` |
| Tests del frontend | `docker compose exec frontend npm test` |
| Lint | `docker compose exec frontend npm run lint` |
| Build (incluye `tsc -b`) | `docker compose exec frontend npm run build` |

No hay CI, `pre-commit` ni Makefile.
