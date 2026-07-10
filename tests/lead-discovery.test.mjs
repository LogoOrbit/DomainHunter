import assert from "node:assert/strict";
import test from "node:test";
import { BasePublicConnector } from "../server/dist/lead-discovery/connector.js";
import { dedupeKey, normalizeCompanyName } from "../server/dist/lead-discovery/normalization.js";
import { generateDiscoveryQueries } from "../server/dist/lead-discovery/query-generator.js";
import { scoreBuyer } from "../server/dist/lead-discovery/scoring.js";
import { LeadDiscoveryService } from "../server/dist/lead-discovery/service.js";

const analysis = {
  id: "domain-1", parsed: { domain: "ip.xyz", rootKeyword: "ip" },
  semanticMeanings: [{ phrase: "Internet Protocol", confidence: .98, industries: [{ name: "Networking" }, { name: "Cloud Infrastructure" }], useCases: [{ title: "IP lookup platform" }] }],
};

test("query generation expands semantic meanings without duplicates", () => {
  const queries = generateDiscoveryQueries(analysis);
  assert.ok(queries.some((item) => item.query === "Internet Protocol company"));
  assert.equal(new Set(queries.map((item) => item.key)).size, queries.length);
});

test("dedupe keys prefer official domains and scoring stays bounded", () => {
  const company = record();
  assert.equal(normalizeCompanyName("Example, Inc."), "example");
  assert.equal(dedupeKey(company), "domain:example.com");
  const score = scoreBuyer({ company, domain: "ip.xyz", rootKeyword: "ip", semanticPhrase: "Internet Protocol", semanticConfidence: .98, targetIndustries: ["Networking"] });
  assert.ok(score.buyerScore >= 0 && score.buyerScore <= 100);
  assert.match(score.matchReason, /semantic relevance/);
});

test("connector failure does not stop a scan", async () => {
  process.env.CONNECTOR_MAX_ATTEMPTS = "1";
  const repository = new MemoryLeadRepository();
  const service = new LeadDiscoveryService(repository, { get: async () => analysis }, [new SuccessfulConnector(), new FailingConnector()], { info() {}, warn() {}, error() {} });
  const scan = await service.start("domain-1");
  await service.run(scan.id);
  const completed = await service.getScan(scan.id);
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.companiesFound, 1);
  assert.ok(completed.errors.some((item) => item.includes("Failed source")));
});

class SuccessfulConnector extends BasePublicConnector {
  id = "success"; name = "Successful source";
  async search() { return { records: [{}], apiUsage: { requests: 1 } }; }
  normalize() { return record(); }
}
class FailingConnector extends BasePublicConnector {
  id = "failure"; name = "Failed source";
  async search() { throw new Error("source unavailable"); }
  normalize() { return null; }
}
class MemoryLeadRepository {
  scans = new Map(); sequence = 0; logs = []; seen = new Set();
  async createScan(domainId, plan, connectorStatus) { const now = new Date().toISOString(); const scan = { id: `scan-${++this.sequence}`, domainId, domain: "ip.xyz", status: "QUEUED", progress: 0, totalQueries: plan.length, processedQueries: 0, companiesFound: 0, duplicateMerges: 0, estimatedSecondsLeft: null, queryPlan: plan, processedQueryKeys: [], connectorStatus, errors: [], requestedAt: now, startedAt: null, completedAt: null }; this.scans.set(scan.id, scan); return scan; }
  async getScan(id) { return this.scans.get(id) ?? null; }
  async updateScan(id, patch) { const scan = { ...this.scans.get(id), ...patch }; this.scans.set(id, scan); return scan; }
  async log(value) { this.logs.push(value); }
  async persist(records) { let merged = 0; for (const item of records) { const key = dedupeKey(item); if (this.seen.has(key)) merged++; else this.seen.add(key); } return { saved: records.length, merged, companyIds: records.map((_, index) => `company-${index}`) }; }
  async getCached() { return null; }
  async setCached() {}
}
function record() { return { externalId: "1", name: "Example Networks, Inc.", website: "https://example.com", officialDomain: "example.com", industry: "Networking", description: "Cloud networking software and developer platform", country: null, state: null, city: null, headquarters: null, linkedinUrl: null, contactPage: null, companySize: null, fundingStage: null, latestFunding: null, contacts: [], keywords: ["networking", "cloud"], sourceUrl: "https://public.example.org/company", fieldOrigins: { name: "https://public.example.org/company" }, collectedAt: new Date().toISOString() }; }
