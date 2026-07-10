# Domain Intelligence API

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
