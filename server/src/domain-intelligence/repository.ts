import type { DomainAnalysisDraft, DomainAnalysisRecord, HistoryPage } from "./types.ts";

export type HistoryOptions = { cursor?: string; pageSize: number };

export interface DomainAnalysisRepository {
  findByDomain(domain: string): Promise<DomainAnalysisRecord | null>;
  findById(id: string): Promise<DomainAnalysisRecord | null>;
  save(draft: DomainAnalysisDraft): Promise<DomainAnalysisRecord>;
  list(options: HistoryOptions): Promise<HistoryPage>;
  delete(id: string): Promise<boolean>;
}
