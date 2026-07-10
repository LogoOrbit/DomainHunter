import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getPrisma } from "../domain-intelligence/prisma.ts";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const json = (value: unknown) => value as Prisma.InputJsonValue;
const common = (a: string[], b: string[]) => [...new Set(a)].filter((item) => new Set(b).has(item));

export class KnowledgeIntelligenceService {
  private db = getPrisma();

  async rebuild() {
    const domains = await this.db.domain.findMany({ include: { analysis: { include: { semanticMeanings: { include: { industries: { include: { industry: true } } } } } }, companyScores: { include: { company: { include: { industries: { include: { industry: true } }, keywords: true } } } } } });
    const inputHash = hash(domains.map((domain) => [domain.id, domain.updatedAt, domain.analysis?.updatedAt, domain.companyScores.map((score) => [score.companyId, score.scoredAt])]));
    const cached = await this.db.knowledgeGraph.findUnique({ where: { name: "private-portfolio" } });
    if (cached?.inputHash === inputHash) return cached;
    return this.db.$transaction(async (db) => {
      const graph = await db.knowledgeGraph.upsert({ where: { name: "private-portfolio" }, create: { name: "private-portfolio", inputHash }, update: { inputHash, version: { increment: 1 }, builtAt: new Date() } });
      const oldEdges = await db.entityRelationship.findMany({ where: { graphId: graph.id }, select: { id: true } });
      await db.relationshipScore.deleteMany({ where: { relationshipId: { in: oldEdges.map((edge) => edge.id) } } });
      await db.entityRelationship.deleteMany({ where: { graphId: graph.id } });
      let edgeCount = 0;
      const add = async (sourceType: string, sourceId: string, targetType: string, targetId: string, relation: string, score: number, evidence: unknown) => {
        const edge = await db.entityRelationship.create({ data: { graphId: graph.id, sourceType, sourceId, targetType, targetId, relation, evidence: json(evidence) } });
        await db.relationshipScore.create({ data: { relationshipId: edge.id, score, confidence: Math.min(95, 60 + Math.round(score * .35)), factors: json(evidence), inputHash: hash([sourceType, sourceId, targetType, targetId, relation, evidence]) } });
        edgeCount++;
      };
      for (const domain of domains) {
        for (const score of domain.companyScores) {
          await add("DOMAIN", domain.id, "COMPANY", score.companyId, "POTENTIAL_BUYER", score.buyerScore, { buyerScore: score.buyerScore, reason: score.matchReason });
          for (const industry of score.company.industries) await add("COMPANY", score.companyId, "INDUSTRY", industry.industryId, "OPERATES_IN", industry.relevance, { industry: industry.industry.name, sourceUrl: industry.sourceUrl });
          for (const keyword of score.company.keywords.slice(0, 20)) await add("COMPANY", score.companyId, "KEYWORD", keyword.keyword, "USES_KEYWORD", keyword.relevance, { keyword: keyword.keyword });
        }
        for (const meaning of domain.analysis?.semanticMeanings ?? []) {
          await add("DOMAIN", domain.id, "SEMANTIC_MEANING", meaning.id, "HAS_MEANING", Math.round(meaning.confidence * 100), { phrase: meaning.phrase });
          for (const industry of meaning.industries) await add("DOMAIN", domain.id, "INDUSTRY", industry.industryId, "RELEVANT_INDUSTRY", industry.relevance, { phrase: meaning.phrase, industry: industry.industry.name });
        }
      }
      for (let left = 0; left < domains.length; left++) for (let right = left + 1; right < domains.length; right++) {
        const a = domains[left]!, b = domains[right]!;
        const shared = { buyers: common(a.companyScores.map((score) => score.companyId), b.companyScores.map((score) => score.companyId)), industries: common(a.companyScores.flatMap((score) => score.company.industries.map((row) => row.industry.name)), b.companyScores.flatMap((score) => score.company.industries.map((row) => row.industry.name))), keywords: common(a.companyScores.flatMap((score) => score.company.keywords.map((row) => row.keyword)), b.companyScores.flatMap((score) => score.company.keywords.map((row) => row.keyword))) };
        const score = Math.min(100, shared.buyers.length * 18 + shared.industries.length * 10 + shared.keywords.length * 3);
        await db.portfolioRelationship.upsert({ where: { domainAId_domainBId_overlapType: { domainAId: a.id, domainBId: b.id, overlapType: "COMPOSITE" } }, create: { domainAId: a.id, domainBId: b.id, overlapType: "COMPOSITE", score, confidence: Math.min(95, 55 + score / 2), sharedItems: shared, inputHash: hash(shared) }, update: { score, confidence: Math.min(95, 55 + score / 2), sharedItems: shared, inputHash: hash(shared) } });
      }
      const rows = await db.entityRelationship.findMany({ where: { graphId: graph.id }, select: { sourceType: true, sourceId: true, targetType: true, targetId: true } });
      const entities = new Set(rows.flatMap((row) => [`${row.sourceType}:${row.sourceId}`, `${row.targetType}:${row.targetId}`]));
      return db.knowledgeGraph.update({ where: { id: graph.id }, data: { entityCount: entities.size, edgeCount } });
    }, { timeout: 60_000 });
  }

  async relationships(input: { entityType?: string; entityId?: string; relation?: string; take?: number }) {
    await this.rebuild();
    return this.db.entityRelationship.findMany({ where: { relation: input.relation, OR: input.entityId ? [{ sourceType: input.entityType, sourceId: input.entityId }, { targetType: input.entityType, targetId: input.entityId }] : undefined }, orderBy: { lastSeenAt: "desc" }, take: Math.min(input.take ?? 100, 500) });
  }

  async portfolio() {
    await this.rebuild();
    const [domains, valuations, scores, overlaps] = await Promise.all([this.db.domain.findMany(), this.db.valuation.findMany(), this.db.companyScore.findMany(), this.db.portfolioRelationship.findMany({ orderBy: { score: "desc" }, take: 50 })]);
    const values = new Map(valuations.map((item) => [item.domainId, item.fairEstimate]));
    const total = [...values.values()].reduce((sum, value) => sum + value, 0);
    const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score.buyerScore, 0) / scores.length) : 0;
    return { domainCount: domains.length, totalEstimatedValue: total, averageValuation: valuations.length ? Math.round(total / valuations.length) : 0, averageBuyerScore: averageScore, portfolioHealthScore: Math.min(100, Math.round((averageScore + valuations.length / Math.max(domains.length, 1) * 100) / 2)), domains: domains.map((domain) => ({ id: domain.id, domain: domain.displayName, valuation: values.get(domain.id) ?? null })), overlaps };
  }

  async recommendations() {
    const [buyers, valuations, changes] = await Promise.all([this.db.companyScore.findMany({ include: { company: true }, orderBy: { buyerScore: "desc" }, take: 100 }), this.db.valuation.findMany({ orderBy: { updatedAt: "asc" } }), this.db.companyChange.findMany({ orderBy: { detectedAt: "desc" }, take: 100 })]);
    const candidates = [buyers[0] ? { type: "BEST_BUYER_TODAY", entityType: "COMPANY", entityId: buyers[0].companyId, score: buyers[0].buyerScore, confidence: buyers[0].confidenceScore, title: `Contact ${buyers[0].company.name} first`, reasoning: buyers[0].matchReason, evidence: { scoreId: buyers[0].id } } : null, valuations[0] ? { type: "VALUATION_REFRESH", entityType: "DOMAIN", entityId: valuations[0].domainId, score: 75, confidence: 90, title: "Refresh the oldest valuation", reasoning: "This valuation is the least recently updated in the portfolio.", evidence: { valuationId: valuations[0].id, updatedAt: valuations[0].updatedAt } } : null, changes[0] ? { type: "RESEARCH_PRIORITY", entityType: "COMPANY", entityId: changes[0].companyId, score: changes[0].significance, confidence: 85, title: "Review a recently changed company", reasoning: `The ${changes[0].field} field changed and may affect buyer priority.`, evidence: { changeId: changes[0].id } } : null].filter((value): value is NonNullable<typeof value> => value !== null);
    for (const candidate of candidates) { const inputHash = hash(candidate.evidence); await this.db.recommendationHistory.upsert({ where: { recommendationType_inputHash: { recommendationType: candidate.type, inputHash } }, create: { recommendationType: candidate.type, entityType: candidate.entityType, entityId: candidate.entityId, score: candidate.score, confidence: candidate.confidence, title: candidate.title, reasoning: candidate.reasoning, evidence: candidate.evidence, inputHash }, update: { score: candidate.score, confidence: candidate.confidence, reasoning: candidate.reasoning } }); }
    return this.db.recommendationHistory.findMany({ orderBy: [{ score: "desc" }, { confidence: "desc" }], take: 50 });
  }

  async ask(input: { question: string; domainIds?: string[]; companyIds?: string[] }) {
    const [portfolio, recommendations, relationships] = await Promise.all([this.portfolio(), this.recommendations(), this.relationships({ take: 100 })]);
    const references = [...portfolio.domains.map((domain) => `domain:${domain.id}`), ...relationships.filter((edge) => edge.sourceType === "COMPANY").slice(0, 10).map((edge) => `company:${edge.sourceId}`)];
    const lower = input.question.toLowerCase();
    const answer = lower.includes("portfolio") || lower.includes("domain") ? `The portfolio contains ${portfolio.domainCount} domains with a combined estimated value of $${portfolio.totalEstimatedValue.toLocaleString()} and a health score of ${portfolio.portfolioHealthScore}/100.` : `The local knowledge graph contains ${relationships.length} relevant relationships. Highest current recommendation: ${recommendations[0]?.title ?? "none"}.`;
    const result = { answer, verifiedDatabaseInformation: true, aiReasoningUsed: false, internalReferences: [...new Set(references)], contextCompression: { duplicatesRemoved: true, externalSourcesUsed: false } };
    const inputHash = hash([input, result]);
    const cached = await this.db.knowledgeCache.findUnique({ where: { cacheType_entityType_entityId_inputHash: { cacheType: "RESEARCH_ANSWER", entityType: "PORTFOLIO", entityId: "private", inputHash } } });
    if (cached) return cached.content;
    await this.db.knowledgeCache.create({ data: { cacheType: "RESEARCH_ANSWER", entityType: "PORTFOLIO", entityId: "private", inputHash, content: result } });
    await this.db.researchMemory.upsert({ where: { memoryType_inputHash: { memoryType: "RESEARCH_ANSWER", inputHash } }, create: { memoryType: "RESEARCH_ANSWER", title: input.question.slice(0, 160), content: result, sourceIds: result.internalReferences, inputHash }, update: { content: result } });
    return result;
  }

  async syncTimeline() {
    const scans = await this.db.scanJob.findMany();
    for (const scan of scans) await this.db.intelligenceTimeline.upsert({ where: { eventType_entityType_entityId_sourceId: { eventType: "SCAN", entityType: "DOMAIN", entityId: scan.domainId, sourceId: scan.id } }, create: { eventType: "SCAN", entityType: "DOMAIN", entityId: scan.domainId, title: `Discovery scan ${scan.status}`, occurredAt: scan.requestedAt, sourceId: scan.id, details: { status: scan.status } }, update: { title: `Discovery scan ${scan.status}`, details: { status: scan.status } } });
    return this.db.intelligenceTimeline.findMany({ orderBy: { occurredAt: "desc" }, take: 200 });
  }

  async dashboard() {
    const [portfolio, recommendations, activity, opportunities, monitoring, workers, reminders, notes, health] = await Promise.all([this.portfolio(), this.recommendations(), this.syncTimeline(), this.db.opportunity.findMany({ where: { status: "OPEN" }, orderBy: { score: "desc" }, take: 10 }), this.db.monitoringJob.findMany({ orderBy: { requestedAt: "desc" }, take: 10 }), this.db.workerStatus.findMany({ orderBy: { lastHeartbeat: "desc" }, take: 10 }), this.db.reminder.findMany({ where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 10 }), this.db.companyNote.findMany({ where: { pinned: true }, orderBy: { updatedAt: "desc" }, take: 10 }), this.db.healthReport.findFirst({ orderBy: { createdAt: "desc" } })]);
    return { portfolio, recommendations, opportunities, monitoring, workers, upcomingReminders: reminders, pinnedNotes: notes, systemHealth: health, recentActivity: activity.slice(0, 20) };
  }

  rules() { return this.db.automationRule.findMany({ orderBy: [{ enabled: "desc" }, { priority: "desc" }] }); }
  createRule(input: { name: string; triggerType: string; conditions?: unknown; actions: unknown[]; priority?: number }) { return this.db.automationRule.create({ data: { name: input.name, triggerType: input.triggerType, conditions: json(input.conditions ?? {}), actions: json(input.actions), priority: input.priority ?? 50 } }); }
  async execute(input: { triggerType: string; eventId: string; companyId?: string; payload?: unknown }) {
    const rules = await this.db.automationRule.findMany({ where: { enabled: true, triggerType: input.triggerType }, orderBy: { priority: "desc" } });
    const executions = [];
    for (const rule of rules) {
      const previous = await this.db.automationExecution.findUnique({ where: { ruleId_eventId: { ruleId: rule.id, eventId: input.eventId } } });
      if (previous) { executions.push(previous); continue; }
      const results: Array<{ action: string; id?: string }> = [];
      for (const action of rule.actions as Array<{ type: string; title?: string; watchlistId?: string }>) {
        if (action.type === "CREATE_NOTIFICATION") { const item = await this.db.notification.create({ data: { type: "COMPANY_CHANGE", companyId: input.companyId, title: action.title ?? rule.name, message: `Automation rule ${rule.name} matched.`, data: json(input.payload ?? {}) } }); results.push({ action: action.type, id: item.id }); }
        if (action.type === "ADD_REMINDER") { const item = await this.db.reminder.create({ data: { companyId: input.companyId, title: action.title ?? `Review ${rule.name}`, dueAt: new Date(Date.now() + 86_400_000) } }); results.push({ action: action.type, id: item.id }); }
        if (action.type === "ADD_TO_WATCHLIST" && action.watchlistId && input.companyId) { const item = await this.db.watchlistItem.upsert({ where: { watchlistId_companyId: { watchlistId: action.watchlistId, companyId: input.companyId } }, create: { watchlistId: action.watchlistId, companyId: input.companyId }, update: {} }); results.push({ action: action.type, id: item.id }); }
      }
      const execution = await this.db.automationExecution.create({ data: { ruleId: rule.id, eventId: input.eventId, status: "COMPLETED", results, completedAt: new Date() } });
      await this.db.automationRule.update({ where: { id: rule.id }, data: { lastRunAt: new Date() } });
      await this.db.auditEvent.create({ data: { action: "AUTOMATION_EXECUTED", entityType: "AUTOMATION_RULE", entityId: rule.id, outcome: "COMPLETED", metadata: { eventId: input.eventId, actionCount: results.length } } });
      executions.push(execution);
    }
    return executions;
  }
}
let service: KnowledgeIntelligenceService | undefined;
export const getKnowledgeIntelligenceService = () => service ??= new KnowledgeIntelligenceService();
