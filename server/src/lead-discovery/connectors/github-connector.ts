import { BasePublicConnector } from "../connector.ts";
import { extractKeywords, inferIndustry, normalizedWebsite } from "../normalization.ts";
import { fetchPublicJson, positiveInt, RateLimiter, sanitizeText } from "../public-http.ts";
import type { ConnectorSearchResult, PublicCompanyRecord, SearchContext } from "../types.ts";

type GitHubSearch = { total_count: number; items: { login: string; url: string; html_url: string }[] };
type GitHubOrg = { id: number; login: string; name: string | null; html_url: string; blog: string | null; location: string | null; email: string | null; description: string | null; public_repos: number; followers: number };

export class GitHubOrganizationConnector extends BasePublicConnector {
  readonly id = "github-organizations";
  readonly name = "GitHub Organizations";
  private readonly limiter = new RateLimiter(positiveInt(process.env.GITHUB_CONNECTOR_INTERVAL_MS, 450));

  async search(context: SearchContext): Promise<ConnectorSearchResult> {
    const limit = positiveInt(process.env.GITHUB_RESULTS_PER_QUERY, 5);
    await this.limiter.wait(context.signal);
    const url = new URL("https://api.github.com/search/users");
    url.searchParams.set("q", `${context.query.slice(0, 180)} type:org`);
    url.searchParams.set("per_page", String(Math.min(limit, 20)));
    const headers: Record<string, string> = { "x-github-api-version": "2022-11-28" };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const search = await fetchPublicJson<GitHubSearch>(url, ["api.github.com"], context.signal, headers);
    const details: GitHubOrg[] = [];
    for (const item of search.data.items.slice(0, limit)) {
      await this.limiter.wait(context.signal);
      const detail = await fetchPublicJson<GitHubOrg>(new URL(item.url), ["api.github.com"], context.signal, headers);
      details.push(detail.data);
    }
    return { records: details, apiUsage: { requests: details.length + 1, remaining: search.headers.get("x-ratelimit-remaining") } };
  }

  normalize(raw: unknown, context: SearchContext): PublicCompanyRecord | null {
    const org = raw as Partial<GitHubOrg>;
    const name = sanitizeText(org.name ?? org.login, 200);
    const sourceUrl = sanitizeText(org.html_url, 1_000);
    if (!name || !sourceUrl || !org.id) return null;
    const description = sanitizeText(org.description);
    const web = normalizedWebsite(sanitizeText(org.blog, 1_000));
    const location = sanitizeText(org.location, 300);
    const publicEmail = sanitizeText(org.email, 320);
    const email = publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(publicEmail) ? publicEmail : null;
    return {
      externalId: String(org.id), name, website: web.website, officialDomain: web.domain,
      industry: inferIndustry(description), description, country: null, state: null, city: null,
      headquarters: location, linkedinUrl: null, contactPage: null, companySize: sizeFromFollowers(org.followers),
      fundingStage: null, latestFunding: null,
      contacts: email ? [{ type: "BUSINESS_EMAIL", name: null, title: null, value: email, sourceUrl }] : [],
      keywords: extractKeywords(description, context.query), sourceUrl,
      fieldOrigins: Object.fromEntries(["name", "description", "website", "headquarters", "companySize"].map((field) => [field, sourceUrl])),
      collectedAt: new Date().toISOString(),
    };
  }
}

function sizeFromFollowers(followers: number | undefined): string | null {
  if (typeof followers !== "number") return null;
  if (followers >= 10_000) return "Large public community";
  if (followers >= 1_000) return "Established public community";
  if (followers >= 100) return "Growing public community";
  return null;
}
