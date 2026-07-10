import { Prisma, type PrismaClient } from "@prisma/client";
import type { DomainAnalysisRepository, HistoryOptions } from "./repository.ts";
import type { DomainAnalysisDraft, DomainAnalysisRecord, HistoryPage } from "./types.ts";

const domainInclude = Prisma.validator<Prisma.DomainInclude>()({
  analysis: {
    include: {
      semanticMeanings: {
        orderBy: { rank: "asc" },
        include: {
          industries: { orderBy: { rank: "asc" }, include: { industry: true } },
          useCases: { orderBy: { rank: "asc" } },
        },
      },
    },
  },
});

type DomainWithAnalysis = Prisma.DomainGetPayload<{ include: typeof domainInclude }>;

export class PrismaDomainAnalysisRepository implements DomainAnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDomain(domain: string): Promise<DomainAnalysisRecord | null> {
    const record = await this.prisma.domain.findUnique({ where: { asciiName: domain }, include: domainInclude });
    return record && hasAnalysis(record) ? mapRecord(record) : null;
  }

  async findById(id: string): Promise<DomainAnalysisRecord | null> {
    const record = await this.prisma.domain.findUnique({ where: { id }, include: domainInclude });
    return record && hasAnalysis(record) ? mapRecord(record) : null;
  }

  async save(draft: DomainAnalysisDraft): Promise<DomainAnalysisRecord> {
    try {
      const domain = await this.prisma.$transaction(async (transaction) => {
        const storedDomain = await transaction.domain.upsert({
          where: { asciiName: draft.parsed.domain },
          update: {
            displayName: draft.parsed.unicodeDomain,
            label: draft.parsed.rootKeyword,
            tld: draft.parsed.extension,
          },
          create: {
            asciiName: draft.parsed.domain,
            displayName: draft.parsed.unicodeDomain,
            label: draft.parsed.rootKeyword,
            tld: draft.parsed.extension,
          },
        });

        await transaction.domainAnalysis.deleteMany({ where: { domainId: storedDomain.id } });
        await transaction.domainAnalysis.create({
          data: {
            domainId: storedDomain.id,
            characterCount: draft.metrics.characterCount,
            wordCount: draft.metrics.wordCount,
            hyphenCount: draft.metrics.hyphenCount,
            numberCount: draft.metrics.numberCount,
            letterCount: draft.metrics.letterCount,
            pronounceabilityScore: draft.scores.pronounceability,
            memorabilityScore: draft.scores.memorability,
            brandabilityScore: draft.scores.brandability,
            lengthScore: draft.scores.length,
            seoFriendliness: draft.scores.seoFriendliness,
            commercialPotential: draft.scores.commercialPotential,
            premiumScore: draft.scores.premium,
            globalUsability: draft.scores.globalUsability,
            startupFriendliness: draft.scores.startupFriendliness,
            strengths: draft.quality.strengths,
            weaknesses: draft.quality.weaknesses,
            opportunities: draft.quality.opportunities,
            risks: draft.quality.risks,
            idealBuyerProfile: draft.quality.idealBuyerProfile,
            globalMarketSummary: draft.quality.globalMarketSuitability.summary,
            analyzedAt: new Date(draft.analyzedAt),
            semanticMeanings: {
              create: draft.semanticMeanings.map((meaning, rank) => ({
                phrase: meaning.phrase,
                confidence: meaning.confidence,
                category: meaning.category,
                explanation: meaning.explanation,
                rank,
                industries: {
                  create: meaning.industries.map((industry, industryRank) => ({
                    relevance: industry.relevance,
                    rank: industryRank,
                    industry: {
                      connectOrCreate: {
                        where: { slug: industry.slug },
                        create: { slug: industry.slug, name: industry.name, category: industry.category },
                      },
                    },
                  })),
                },
                useCases: {
                  create: meaning.useCases.map((useCase, useCaseRank) => ({ ...useCase, rank: useCaseRank })),
                },
              })),
            },
          },
        });

        return transaction.domain.findUniqueOrThrow({ where: { id: storedDomain.id }, include: domainInclude });
      });
      if (!hasAnalysis(domain)) throw new Error("Stored domain analysis could not be reloaded");
      return mapRecord(domain);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.findByDomain(draft.parsed.domain);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async list({ cursor, pageSize }: HistoryOptions): Promise<HistoryPage> {
    const records = await this.prisma.domain.findMany({
      where: { analysis: { isNot: null } },
      include: domainInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = records.length > pageSize;
    const page = hasMore ? records.slice(0, pageSize) : records;
    return { items: page.filter(hasAnalysis).map(mapRecord), nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.domain.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return false;
      throw error;
    }
  }
}

function hasAnalysis(record: DomainWithAnalysis): record is DomainWithAnalysis & { analysis: NonNullable<DomainWithAnalysis["analysis"]> } {
  return record.analysis !== null;
}

function mapRecord(record: DomainWithAnalysis & { analysis: NonNullable<DomainWithAnalysis["analysis"]> }): DomainAnalysisRecord {
  const analysis = record.analysis;
  const semanticMeanings = analysis.semanticMeanings.map((meaning) => ({
    phrase: meaning.phrase,
    confidence: meaning.confidence,
    category: meaning.category,
    explanation: meaning.explanation,
    industries: meaning.industries.map(({ industry, relevance }) => ({ slug: industry.slug, name: industry.name, category: industry.category, relevance })),
    useCases: meaning.useCases.map(({ title, description, relevance }) => ({ title, description, relevance })),
  }));
  const targetIndustries = [...new Map(semanticMeanings.flatMap((meaning) => meaning.industries).map((industry) => [industry.slug, industry])).values()]
    .sort((a, b) => b.relevance - a.relevance).slice(0, 10);

  return {
    id: record.id,
    parsed: { domain: record.asciiName, unicodeDomain: record.displayName, rootKeyword: record.label, rootKeywords: record.label.split("-").filter(Boolean), extension: record.tld, subdomain: null },
    metrics: { characterCount: analysis.characterCount, wordCount: analysis.wordCount, hyphenCount: analysis.hyphenCount, numberCount: analysis.numberCount, letterCount: analysis.letterCount },
    scores: { pronounceability: analysis.pronounceabilityScore, memorability: analysis.memorabilityScore, brandability: analysis.brandabilityScore, length: analysis.lengthScore, seoFriendliness: analysis.seoFriendliness, commercialPotential: analysis.commercialPotential, premium: analysis.premiumScore, globalUsability: analysis.globalUsability, startupFriendliness: analysis.startupFriendliness },
    semanticMeanings,
    quality: { strengths: analysis.strengths, weaknesses: analysis.weaknesses, opportunities: analysis.opportunities, risks: analysis.risks, idealBuyerProfile: analysis.idealBuyerProfile, targetIndustries, globalMarketSuitability: { score: analysis.globalUsability, summary: analysis.globalMarketSummary } },
    analyzedAt: analysis.analyzedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
