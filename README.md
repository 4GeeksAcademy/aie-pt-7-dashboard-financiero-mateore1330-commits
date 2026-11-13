# Financial Metrics Dashboard

<!-- hide -->

By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) at [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_Estas instrucciones están [disponibles en español](./README.es.md)._

**Before you start**: 📗 [Read the instructions](https://4geeks.com/lesson/how-to-start-a-project) on how to start a coding project.

<!-- endhide -->

---

_Financial metrics dashboard with a React + TypeScript frontend and a FastAPI backend._

## Recommended steps

1. Fork this repository to your account.
2. Open your fork in GitHub Codespaces or clone it and run it in your local environment.
3. Run your AI agent to inspect both frontend and backend.
4. Document the proposed rules and memory bank in your fork.
5. Refine and validate the rules until they fit the project's real workflow.

## Expected agents directory structure

```text
./.agents
└─ /rules
   └─ <rule-name>.md
└─ /skills
   └─ /<skill-name>
      └─ /SKILL.md
```

## How to run locally

### Prerequisites

Docker must be installed **and running** before you start. On macOS/Windows, open Docker Desktop (`open -a Docker` on macOS) and wait until it shows _Engine running_. You can check it with:

```bash
docker info
```

If this command fails, `docker compose up` will fail too.

### Start the services

From the repository root:

```bash
docker compose up --build
```

Check that both containers are up:

```bash
docker compose ps   # backend and frontend must appear as "Up"
```

The frontend uses the Vite proxy for `/api` by default, so no extra environment variables are required in local development or Codespaces.
If you need to target a different backend origin, copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.
If you run `npm run dev` outside Docker, you must set `VITE_API_BASE_URL=http://localhost:8000`: the proxy targets `http://backend:8000`, a hostname that only exists inside the Docker network.

### Check that everything works

| What | URL | Expected response |
|---|---|---|
| Backend health | http://localhost:8000/health | JSON `{"status":"ok"}` |
| API documentation | http://localhost:8000/docs | Swagger UI |
| API through the Vite proxy (as the browser uses it) | http://localhost:5173/api/metrics | JSON array of movements |
| Dashboard | http://localhost:5173 | The dashboard page |

```bash
curl http://localhost:8000/health        # {"status":"ok"}
curl http://localhost:5173/api/metrics   # JSON array
```

> [!WARNING]
> Check the backend health on port **8000**, not 5173. The Vite proxy only forwards `/api/*`, so `http://localhost:5173/health` returns the frontend HTML with status **200** even when the backend is down. A 200 response alone does not mean the backend is healthy: check that the body is `{"status":"ok"}`.

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon ... Is the docker daemon running?` | Docker Desktop is installed but not started | Open Docker Desktop, wait for _Engine running_ and run `docker compose up --build` again |
| `localhost:5173/health` returns HTML | That route does not go through the proxy to the backend | Use `http://localhost:8000/health` |
| The dashboard loads but shows no data | The backend is not running or the proxy cannot reach it | Run `docker compose ps` and `docker compose logs backend` |

---

This and many other projects are built by students as part of the [Career Programs](https://4geeksacademy.com/compare-programs) at [4Geeks Academy](https://4geeksacademy.com). By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors). Find out more about [AI Engineering](https://4geeksacademy.com/en/coding-bootcamps/ai-engineering), [Data Science & Machine Learning](https://4geeksacademy.com/en/coding-bootcamps/data-science-ml), [Cybersecurity](https://4geeksacademy.com/en/coding-bootcamps/cybersecurity) and [Full-Stack Software Developer with AI](https://4geeksacademy.com/en/coding-bootcamps/full-stack-developer).
