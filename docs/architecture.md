# Architecture

DomainHunter AI is a strict-TypeScript Next.js workspace backed by PostgreSQL and Prisma. Deterministic engines handle parsing, scoring, aggregation, monitoring, search, imports, exports, diagnostics, and maintenance. Narrative AI is optional, cached by input hash, and always separated from verified database information.

The system is split into domain intelligence, lead discovery connectors, valuation and buyer intelligence, continuous discovery, CRM research workspace, opportunity monitoring, platform operations, and the Plugin SDK. Background state is durable in PostgreSQL so work can recover after interruption.

Every schema change is represented by an ordered migration in `prisma/migrations`. API documentation is maintained in `docs/api.md`.
