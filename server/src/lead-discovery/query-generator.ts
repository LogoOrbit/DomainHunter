import { positiveInt } from "./public-http.ts";
import type { DomainAnalysisRecord } from "../domain-intelligence/types.ts";

export type DiscoveryQuery = {
  key: string;
  query: string;
  semanticPhrase: string;
  semanticConfidence: number;
  targetIndustries: string[];
};

export function generateDiscoveryQueries(analysis: DomainAnalysisRecord): DiscoveryQuery[] {
  const meaningLimit = positiveInt(process.env.DISCOVERY_MEANINGS_PER_SCAN, 5);
  const queryLimit = positiveInt(process.env.DISCOVERY_QUERIES_PER_MEANING, 5);
  const queries: DiscoveryQuery[] = [];
  for (const meaning of analysis.semanticMeanings.slice(0, meaningLimit)) {
    const industries = meaning.industries.slice(0, 4).map((industry) => industry.name);
    const candidates = [
      `${meaning.phrase} software`, `${meaning.phrase} company`, `${meaning.phrase} startup`,
      `${meaning.phrase} SaaS`, `${meaning.phrase} platform`, ...industries.slice(0, 3),
      ...meaning.useCases.slice(0, 2).map((useCase) => useCase.title),
    ];
    for (const query of [...new Set(candidates)].slice(0, queryLimit)) {
      queries.push({ key: `${meaning.phrase.toLowerCase()}:${query.toLowerCase()}`, query, semanticPhrase: meaning.phrase, semanticConfidence: meaning.confidence, targetIndustries: industries });
    }
  }
  return queries;
}
