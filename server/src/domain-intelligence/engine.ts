import { calculateMetrics } from "./domain-parser.ts";
import { enrichMeaning } from "./industry-engine.ts";
import { createQualityReport } from "./quality-report.ts";
import { calculateScores } from "./scoring.ts";
import type { SemanticProvider } from "./providers/semantic-provider.ts";
import type { DomainAnalysisDraft, ParsedDomain } from "./types.ts";

export class DomainIntelligenceEngine {
  constructor(private readonly semanticProvider: SemanticProvider) {}

  async analyze(parsed: ParsedDomain): Promise<DomainAnalysisDraft> {
    const semanticSeeds = await this.semanticProvider.expand({ domain: parsed });
    const semanticMeanings = semanticSeeds
      .filter((meaning, index, all) => all.findIndex((candidate) => candidate.phrase.toLowerCase() === meaning.phrase.toLowerCase()) === index)
      .sort((a, b) => b.confidence - a.confidence)
      .map(enrichMeaning);
    const metrics = calculateMetrics(parsed);
    const scores = calculateScores(parsed, metrics, semanticMeanings.length);

    return {
      parsed,
      metrics,
      scores,
      semanticMeanings,
      quality: createQualityReport(parsed, metrics, scores, semanticMeanings),
      analyzedAt: new Date().toISOString(),
    };
  }
}
