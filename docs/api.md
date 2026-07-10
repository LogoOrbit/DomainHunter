# Domain Intelligence API

## Valuation and buyer intelligence

- `POST /api/valuation/run` — generate or retrieve a cached valuation; accepts `domainId` and optional `refresh`.
- `GET /api/valuation/:domainId` — retrieve the latest valuation.
- `GET /api/buyers/rankings?domainId=...` — generate and retrieve explainable buyer rankings.
- `GET /api/outreach/templates` — list editable draft templates.
- `POST /api/outreach/generate` — create a draft message. Messages are never sent automatically.
- `POST /api/negotiation/generate` — create a valuation-backed negotiation plan.
- `GET /api/analytics/domain/:domainId` — retrieve current and historical analytics snapshots.

## Continuous discovery

- `POST /api/scans/start` — enqueue a durable scan with optional priority.
- `POST /api/scans/pause`, `/resume`, `/cancel` — control a scan by `scanId`.
- `GET /api/scans/status?id=...` — retrieve one scan; omit `id` for queue, worker, and recent scan state.
- `GET /api/connectors` and `GET /api/connectors/health` — connector registry and health checks.
- `GET /api/notifications` — recent discovery notifications.
- `GET /api/company/changes/:companyId` — detected public company changes.

## Research workspace and CRM

- `GET|POST /api/projects` and `PUT|DELETE /api/projects/:id` — manage independent research projects.
- `GET /api/companies/:id` — detailed public company intelligence, timeline, notes, CRM state, and buyer reasoning.
- `POST /api/company/notes` — add private Markdown research notes.
- `GET|POST /api/watchlists`, `/api/saved-searches`, and `/api/reminders` — organize reusable research.
- `GET /api/search?q=...` — partial and multi-term global workspace search.
- `POST /api/companies/compare` — compare up to eight companies.
- `PUT /api/leads/:id` — update CRM status, priority, follow-up, favorite, and manual score.
- `GET /api/activity` and `/api/favorites` — audit activity and prioritized leads.

## Opportunity monitoring

- `POST /api/monitoring/start` and `/api/monitoring/stop` — start or cancel an incremental monitoring cycle.
- `GET /api/monitoring/status` — recent monitoring jobs and progress.
- `GET|POST /api/monitoring/rules` — configure domain frequency, priority, thresholds, exclusions, and concurrency.
- `GET /api/opportunities` and `/api/recommendations` — paginated, ranked opportunity intelligence.
- `GET /api/alerts` and `POST /api/alerts/preferences` — alerts and per-type delivery preferences.
- `GET /api/trends` — historical buyer, industry, and country snapshots.

## Platform and final release

- `GET /api/integrations`, `POST /api/integrations/configure` — isolated integration configuration with encrypted credentials.
- `GET /api/scoring/profiles`, `POST /api/scoring/profile`, `PUT /api/scoring/profile/:id` — normalized scoring weights.
- `GET /api/analytics`, `/api/reports`, `/api/comparisons`; `POST /api/reports/generate` — deterministic analytics and cached reports.
- `GET /api/workspace`, `POST /api/workspace/query` — database-first research with verified information separated from reasoning.
- `GET /api/backups`, `POST /api/backups/create`, `/api/backups/restore` — checksummed backups and confirmation-gated restore validation.
- `GET|PUT /api/settings` — settings and preferences.
- `GET /api/system/health`, `/api/system/resources`, `/api/system/version`; `POST /api/system/maintenance` — production operations.
- `GET /api/plugins`, `POST /api/plugins/install`, `PUT|DELETE /api/plugins/:id` — Plugin SDK lifecycle and deny-by-default permissions.
- `POST /api/import`, `/api/export` — validated JSON/CSV transfer with duplicate detection and history.
- `GET /api/errors`, `/api/diagnostics` — centralized diagnostics.

## Knowledge and decision intelligence

- `GET|POST /api/knowledge/graph` — rebuild or query the private logical knowledge graph.
- `POST /api/knowledge/ask` — answer from compressed local context with internal record citations.
- `GET /api/portfolio` — portfolio value, health, and cross-domain overlap.
- `GET /api/intelligence/recommendations` — confidence-scored Recommendation Engine v2 history.
- `GET /api/intelligence/dashboard` — unified opportunities, portfolio, monitoring, activity, reminders, notes, and health.
- `GET /api/timeline` — permanent research history.
- `GET|POST /api/automation/rules` — user-configurable private workflow rules.
- `POST /api/automation/execute` — idempotently execute matching rules for a private event.

All responses use JSON except successful deletion, which returns no body. Validation failures use `{ "error": { "code": string, "message": string } }`.

## Analyze a domain

`POST /api/domain/analyze`

```json
{
  "domain": "ip.xyz",
  "refresh": false
}
```

The response contains `analysis` and a `cached` boolean. The first request normalizes, analyzes, and stores the domain. Later requests return the stored report unless `refresh` is `true`.

## Get an analysis

`GET /api/domain/:id`

Returns the stored analysis for a domain ID.

## Analysis history

`GET /api/domain/history?cursor=<domain-id>&pageSize=50`

Returns `{ "items": [...], "nextCursor": string | null }`. Pagination defaults and maximum page size are configured through environment variables.

## Delete a domain

`DELETE /api/domain/:id`

Deletes the domain and its analysis, semantic meanings, industry relationships, and use cases. Returns `204 No Content`.

## Report shape

Each analysis includes normalized domain parts, deterministic quality metrics, scores from 0–100, ranked semantic meanings, ranked industries, realistic use cases, strengths, weaknesses, opportunities, risks, ideal buyer profile, and global-market suitability.

## Public lead discovery

- `POST /api/discovery/scans` with `{ "domainId": "..." }` queues a scan.
- `GET /api/discovery/scans/:id` returns live progress and connector health.
- `POST /api/discovery/scans/:id/pause`, `/resume`, or `/cancel` controls a scan.
- `GET /api/discovery/scans/:id/results` returns cursor-paginated companies. Supported filters include `search`, `country`, `industry`, `minBuyerScore`, `minConfidence`, `companySize`, `fundingStage`, and `keyword`.
- `GET /api/companies/:id` returns the public-evidence company profile.
- `PATCH /api/companies/:id` updates `bookmarked` and private `notes` fields.
- `GET` and `POST /api/discovery/filters` list and save result filter presets.

The first connectors use GitHub Organizations and Wikidata. They collect only public API responses, enforce endpoint allowlists, use configurable request pacing and retries, and preserve source URLs for every record.
