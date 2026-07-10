# DomainHunter AI

DomainHunter AI is a local-first research workspace for discovering and prioritizing evidence-backed potential domain buyers from public sources.

## Requirements

- Node.js 22.13 or newer
- PostgreSQL 17 (or Docker)

## Local setup

1. Copy `.env.example` to `.env` and update the PostgreSQL credentials.
2. Start PostgreSQL with `docker compose up -d postgres` or use an existing instance.
3. Install dependencies with `npm install`.
4. Generate the database client with `npm run db:generate`.
5. Apply migrations with `npm run db:migrate`.

Run the web application with `npm run dev` and the API in a second terminal with `npm run dev:api`. The API health endpoint is available at `http://127.0.0.1:4000/api/v1/health`.

## Quality checks

- `npm run build` — generate the Prisma client and build the web and API applications
- `npm run typecheck` — verify strict TypeScript types
- `npm run lint` — run static analysis
- `npm test` — run the API foundation tests after a build

## Structure

- `app/` — React application and routes
- `server/` — Fastify REST API
- `prisma/` — PostgreSQL data model
- `tests/` — automated tests
- `public/` — static assets

Company discovery, web crawling, outreach, and exports remain outside Milestone 2.

## Domain intelligence

Milestone 2 adds normalized domain parsing, deterministic quality scoring, semantic expansion through a replaceable provider, industry ranking, business use cases, PostgreSQL caching, and the interactive analysis report. See [docs/api.md](docs/api.md) for the REST API.
