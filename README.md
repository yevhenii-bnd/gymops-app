# GymOps

GymOps is a production-oriented training mini-ERP/CRM for gyms. The current codebase is in the Lean MVP foundation stage: monorepo, local QA, PostgreSQL, Prisma, API skeleton, frontend shell, and staff authentication foundation.

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop

## Local Setup From Scratch

Use this flow after cloning the repository or pulling a fresh `main`.

```powershell
git checkout main
git pull
npm install
npm run db:generate
```

Start the local PostgreSQL database:

```powershell
npm run db:up
```

Apply Prisma migrations:

```powershell
npm run db:migrate
```

Seed deterministic local test data:

```powershell
npm run db:seed
```

Run the current Phase 4 verification gate:

```powershell
npm run verify:phase4
```

## Local Database

The Docker Compose setup starts only PostgreSQL, not the full application runtime.

```text
Host: localhost
Port: 54329
Database: gymops
User: gymops
Password: gymops
Connection URL: postgresql://gymops:gymops@localhost:54329/gymops?schema=public
```

To reset the local database and reseed it:

```powershell
npm run db:test:reset
```

To stop the database:

```powershell
npm run db:down
```

## Run The API Locally

Start the database first, then build and run the API:

```powershell
$env:DATABASE_URL="postgresql://gymops:gymops@localhost:54329/gymops?schema=public"
npm run build --workspace @gymops/api
npm run start --workspace @gymops/api
```

The local auth defaults are listed in `.env.example`. For development, the seed creates these users with password `LocalOnly!ChangeMe123`:

```text
super.admin@gymops.local
gym.admin@gymops.local
employee@gymops.local
```

Useful local endpoints:

```text
http://localhost:4000/health
http://localhost:4000/ready
http://localhost:4000/version
http://localhost:4000/api/openapi.json
http://localhost:4000/api/docs
http://localhost:4000/api/v1/auth/login
http://localhost:4000/api/v1/auth/me
```

## Run The Web App Locally

The Phase 4 frontend shell runs as a Next.js app. Keep the API running on `http://localhost:4000` for real login.

```powershell
npm run dev:web
```

Useful local routes:

```text
http://localhost:3000/login
http://localhost:3000/app/dashboard
http://localhost:3000/app/reception
http://localhost:3000/403
http://localhost:3000/404
```

Install the Playwright browser once before running browser UI tests on a fresh machine:

```powershell
npx playwright install chromium
```

## Quality Gates

Quality strategy and future QA roadmap are documented in [`docs/quality-strategy.md`](docs/quality-strategy.md).

Phase 1 foundation:

```powershell
npm run verify:phase1
```

Phase 2 API and database foundation:

```powershell
npm run verify:phase2
```

Phase 3 frontend shell foundation:

```powershell
npm run verify:phase3
```

Phase 4 authentication, roles and branch context:

```powershell
npm run verify:phase4
```

Security audit for runtime dependencies:

```powershell
npm audit --omit=dev
```
