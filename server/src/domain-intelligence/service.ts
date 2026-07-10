import { parseDomainInput } from "./domain-parser.ts";
import { DomainNotFoundError } from "./errors.ts";
import type { DomainIntelligenceEngine } from "./engine.ts";
import type { DomainAnalysisRepository } from "./repository.ts";
import type { AnalysisResult, DomainAnalysisRecord, HistoryPage } from "./types.ts";

export class DomainIntelligenceService {
  constructor(
    private readonly repository: DomainAnalysisRepository,
    private readonly engine: DomainIntelligenceEngine,
  ) {}

  async analyze(input: string, refresh = false): Promise<AnalysisResult> {
    const parsed = parseDomainInput(input);
    if (!refresh) {
      const cached = await this.repository.findByDomain(parsed.domain);
      if (cached) return { analysis: cached, cached: true };
    }

    const draft = await this.engine.analyze(parsed);
    return { analysis: await this.repository.save(draft), cached: false };
  }

  async get(id: string): Promise<DomainAnalysisRecord> {
    const analysis = await this.repository.findById(id);
    if (!analysis) throw new DomainNotFoundError(id);
    return analysis;
  }

  list(cursor: string | undefined, pageSize: number): Promise<HistoryPage> {
    return this.repository.list({ cursor, pageSize });
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw new DomainNotFoundError(id);
  }
}
