import type { DomainIntelligenceService } from "../domain-intelligence/service.ts";
import type { PublicLeadConnector } from "./connector.ts";
import { LeadDiscoveryError } from "./errors.ts";
import { positiveInt } from "./public-http.ts";
import { generateDiscoveryQueries } from "./query-generator.ts";
import type { LeadDiscoveryRepository, ResultsPage } from "./repository.ts";
import { scoreBuyer } from "./scoring.ts";
import type { CompanyProfile, ConnectorStatusView, ResultFilters, ScanView, SearchContext } from "./types.ts";

export class LeadDiscoveryService {
  private readonly active = new Map<string, AbortController>();

  constructor(
    private readonly repository: LeadDiscoveryRepository,
    private readonly domainService: DomainIntelligenceService,
    private readonly connectors: PublicLeadConnector[],
    private readonly logger: Pick<Console, "info" | "error" | "warn"> = console,
  ) {}

  async start(domainId: string): Promise<ScanView> {
    if (!this.connectors.length) throw new LeadDiscoveryError("NO_CONNECTORS", "At least one public data connector must be enabled", 503);
    const analysis = await this.domainService.get(domainId);
    const plan = generateDiscoveryQueries(analysis);
    if (!plan.length) throw new LeadDiscoveryError("NO_SEARCH_QUERIES", "The domain analysis did not produce discovery queries", 422);
    const status = this.connectors.map((connector): ConnectorStatusView => ({ id: connector.id, name: connector.name, health: "idle", error: null, records: 0 }));
    return this.repository.createScan(domainId, plan, status);
  }

  async run(scanId: string): Promise<void> {
    if (this.active.has(scanId)) return;
    const controller = new AbortController();
    this.active.set(scanId, controller);
    try {
      let scan = await this.requiredScan(scanId);
      if (["COMPLETED", "CANCELLED"].includes(scan.status)) return;
      const analysis = await this.domainService.get(scan.domainId);
      let connectorStatus = scan.connectorStatus;
      await Promise.all(this.connectors.map(async (connector) => {
        try { await connector.initialize(); connectorStatus = updateConnector(connectorStatus, connector.id, { health: connector.health(), error: null }); }
        catch (error) { connectorStatus = updateConnector(connectorStatus, connector.id, { health: "offline", error: message(error) }); }
      }));
      scan = { ...scan, ...(await this.repository.updateScan(scanId, { status: "RUNNING", startedAt: scan.startedAt ?? new Date().toISOString(), connectorStatus })) };
      const started = Date.now();
      let found = scan.companiesFound;
      let merged = scan.duplicateMerges;
      const processed = new Set(scan.processedQueryKeys);
      const errors = [...scan.errors];

      for (const query of scan.queryPlan) {
        if (processed.has(query.key)) continue;
        const current = await this.requiredScan(scanId);
        if (current.status === "PAUSED" || current.status === "CANCELLED" || controller.signal.aborted) return;
        const context: SearchContext = { query: query.query, domainId: scan.domainId, domain: analysis.parsed.domain, rootKeyword: analysis.parsed.rootKeyword, semanticPhrase: query.semanticPhrase, semanticConfidence: query.semanticConfidence, targetIndustries: query.targetIndustries, signal: controller.signal };
        const outcomes = await Promise.allSettled(this.connectors.map((connector) => this.executeConnector(connector, context, scanId)));
        if (controller.signal.aborted || ["PAUSED", "CANCELLED"].includes((await this.requiredScan(scanId)).status)) return;
        outcomes.forEach((outcome, index) => {
          const connector = this.connectors[index]!;
          if (outcome.status === "fulfilled") {
            found += outcome.value.saved - outcome.value.merged;
            merged += outcome.value.merged;
            connectorStatus = updateConnector(connectorStatus, connector.id, { health: connector.health(), error: null, records: (connectorStatus.find((item) => item.id === connector.id)?.records ?? 0) + outcome.value.saved });
          } else {
            const error = `${connector.name}: ${message(outcome.reason)}`;
            errors.push(error);
            connectorStatus = updateConnector(connectorStatus, connector.id, { health: "degraded", error });
          }
        });
        processed.add(query.key);
        const processedQueries = processed.size;
        const progress = Math.round(processedQueries / scan.totalQueries * 100);
        const elapsedSeconds = Math.max(1, (Date.now() - started) / 1_000);
        const estimatedSecondsLeft = Math.max(0, Math.round((elapsedSeconds / Math.max(1, processedQueries - scan.processedQueries)) * (scan.totalQueries - processedQueries)));
        await this.repository.updateScan(scanId, { progress, processedQueries, processedQueryKeys: [...processed], companiesFound: found, duplicateMerges: merged, estimatedSecondsLeft, connectorStatus, errors: errors.slice(-100) });
      }
      await this.repository.updateScan(scanId, { status: "COMPLETED", progress: 100, estimatedSecondsLeft: 0, completedAt: new Date().toISOString(), connectorStatus, errors: errors.slice(-100) });
    } catch (error) {
      if (!controller.signal.aborted) {
        this.logger.error(error);
        await this.repository.updateScan(scanId, { status: "FAILED", completedAt: new Date().toISOString(), errors: [message(error)] }).catch(() => undefined);
      }
    } finally {
      await Promise.allSettled(this.connectors.map((connector) => connector.shutdown()));
      this.active.delete(scanId);
    }
  }

  async getScan(id: string): Promise<ScanView> { return this.requiredScan(id); }
  async pause(id: string): Promise<ScanView> { const scan = await this.requiredScan(id); if (scan.status !== "RUNNING" && scan.status !== "QUEUED") throw new LeadDiscoveryError("INVALID_SCAN_STATE", "Only queued or running scans can be paused", 409); this.active.get(id)?.abort("paused"); return this.repository.updateScan(id, { status: "PAUSED", estimatedSecondsLeft: null }); }
  async resume(id: string): Promise<ScanView> { const scan = await this.requiredScan(id); if (scan.status !== "PAUSED" && scan.status !== "FAILED") throw new LeadDiscoveryError("INVALID_SCAN_STATE", "Only paused or failed scans can be resumed", 409); return this.repository.updateScan(id, { status: "QUEUED", completedAt: null }); }
  async cancel(id: string): Promise<ScanView> { const scan = await this.requiredScan(id); if (["COMPLETED", "CANCELLED"].includes(scan.status)) throw new LeadDiscoveryError("INVALID_SCAN_STATE", "Scan is already finished", 409); this.active.get(id)?.abort("cancelled"); return this.repository.updateScan(id, { status: "CANCELLED", estimatedSecondsLeft: null, completedAt: new Date().toISOString() }); }
  results(id: string, filters: ResultFilters): Promise<ResultsPage> { return this.repository.listResults(id, filters); }
  async company(id: string): Promise<CompanyProfile> { const company = await this.repository.getCompany(id); if (!company) throw new LeadDiscoveryError("COMPANY_NOT_FOUND", "Company was not found", 404); return company; }
  async updateCompany(id: string, patch: { bookmarked?: boolean; notes?: string | null }): Promise<CompanyProfile> { const company = await this.repository.updateCompany(id, patch); if (!company) throw new LeadDiscoveryError("COMPANY_NOT_FOUND", "Company was not found", 404); return company; }
  saveFilter(domainId: string | null, name: string, filters: ResultFilters) { if (!name.trim()) throw new LeadDiscoveryError("INVALID_FILTER", "Filter name is required"); return this.repository.saveFilter(domainId, name.trim(), filters); }
  listFilters(domainId?: string) { return this.repository.listFilters(domainId); }

  private async executeConnector(connector: PublicLeadConnector, context: SearchContext, scanJobId: string) {
    const maximumAttempts = positiveInt(process.env.CONNECTOR_MAX_ATTEMPTS, 3);
    let lastError: unknown;
    for (let attempt = 1; attempt <= maximumAttempts; attempt++) {
      const started = Date.now();
      await this.repository.log({ scanJobId, connectorId: connector.id, query: context.query, status: attempt === 1 ? "STARTED" : "RETRYING", attempt });
      try {
        const queryKey = `${context.semanticPhrase.toLowerCase()}:${context.query.toLowerCase()}`;
        const cached = await this.repository.getCached(connector.id, queryKey);
        const raw = cached ? { records: cached, apiUsage: { cache: "hit", requests: 0 } } : await connector.search(context);
        const records = cached ?? raw.records.map((item) => connector.normalize(item, context)).filter((item): item is NonNullable<typeof item> => item !== null && connector.validate(item));
        if (!cached) await this.repository.setCached(connector.id, queryKey, records, new Date(Date.now() + positiveInt(process.env.CONNECTOR_CACHE_TTL_SECONDS, 86_400) * 1_000));
        const scores = records.map((company) => scoreBuyer({ company, domain: context.domain, rootKeyword: context.rootKeyword, semanticPhrase: context.semanticPhrase, semanticConfidence: context.semanticConfidence, targetIndustries: context.targetIndustries }));
        const result = await connector.save(records, context, { persist: (items, connectorId, searchContext) => this.repository.persist(items, connectorId, searchContext, scanJobId, scores) });
        await this.repository.log({ scanJobId, connectorId: connector.id, query: context.query, status: "SUCCEEDED", attempt, durationMs: Date.now() - started, recordsCollected: records.length, apiUsage: raw.apiUsage });
        return result;
      } catch (error) {
        lastError = error;
        await this.repository.log({ scanJobId, connectorId: connector.id, query: context.query, status: attempt === maximumAttempts ? "FAILED" : "RETRYING", attempt, durationMs: Date.now() - started, errorMessage: message(error) });
        if (context.signal.aborted) throw error;
        if (attempt < maximumAttempts) await wait(Math.min(5_000, 400 * 2 ** (attempt - 1)), context.signal);
      }
    }
    throw lastError;
  }

  private async requiredScan(id: string) { const scan = await this.repository.getScan(id); if (!scan) throw new LeadDiscoveryError("SCAN_NOT_FOUND", "Scan was not found", 404); return scan; }
}

function updateConnector(items: ConnectorStatusView[], id: string, patch: Partial<ConnectorStatusView>): ConnectorStatusView[] { return items.map((item) => item.id === id ? { ...item, ...patch } : item); }
function message(error: unknown): string { return error instanceof Error ? error.message.slice(0, 2_000) : "Unknown connector error"; }
function wait(ms: number, signal: AbortSignal): Promise<void> { return new Promise((resolve, reject) => { const timer = setTimeout(resolve, ms); signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true }); }); }
