import { Prisma, type PrismaClient } from "@prisma/client";
import { dedupeKey, normalizeCompanyName } from "./normalization.ts";
import type { LeadDiscoveryRepository, ConnectorLogInput, ResultsPage, ScanRuntime } from "./repository.ts";
import type { BuyerScore } from "./scoring.ts";
import type { CompanyListItem, CompanyProfile, ConnectorStatusView, PersistResult, PublicCompanyRecord, ResultFilters, ScanView, SearchContext } from "./types.ts";
import type { DiscoveryQuery } from "./query-generator.ts";

export class PrismaLeadDiscoveryRepository implements LeadDiscoveryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createScan(domainId: string, plan: DiscoveryQuery[], connectorStatus: ConnectorStatusView[]): Promise<ScanView> {
    return mapScan(await this.prisma.scanJob.create({ data: { domainId, totalQueries: plan.length, queryPlan: plan as unknown as Prisma.InputJsonValue, connectorStatus: connectorStatus as unknown as Prisma.InputJsonValue, errors: [] } }));
  }

  async getScan(id: string): Promise<ScanRuntime | null> {
    const scan = await this.prisma.scanJob.findUnique({ where: { id }, include: { domain: true } });
    return scan ? { ...mapScan(scan), domain: scan.domain.asciiName, queryPlan: scan.queryPlan as unknown as DiscoveryQuery[], processedQueryKeys: scan.processedQueryKeys } : null;
  }

  async updateScan(id: string, patch: Parameters<LeadDiscoveryRepository["updateScan"]>[1]): Promise<ScanView> {
    const data: Prisma.ScanJobUpdateInput = {};
    if (patch.status) data.status = patch.status;
    for (const key of ["progress", "processedQueries", "companiesFound", "duplicateMerges"] as const) if (patch[key] !== undefined) data[key] = patch[key];
    if (patch.estimatedSecondsLeft !== undefined) data.estimatedSecondsLeft = patch.estimatedSecondsLeft;
    if (patch.connectorStatus) data.connectorStatus = patch.connectorStatus as unknown as Prisma.InputJsonValue;
    if (patch.errors) data.errors = patch.errors;
    if (patch.processedQueryKeys) data.processedQueryKeys = patch.processedQueryKeys;
    if (patch.startedAt !== undefined) data.startedAt = patch.startedAt ? new Date(patch.startedAt) : null;
    if (patch.completedAt !== undefined) data.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
    return mapScan(await this.prisma.scanJob.update({ where: { id }, data }));
  }

  async log(input: ConnectorLogInput): Promise<void> {
    await this.prisma.connectorLog.create({ data: { scanJobId: input.scanJobId, connectorId: input.connectorId, query: input.query, status: input.status, attempt: input.attempt ?? 1, durationMs: input.durationMs, recordsCollected: input.recordsCollected, errorMessage: input.errorMessage?.slice(0, 2_000), apiUsage: input.apiUsage as Prisma.InputJsonValue | undefined } });
  }

  async persist(records: PublicCompanyRecord[], connectorId: string, context: SearchContext, scanJobId: string, scores: BuyerScore[]): Promise<PersistResult> {
    return this.prisma.$transaction(async (transaction) => {
      const companyIds: string[] = [];
      let merged = 0;
      for (const [index, record] of records.entries()) {
        const key = dedupeKey(record);
        const normalizedName = normalizeCompanyName(record.name);
        const existing = await transaction.company.findFirst({ where: { OR: [
          { dedupeKey: key },
          ...(record.officialDomain ? [{ officialDomain: record.officialDomain }] : []),
          ...(record.linkedinUrl ? [{ linkedinUrl: record.linkedinUrl }] : []),
          { normalizedName },
        ] } });
        if (existing) merged++;
        const company = existing
          ? await transaction.company.update({ where: { id: existing.id }, data: companyUpdate(record) })
          : await transaction.company.create({ data: companyCreate(record, key) });
        companyIds.push(company.id);
        await transaction.companySource.upsert({ where: { companyId_sourceUrl: { companyId: company.id, sourceUrl: record.sourceUrl } }, create: { companyId: company.id, connectorId, sourceUrl: record.sourceUrl, fieldOrigins: record.fieldOrigins }, update: { collectedAt: new Date(record.collectedAt), fieldOrigins: record.fieldOrigins } });
        if (record.contacts.length) await transaction.companyContact.createMany({ data: record.contacts.map((contact) => ({ ...contact, companyId: company.id })), skipDuplicates: true });
        if (record.keywords.length) await transaction.companyKeyword.createMany({ data: record.keywords.map((keyword, rank) => ({ companyId: company.id, keyword, relevance: Math.max(50, 90 - rank * 3) })), skipDuplicates: true });
        if (record.industry) {
          const slug = record.industry.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const industry = await transaction.industry.upsert({ where: { slug }, create: { slug, name: record.industry, category: "Discovered" }, update: {} });
          await transaction.companyIndustry.upsert({ where: { companyId_industryId: { companyId: company.id, industryId: industry.id } }, create: { companyId: company.id, industryId: industry.id, relevance: scores[index]?.industryMatch ?? 50, sourceUrl: record.sourceUrl }, update: { relevance: scores[index]?.industryMatch ?? 50, sourceUrl: record.sourceUrl } });
        }
        const score = scores[index];
        if (score) {
          const current = await transaction.companyScore.findUnique({ where: { companyId_domainId: { companyId: company.id, domainId: context.domainId } } });
          if (!current || score.buyerScore > current.buyerScore) await transaction.companyScore.upsert({ where: { companyId_domainId: { companyId: company.id, domainId: context.domainId } }, create: { companyId: company.id, domainId: context.domainId, ...score }, update: score });
        }
        await transaction.scanResult.upsert({ where: { scanJobId_companyId_connectorId_query: { scanJobId, companyId: company.id, connectorId, query: context.query } }, create: { scanJobId, companyId: company.id, connectorId, query: context.query }, update: {} });
        await transaction.companyHistory.create({ data: { companyId: company.id, eventType: existing ? "SOURCE_MERGED" : "DISCOVERED", details: { connectorId, sourceUrl: record.sourceUrl, scanJobId } } });
      }
      return { saved: records.length, merged, companyIds };
    }, { timeout: 30_000 });
  }

  async listResults(scanJobId: string, filters: ResultFilters): Promise<ResultsPage> {
    const scan = await this.prisma.scanJob.findUniqueOrThrow({ where: { id: scanJobId } });
    const companyWhere: Prisma.CompanyWhereInput = { scanResults: { some: { scanJobId } } };
    if (filters.search) companyWhere.OR = [{ name: { contains: filters.search, mode: "insensitive" } }, { description: { contains: filters.search, mode: "insensitive" } }, { officialDomain: { contains: filters.search, mode: "insensitive" } }];
    if (filters.country) companyWhere.country = filters.country;
    if (filters.companySize) companyWhere.companySize = filters.companySize;
    if (filters.fundingStage) companyWhere.fundingStage = filters.fundingStage;
    if (filters.industry) companyWhere.industries = { some: { industry: { name: filters.industry } } };
    if (filters.keyword) companyWhere.keywords = { some: { keyword: filters.keyword } };
    const where: Prisma.CompanyScoreWhereInput = { domainId: scan.domainId, buyerScore: { gte: filters.minBuyerScore }, confidenceScore: { gte: filters.minConfidence }, company: companyWhere };
    const direction = filters.direction ?? "desc";
    const orderBy: Prisma.CompanyScoreOrderByWithRelationInput = filters.sort === "name" ? { company: { name: direction } } : filters.sort === "collectedAt" ? { scoredAt: direction } : filters.sort === "confidence" ? { confidenceScore: direction } : { buyerScore: direction };
    const rows = await this.prisma.companyScore.findMany({ where, orderBy: [orderBy, { id: direction }], take: filters.pageSize + 1, ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}), include: { company: { include: companyLeadInclude } } });
    const total = await this.prisma.companyScore.count({ where });
    const hasMore = rows.length > filters.pageSize;
    const page = hasMore ? rows.slice(0, filters.pageSize) : rows;
    const items = page.map((row) => baseCompany(row.company, row, row.company.industries[0]?.industry.name ?? null, row.company.keywords.map((item) => item.keyword), row.company.sources.length));
    return { items, total, nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
  }

  async getCompany(id: string): Promise<CompanyProfile | null> {
    const company = await this.prisma.company.findUnique({ where: { id }, include: { contacts: true, sources: { orderBy: { collectedAt: "desc" } }, industries: { include: { industry: true } }, keywords: { orderBy: { relevance: "desc" } }, history: { orderBy: { createdAt: "desc" }, take: 50 }, scores: { orderBy: { scoredAt: "desc" }, take: 1 } } });
    if (!company || !company.scores[0]) return null;
    const base = baseCompany(company, company.scores[0], company.industries[0]?.industry.name ?? null, company.keywords.map((item) => item.keyword), company.sources.length);
    return { ...base, state: company.state, headquarters: company.headquarters, linkedinUrl: company.linkedinUrl, contactPage: company.contactPage, latestFunding: company.latestFunding, notes: company.notes, contacts: company.contacts.map((contact) => ({ type: contact.type, name: contact.name, title: contact.title, value: contact.value, sourceUrl: contact.sourceUrl })), industries: company.industries.map((item) => ({ name: item.industry.name, relevance: item.relevance })), sources: company.sources.map((source) => ({ connectorId: source.connectorId, sourceUrl: source.sourceUrl, collectedAt: source.collectedAt.toISOString() })), history: company.history.map((item) => ({ eventType: item.eventType, details: item.details, createdAt: item.createdAt.toISOString() })) };
  }

  async updateCompany(id: string, patch: { bookmarked?: boolean; notes?: string | null }): Promise<CompanyProfile | null> {
    try { await this.prisma.company.update({ where: { id }, data: { ...(patch.bookmarked !== undefined ? { bookmarked: patch.bookmarked } : {}), ...(patch.notes !== undefined ? { notes: patch.notes?.slice(0, 10_000) ?? null } : {}) } }); return this.getCompany(id); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null; throw error; }
  }

  async saveFilter(domainId: string | null, name: string, filters: ResultFilters) {
    const row = await this.prisma.savedLeadFilter.create({ data: { domainId, name: name.slice(0, 100), filters: filters as unknown as Prisma.InputJsonValue } });
    return { id: row.id, name: row.name, filters: row.filters as unknown as ResultFilters };
  }

  async listFilters(domainId?: string) {
    const rows = await this.prisma.savedLeadFilter.findMany({ where: domainId ? { OR: [{ domainId }, { domainId: null }] } : undefined, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ id: row.id, name: row.name, filters: row.filters as unknown as ResultFilters }));
  }

  async getCached(connectorId: string, queryKey: string): Promise<PublicCompanyRecord[] | null> {
    const cached = await this.prisma.connectorCache.findUnique({ where: { connectorId_queryKey: { connectorId, queryKey } } });
    if (!cached || cached.expiresAt <= new Date()) return null;
    return cached.records as unknown as PublicCompanyRecord[];
  }

  async setCached(connectorId: string, queryKey: string, records: PublicCompanyRecord[], expiresAt: Date): Promise<void> {
    await this.prisma.connectorCache.upsert({ where: { connectorId_queryKey: { connectorId, queryKey } }, create: { connectorId, queryKey, records: records as unknown as Prisma.InputJsonValue, expiresAt }, update: { records: records as unknown as Prisma.InputJsonValue, expiresAt } });
  }
}

function companyCreate(record: PublicCompanyRecord, key: string): Prisma.CompanyCreateInput {
  return { dedupeKey: key, normalizedName: normalizeCompanyName(record.name), name: record.name, website: record.website, officialDomain: record.officialDomain, description: record.description, country: record.country, state: record.state, city: record.city, headquarters: record.headquarters, linkedinUrl: record.linkedinUrl, contactPage: record.contactPage, companySize: record.companySize, fundingStage: record.fundingStage, latestFunding: record.latestFunding, lastCollectedAt: new Date(record.collectedAt) };
}
function companyUpdate(record: PublicCompanyRecord): Prisma.CompanyUpdateInput {
  return Object.fromEntries(Object.entries({ name: record.name, website: record.website, officialDomain: record.officialDomain, description: record.description, country: record.country, state: record.state, city: record.city, headquarters: record.headquarters, linkedinUrl: record.linkedinUrl, contactPage: record.contactPage, companySize: record.companySize, fundingStage: record.fundingStage, latestFunding: record.latestFunding, lastCollectedAt: new Date(record.collectedAt) }).filter(([, value]) => value !== null)) as Prisma.CompanyUpdateInput;
}
const companyLeadInclude = { industries: { include: { industry: true }, take: 1 }, keywords: { orderBy: { relevance: "desc" as const }, take: 10 }, sources: { select: { id: true } } } as const;
function baseCompany(company: { id: string; name: string; website: string | null; officialDomain: string | null; description: string | null; country: string | null; city: string | null; companySize: string | null; fundingStage: string | null; bookmarked: boolean }, score: { buyerScore: number; confidenceScore: number; matchReason: string }, industry: string | null, keywords: string[], sourceCount: number): CompanyListItem { return { ...company, industry, score: { buyerScore: score.buyerScore, confidenceScore: score.confidenceScore, matchReason: score.matchReason }, keywords, sourceCount }; }
function mapScan(scan: { id: string; domainId: string; status: string; progress: number; totalQueries: number; processedQueries: number; companiesFound: number; duplicateMerges: number; estimatedSecondsLeft: number | null; connectorStatus: unknown; errors: unknown; requestedAt: Date; startedAt: Date | null; completedAt: Date | null }): ScanView { return { id: scan.id, domainId: scan.domainId, domain: "", status: scan.status as ScanView["status"], progress: scan.progress, totalQueries: scan.totalQueries, processedQueries: scan.processedQueries, companiesFound: scan.companiesFound, duplicateMerges: scan.duplicateMerges, estimatedSecondsLeft: scan.estimatedSecondsLeft, connectorStatus: scan.connectorStatus as ConnectorStatusView[], errors: scan.errors as string[], requestedAt: scan.requestedAt.toISOString(), startedAt: scan.startedAt?.toISOString() ?? null, completedAt: scan.completedAt?.toISOString() ?? null }; }
