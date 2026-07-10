import { createHash } from "node:crypto";
import { getPrisma } from "../domain-intelligence/prisma.ts";

const templates = [
  ["cold-email", "Cold email", "EMAIL", "A strategic domain for {{company}}", "Hi {{contact}},\n\n{{domain}} is a strong fit for {{company}} because {{reason}}. Would you be open to a brief conversation about acquiring it?\n\nBest,\n{{sender}}"],
  ["short-email", "Short email", "EMAIL", "{{domain}}", "Hi {{contact}}, would {{company}} be interested in acquiring {{domain}}? Its strongest fit is {{reason}}. — {{sender}}"],
  ["premium-buyer-email", "Premium buyer email", "EMAIL", "Premium acquisition opportunity: {{domain}}", "Hi {{contact}},\n\nI am reaching out privately regarding {{domain}}, a premium digital asset aligned with {{company}}. {{reason}}. If relevant, I can share pricing guidance and a secure transfer process.\n\n{{sender}}"],
  ["executive-email", "Executive email", "EMAIL", "Strategic asset for {{company}}", "Hi {{contact}},\n\n{{domain}} could strengthen {{company}}'s category positioning. {{reason}}. Is this worth routing to the person responsible for brand or digital assets?\n\n{{sender}}"],
  ["linkedin-message", "LinkedIn message", "LINKEDIN", null, "Hi {{contact}} — I own {{domain}}, which appears strategically relevant to {{company}}: {{reason}}. Open to a quick conversation?"],
  ["contact-form", "Contact form", "CONTACT_FORM", "Domain acquisition inquiry", "I am the owner of {{domain}}. It may be valuable to {{company}} because {{reason}}. Please forward this to your brand, partnerships, or corporate development team. Contact: {{sender}}."],
  ["follow-up-1", "Follow-up 1", "EMAIL", "Re: {{domain}}", "Hi {{contact}}, following up on {{domain}}. I believe the strategic fit with {{company}} is unusually strong. Happy to share a concise valuation and transfer plan. — {{sender}}"],
  ["follow-up-2", "Follow-up 2", "EMAIL", "Quick follow-up: {{domain}}", "Hi {{contact}}, one final detail on {{domain}}: {{reason}}. If another team owns domain acquisitions, I would appreciate a referral. — {{sender}}"],
  ["final-follow-up", "Final follow-up", "EMAIL", "Closing the loop on {{domain}}", "Hi {{contact}}, I am closing the loop on {{domain}}. If it is not a current priority, no reply is needed. I will keep {{company}} in mind before approaching other aligned buyers. — {{sender}}"],
] as const;

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export class IntelligenceService {
  private db = getPrisma();

  async runValuation(domainId: string, force = false) {
    const domain = await this.db.domain.findUnique({ where: { id: domainId }, include: { analysis: true, companyScores: true } });
    if (!domain?.analysis) throw new Error("Analyzed domain not found");
    const a = domain.analysis;
    const inputHash = hash([a.updatedAt, domain.companyScores.map((score) => [score.companyId, score.buyerScore, score.scoredAt])]);
    const cached = await this.db.valuation.findUnique({ where: { domainId } });
    if (!force && cached?.inputHash === inputHash) return cached;
    const tldWeight = ({ com: 1.8, ai: 1.55, io: 1.45, co: 1.3, xyz: 1.05 } as Record<string, number>)[domain.tld] ?? 0.9;
    const quality = (a.brandabilityScore + a.memorabilityScore + a.commercialPotential + a.premiumScore + a.globalUsability) / 5;
    const demand = domain.companyScores.length ? domain.companyScores.reduce((sum, item) => sum + item.buyerScore, 0) / domain.companyScores.length : 35;
    const fair = Math.max(500, Math.round((quality ** 2 * tldWeight + demand * 85) / 25) * 25);
    const data = {
      inputHash, lowEstimate: Math.round(fair * .62), fairEstimate: fair, premiumEstimate: Math.round(fair * 1.85),
      investorEstimate: Math.round(fair * .48), endUserEstimate: Math.round(fair * 1.25), confidence: clamp(55 + domain.companyScores.length * 2),
      components: { quality: clamp(quality), demand: clamp(demand), extensionMultiplier: tldWeight, buyerCount: domain.companyScores.length },
      comparables: [], verifiedPublicData: { comparableSales: [], note: "No verified public comparable sales were supplied." },
      aiEstimate: { method: "Deterministic weighted scoring model", assumptions: ["USD pricing", "Clean ownership and transferable domain", "No trademark conflicts"] },
      explanation: { summary: `${domain.displayName} combines a ${clamp(quality)}/100 quality profile with ${domain.companyScores.length} identified buyer signals.`, confidenceFactors: ["Domain quality metrics", "Extension strength", "Observed buyer demand"] },
      opportunityReport: { strengths: a.strengths, weaknesses: a.weaknesses, opportunities: a.opportunities, risks: a.risks, idealBuyerProfile: a.idealBuyerProfile },
    };
    const saved = await this.db.valuation.upsert({ where: { domainId }, create: { domainId, ...data }, update: data });
    if (!cached || cached.fairEstimate !== fair) await this.db.pricingHistory.create({ data: { domainId, valuationId: saved.id, lowEstimate: data.lowEstimate, fairEstimate: fair, premiumEstimate: data.premiumEstimate } });
    await this.rankBuyers(domainId, inputHash);
    await this.snapshot(domainId, inputHash);
    return saved;
  }

  async getValuation(domainId: string) { return this.db.valuation.findUnique({ where: { domainId } }); }

  async rankBuyers(domainId: string, suppliedHash?: string) {
    const rows = await this.db.companyScore.findMany({ where: { domainId }, include: { company: true }, orderBy: { buyerScore: "desc" } });
    const inputHash = suppliedHash ?? hash(rows.map((row) => [row.id, row.buyerScore, row.scoredAt]));
    for (const [index, row] of rows.entries()) {
      const probability = clamp(row.buyerScore * .55 + row.companyStrength * .2 + row.confidenceScore * .25);
      const explanation = { reasons: [row.matchReason, `${row.industryMatch}/100 industry match`, `${row.semanticRelevance}/100 semantic relevance`], risks: row.confidenceScore < 60 ? ["Limited public evidence"] : [], suggestedAngle: `Position the domain as a category-defining asset for ${row.company.name}.`, scoreDetails: { existingBuyerScore: row.buyerScore, confidence: row.confidenceScore } };
      const ranking = await this.db.buyerRanking.upsert({ where: { domainId_companyId: { domainId, companyId: row.companyId } }, create: { domainId, companyId: row.companyId, inputHash, rank: index + 1, segment: row.buyerScore >= 80 ? "Priority" : row.buyerScore >= 60 ? "Qualified" : "Watch", buyerFit: row.buyerScore, strategicRelevance: clamp((row.semanticRelevance + row.industryMatch) / 2), businessModelFit: row.businessModelFit, semanticAlignment: row.semanticRelevance, commercialPotential: clamp((row.companyStrength + row.technologyMatch) / 2), acquisitionProbability: probability, outreachPriority: clamp((row.buyerScore + probability) / 2), explanation }, update: { inputHash, rank: index + 1, segment: row.buyerScore >= 80 ? "Priority" : row.buyerScore >= 60 ? "Qualified" : "Watch", buyerFit: row.buyerScore, strategicRelevance: clamp((row.semanticRelevance + row.industryMatch) / 2), businessModelFit: row.businessModelFit, semanticAlignment: row.semanticRelevance, commercialPotential: clamp((row.companyStrength + row.technologyMatch) / 2), acquisitionProbability: probability, outreachPriority: clamp((row.buyerScore + probability) / 2), explanation } });
      await this.db.buyerExplanation.upsert({ where: { rankingId: ranking.id }, create: { rankingId: ranking.id, ...explanation }, update: explanation });
    }
    return this.getRankings(domainId);
  }

  async getRankings(domainId: string) {
    const rankings = await this.db.buyerRanking.findMany({ where: { domainId }, orderBy: { rank: "asc" } });
    const companies = await this.db.company.findMany({ where: { id: { in: rankings.map((r) => r.companyId) } } });
    const names = new Map(companies.map((c) => [c.id, c]));
    return rankings.map((ranking) => ({ ...ranking, company: names.get(ranking.companyId) }));
  }

  async listTemplates() {
    for (const [key, name, channel, subject, body] of templates) await this.db.outreachTemplate.upsert({ where: { key }, create: { key, name, channel, subject, body, placeholders: ["domain", "company", "contact", "reason", "sender"] }, update: { name, channel, subject, body } });
    return this.db.outreachTemplate.findMany({ orderBy: { name: "asc" } });
  }

  async generateOutreach(input: { domainId: string; companyId?: string; templateKey: string; contact?: string; sender?: string }) {
    const [domain, company, available] = await Promise.all([this.db.domain.findUnique({ where: { id: input.domainId } }), input.companyId ? this.db.company.findUnique({ where: { id: input.companyId } }) : null, this.listTemplates()]);
    if (!domain) throw new Error("Domain not found");
    const template = available.find((item) => item.key === input.templateKey);
    if (!template) throw new Error("Outreach template not found");
    const ranking = input.companyId ? await this.db.buyerRanking.findUnique({ where: { domainId_companyId: { domainId: input.domainId, companyId: input.companyId } } }) : null;
    const values = { domain: domain.displayName, company: company?.name ?? "your company", contact: input.contact ?? "there", reason: (ranking?.explanation as { reasons?: string[] } | null)?.reasons?.[0] ?? "its brand and market alignment", sender: input.sender ?? "Domain owner" };
    const render = (text: string | null) => text?.replace(/{{(\w+)}}/g, (_, key: keyof typeof values) => values[key] ?? "") ?? null;
    const subject = render(template.subject); const body = render(template.body)!; const inputHash = hash([template.updatedAt, values]);
    return this.db.generatedMessage.create({ data: { domainId: input.domainId, companyId: input.companyId, templateId: template.id, inputHash, subject, body, customizations: values, status: "DRAFT" } });
  }

  async generateNegotiation(domainId: string) {
    const valuation = await this.runValuation(domainId);
    const inputHash = hash([valuation.id, valuation.updatedAt]);
    const data = { valuationId: valuation.id, inputHash, openingPrice: valuation.premiumEstimate, targetPrice: valuation.endUserEstimate, floorPrice: valuation.lowEstimate, strategy: { phases: ["Qualify buyer and authority", "Anchor with premium value", "Trade concessions for speed and certainty", "Use escrow and documented transfer"], concessions: ["Payment plan for higher total", "Time-limited price hold", "Bundled transition support"] }, objectionScripts: { tooExpensive: `The price reflects the strategic value and is supported by a fair estimate of $${valuation.fairEstimate.toLocaleString()}.`, lowOffer: `Thank you. The current offer is below the defensible floor of $${valuation.lowEstimate.toLocaleString()}.`, needTime: "I can hold the current terms for seven days while your team completes review." } };
    return this.db.negotiationPlan.upsert({ where: { domainId }, create: { domainId, ...data }, update: data });
  }

  async snapshot(domainId: string, inputHash?: string) {
    const [scores, valuation, scans] = await Promise.all([this.db.companyScore.findMany({ where: { domainId } }), this.db.valuation.findUnique({ where: { domainId } }), this.db.scanJob.findMany({ where: { domainId }, orderBy: { requestedAt: "desc" }, take: 12 })]);
    const key = inputHash ?? hash([scores.map((s) => [s.id, s.scoredAt]), valuation?.updatedAt, scans.map((s) => s.updatedAt)]);
    const metrics = { qualifiedBuyers: scores.filter((s) => s.buyerScore >= 60).length, priorityBuyers: scores.filter((s) => s.buyerScore >= 80).length, averageBuyerScore: scores.length ? Math.round(scores.reduce((sum, s) => sum + s.buyerScore, 0) / scores.length) : 0, valuation: valuation?.fairEstimate ?? null, scans: scans.length, companiesFound: scans.reduce((sum, s) => sum + s.companiesFound, 0) };
    return this.db.analyticsSnapshot.upsert({ where: { domainId_inputHash: { domainId, inputHash: key } }, create: { domainId, inputHash: key, metrics }, update: { metrics } });
  }

  async analytics(domainId: string) { const latest = await this.snapshot(domainId); const history = await this.db.analyticsSnapshot.findMany({ where: { domainId }, orderBy: { createdAt: "desc" }, take: 30 }); return { latest, history }; }
}

let service: IntelligenceService | undefined;
export const getIntelligenceService = () => service ??= new IntelligenceService();
