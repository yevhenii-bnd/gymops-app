# GymOps

GymOps is a production-oriented training mini-ERP/CRM for gyms. The current codebase is in the Lean MVP foundation stage: monorepo, local QA, PostgreSQL, Prisma, and the API skeleton.

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

Run the full Phase 2 verification gate:

```powershell
npm run verify:phase2
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

Useful local endpoints:

```text
http://localhost:4000/health
http://localhost:4000/ready
http://localhost:4000/version
http://localhost:4000/api/openapi.json
http://localhost:4000/api/docs
```

## Quality Gates

Phase 1 foundation:

```powershell
npm run verify:phase1
```

Phase 2 API and database foundation:

```powershell
npm run verify:phase2
```

Security audit for runtime dependencies:

```powershell
npm audit --omit=dev
```
