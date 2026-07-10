# DomainHunter Plugin SDK 1.0

Plugins provide a versioned manifest and implement `initialize`, `healthCheck`, and `shutdown`. Supported capabilities include public-data connectors, AI providers, buyer scoring, reports, dashboard widgets, exporters, analytics, notifications, background jobs, and domain analysis.

Installation validates the manifest before storing it. Requested permissions are denied by default and must be explicitly granted. Installing metadata never executes plugin code. Runtime hosts must load each enabled plugin in an isolated worker and provide only the granted capabilities.

The canonical TypeScript contract and manifest validator are in `server/src/plugins/sdk.ts`.

## Security

- API version must be `1.0`.
- Plugin keys and semantic versions are validated.
- Permissions are declared up front and denied by default.
- Secrets belong in encrypted integration settings, never plugin manifests.
- Network access is limited to public sources and their terms.
- Removal clears permissions and logs transactionally.
