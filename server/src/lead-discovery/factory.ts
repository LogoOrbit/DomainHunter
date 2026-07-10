import { getDomainIntelligenceService } from "../domain-intelligence/factory.ts";
import { getPrisma } from "../domain-intelligence/prisma.ts";
import { GitHubOrganizationConnector } from "./connectors/github-connector.ts";
import { WikidataOrganizationConnector } from "./connectors/wikidata-connector.ts";
import { PrismaLeadDiscoveryRepository } from "./prisma-repository.ts";
import { LeadDiscoveryService } from "./service.ts";

let service: LeadDiscoveryService | undefined;
export function getLeadDiscoveryService(): LeadDiscoveryService {
  const connectors = [
    ...(process.env.ENABLE_GITHUB_CONNECTOR !== "false" ? [new GitHubOrganizationConnector()] : []),
    ...(process.env.ENABLE_WIKIDATA_CONNECTOR !== "false" ? [new WikidataOrganizationConnector()] : []),
  ];
  service ??= new LeadDiscoveryService(new PrismaLeadDiscoveryRepository(getPrisma()), getDomainIntelligenceService(), connectors);
  return service;
}
