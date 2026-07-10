import { BasePublicConnector } from "../connector.ts";
import { extractKeywords, inferIndustry } from "../normalization.ts";
import { fetchPublicJson, positiveInt, RateLimiter, sanitizeText } from "../public-http.ts";
import type { ConnectorSearchResult, PublicCompanyRecord, SearchContext } from "../types.ts";

type WikidataSearch = { search: { id: string; label: string; description?: string; concepturi: string }[] };
const ORG_PATTERN = /company|corporation|organization|business|startup|software|technology|provider|firm|agency|laborator|institute|foundation|manufacturer|enterprise/i;

export class WikidataOrganizationConnector extends BasePublicConnector {
  readonly id = "wikidata-organizations";
  readonly name = "Wikidata Organizations";
  private readonly limiter = new RateLimiter(positiveInt(process.env.WIKIDATA_CONNECTOR_INTERVAL_MS, 350));

  async search(context: SearchContext): Promise<ConnectorSearchResult> {
    await this.limiter.wait(context.signal);
    const limit = Math.min(positiveInt(process.env.WIKIDATA_RESULTS_PER_QUERY, 10), 25);
    const url = new URL("https://www.wikidata.org/w/api.php");
    for (const [key, value] of Object.entries({ action: "wbsearchentities", search: context.query.slice(0, 200), language: "en", uselang: "en", type: "item", format: "json", limit: String(limit), origin: "*" })) url.searchParams.set(key, value);
    const response = await fetchPublicJson<WikidataSearch>(url, ["www.wikidata.org"], context.signal);
    return { records: response.data.search, apiUsage: { requests: 1, returned: response.data.search.length } };
  }

  normalize(raw: unknown, context: SearchContext): PublicCompanyRecord | null {
    const item = raw as Partial<WikidataSearch["search"][number]>;
    const name = sanitizeText(item.label, 200);
    const description = sanitizeText(item.description);
    const sourceUrl = sanitizeText(item.concepturi, 1_000);
    if (!name || !sourceUrl || !item.id || !description || !ORG_PATTERN.test(description)) return null;
    return {
      externalId: item.id, name, website: null, officialDomain: null, industry: inferIndustry(description), description,
      country: null, state: null, city: null, headquarters: null, linkedinUrl: null, contactPage: null,
      companySize: null, fundingStage: null, latestFunding: null, contacts: [], keywords: extractKeywords(description, context.query),
      sourceUrl, fieldOrigins: { name: sourceUrl, description: sourceUrl }, collectedAt: new Date().toISOString(),
    };
  }
}
