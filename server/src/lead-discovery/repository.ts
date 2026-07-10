import type { BuyerScore } from "./scoring.ts";
import type { DiscoveryQuery } from "./query-generator.ts";
import type { CompanyListItem, CompanyProfile, ConnectorStatusView, PersistResult, PublicCompanyRecord, ResultFilters, ScanView, SearchContext } from "./types.ts";

export type ScanRuntime = ScanView & { queryPlan: DiscoveryQuery[]; processedQueryKeys: string[] };
export type ResultsPage = { items: CompanyListItem[]; nextCursor: string | null; total: number };
export type ConnectorLogInput = { scanJobId: string; connectorId: string; query?: string; status: "STARTED" | "SUCCEEDED" | "RETRYING" | "FAILED" | "SKIPPED"; attempt?: number; durationMs?: number; recordsCollected?: number; errorMessage?: string; apiUsage?: Record<string, unknown> };

export interface LeadDiscoveryRepository {
  createScan(domainId: string, plan: DiscoveryQuery[], connectorStatus: ConnectorStatusView[]): Promise<ScanView>;
  getScan(id: string): Promise<ScanRuntime | null>;
  updateScan(id: string, patch: Partial<Pick<ScanView, "status" | "progress" | "processedQueries" | "companiesFound" | "duplicateMerges" | "estimatedSecondsLeft" | "connectorStatus" | "errors" | "startedAt" | "completedAt">> & { processedQueryKeys?: string[] }): Promise<ScanView>;
  log(input: ConnectorLogInput): Promise<void>;
  persist(records: PublicCompanyRecord[], connectorId: string, context: SearchContext, scanJobId: string, scores: BuyerScore[]): Promise<PersistResult>;
  listResults(scanJobId: string, filters: ResultFilters): Promise<ResultsPage>;
  getCompany(id: string): Promise<CompanyProfile | null>;
  updateCompany(id: string, patch: { bookmarked?: boolean; notes?: string | null }): Promise<CompanyProfile | null>;
  saveFilter(domainId: string | null, name: string, filters: ResultFilters): Promise<{ id: string; name: string; filters: ResultFilters }>;
  listFilters(domainId?: string): Promise<{ id: string; name: string; filters: ResultFilters }[]>;
  getCached(connectorId: string, queryKey: string): Promise<PublicCompanyRecord[] | null>;
  setCached(connectorId: string, queryKey: string, records: PublicCompanyRecord[], expiresAt: Date): Promise<void>;
}
