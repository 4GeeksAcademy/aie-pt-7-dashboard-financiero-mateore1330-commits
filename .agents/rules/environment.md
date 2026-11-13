---
name: environment
description: Cómo levantar y verificar los servicios, y cómo gestionar dependencias
scope: docker-compose.yml, backend/Dockerfile, frontend/Dockerfile, backend/requirements.txt, frontend/package.json, frontend/package-lock.json, frontend/vite.config.ts, frontend/.env*
---

# Reglas de entorno

Aplican al arranque de los servicios, la configuración de Docker y Vite, y la gestión de dependencias.

## EN-01 · Levanta y verifica los servicios con Docker Compose

**Regla:** Arranca el proyecto con `docker compose up --build` desde la raíz (Docker Desktop tiene que estar abierto). Para verificarlo:

| Qué | Dónde |
|---|---|
| Health del backend | `http://localhost:8000/health` → `{"status":"ok"}` |
| Documentación de la API | `http://localhost:8000/docs` |
| API a través del proxy (como la usa el navegador) | `http://localhost:5173/api/metrics` |
| Dashboard | `http://localhost:5173` |

No ejecutes `npm run dev` fuera de Docker sin definir `VITE_API_BASE_URL=http://localhost:8000` en `frontend/.env`.

**Por qué:** [`docker-compose.yml`](../../docker-compose.yml) publica los puertos 5173 (frontend), 8000 (backend) y 5678 (debugpy). El proxy de [`vite.config.ts`](../../frontend/vite.config.ts) solo reenvía `/api` y apunta a `http://backend:8000`, un nombre que solo existe en la red de Docker: el Mac no lo resuelve. Por eso `localhost:5173/health` devuelve el HTML del frontend con código 200, no el JSON del backend (hallazgo E1).

**✅ Haz:** `curl localhost:8000/health` para el backend, y `curl localhost:5173/api/metrics` para comprobar el proxy.

**❌ Evita:** `curl localhost:5173/health` y concluir que el backend está sano porque responde 200, o suponer otros puertos (3000, 5000…).

**Cómo comprobarlo:** `docker compose ps` muestra `backend` y `frontend` en estado `running`, y los cuatro endpoints de la tabla responden como se indica.

## EN-02 · Dependencias con versión fija y lockfile en el commit

**Regla:**

- **Backend:** añade cada dependencia nueva a [`backend/requirements.txt`](../../backend/requirements.txt) con una versión exacta (`paquete==X.Y.Z`). Usa la versión instalada en el contenedor (`docker compose exec backend pip show <paquete>`).
- **Frontend:** instala dentro del contenedor con `docker compose exec frontend npm install <paquete>`, para que se actualicen `package.json` y `package-lock.json`, e incluye los dos en el commit.
- No actualices ni cambies dependencias que no tengan que ver con la tarea.
- Después de cambiar dependencias, reconstruye con `docker compose up --build`.

**Por qué:** `requirements.txt` no tiene versiones, así que cada build instala lo más reciente. Ya ha provocado el aviso `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated`, con Starlette 1.10.0 instalado. El [`frontend/Dockerfile:6`](../../frontend/Dockerfile#L6) usa `npm install`, que puede modificar `package-lock.json` (hallazgo E2).

**✅ Haz:** `fastapi==0.162.6` en `requirements.txt`.

**❌ Evita:** añadir `pandas` sin versión, ejecutar `npm install` en el host, o hacer commit de `package.json` sin `package-lock.json`.

**Cómo comprobarlo:** `grep -vE "==|^#|^$" backend/requirements.txt` no devuelve nada, y si `package.json` cambia en `git diff`, `package-lock.json` también.
