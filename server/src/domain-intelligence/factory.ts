import { DomainIntelligenceEngine } from "./engine.ts";
import { getPrisma } from "./prisma.ts";
import { PrismaDomainAnalysisRepository } from "./prisma-repository.ts";
import { LexiconSemanticProvider } from "./providers/lexicon-semantic-provider.ts";
import { DomainIntelligenceService } from "./service.ts";

let service: DomainIntelligenceService | undefined;

export function getDomainIntelligenceService(): DomainIntelligenceService {
  service ??= new DomainIntelligenceService(
    new PrismaDomainAnalysisRepository(getPrisma()),
    new DomainIntelligenceEngine(new LexiconSemanticProvider()),
  );
  return service;
}
