# ACME Salary Manager

Web app for an HR Manager to manage salaries of ~10,000 employees across 9 countries and answer *"how do we pay people?"*.

**Stack:** Node.js + Express + SQLite (better-sqlite3) · Next.js (App Router) + Mantine · Vitest + Supertest.

| Doc | Purpose |
|---|---|
| [docs/01-requirements.md](docs/01-requirements.md) | One-page requirements: goal, scope, deliberate exclusions |
| [docs/02-design-and-tradeoffs.md](docs/02-design-and-tradeoffs.md) | Architecture diagram, decisions, performance, limits |
| [docs/03-ai-usage.md](docs/03-ai-usage.md) | How AI was used, prompts, corrections |

## Features
- Employee list with server-side search, filters (country, department, job title, USD range), sorting and pagination; CSV export of the filtered view
- Create / edit / delete; **salary history** recorded automatically with a reason
- Multi-currency (currency derived from country) with USD normalisation for comparison
- Insights: headcount, payroll, min / P10 / median / average / P90 / max, breakdown by country / department / job title, salary distribution

## Run locally
Requires Node 20+ (tested on 22).
```bash
# 1. API (http://localhost:4000)
cd backend
npm install
npm run seed          # creates salary.db with 10,000 employees (~0.3 s)
npm start

# 2. UI (http://localhost:3000)  - in another terminal
cd frontend
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

## Tests
```bash
cd backend && npm test     # 43 tests: domain, API, validation, seed, CSV (~2 s)
cd frontend && npm test    # 7 tests: API client + formatting helpers
```

## API summary
| Method & path | Description |
|---|---|
| `GET /api/employees?search&country&department&jobTitle&minSalaryUsd&maxSalaryUsd&sort&order&page&pageSize` | Paginated list |
| `GET /api/employees/export.csv?...` | CSV of the filtered view |
| `GET/POST/PUT/DELETE /api/employees[/:id]` | CRUD; GET by id includes history |
| `GET /api/insights/summary` · `/breakdown?by=country\|department\|jobTitle` · `/distribution?bins=` | Insights (all accept country/department/jobTitle filters) |
| `GET /api/meta` | Countries, departments, job titles |

Errors use `{ "error": { "code", "message", "details?" } }`.

## Deploy
**API → Render** (blueprint included): push to GitHub → Render *New → Blueprint* → pick the repo (`render.yaml`). Set `CORS_ORIGIN` to the UI URL. `AUTO_SEED=true` seeds 10,000 employees on first boot. Free-tier disks are ephemeral, so data resets on redeploy; attach a disk and set `DB_PATH=/data/salary.db` for persistence.

**UI → Vercel**: import the repo, set *Root Directory* = `frontend`, add env var `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com`, deploy.