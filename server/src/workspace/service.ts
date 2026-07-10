import { Prisma } from "@prisma/client";
import { getPrisma } from "../domain-intelligence/prisma.ts";

const clean = (value: string, maximum = 10_000) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maximum);

export class ResearchWorkspaceService {
  private db = getPrisma();

  projects() { return this.db.project.findMany({ orderBy: { updatedAt: "desc" } }); }
  async createProject(input: { name: string; description?: string }) { const project = await this.db.project.create({ data: { name: clean(input.name, 120), description: input.description ? clean(input.description) : null } }); await this.log("PROJECT_CREATED", "PROJECT", project.id, { name: project.name }, project.id); return project; }
  async updateProject(id: string, input: { name?: string; description?: string | null }) { const project = await this.db.project.update({ where: { id }, data: { name: input.name ? clean(input.name, 120) : undefined, description: input.description === null ? null : input.description ? clean(input.description) : undefined } }); await this.log("PROJECT_UPDATED", "PROJECT", id, input, id); return project; }
  async deleteProject(id: string) { await this.db.$transaction([this.db.projectDomain.deleteMany({ where: { projectId: id } }), this.db.projectCompany.deleteMany({ where: { projectId: id } }), this.db.projectNote.deleteMany({ where: { projectId: id } }), this.db.savedSearch.deleteMany({ where: { projectId: id } }), this.db.project.delete({ where: { id } })]); return { deleted: true }; }
  addDomain(projectId: string, domainId: string) { return this.db.projectDomain.upsert({ where: { projectId_domainId: { projectId, domainId } }, create: { projectId, domainId }, update: {} }); }
  addCompany(projectId: string, companyId: string) { return this.db.projectCompany.upsert({ where: { projectId_companyId: { projectId, companyId } }, create: { projectId, companyId }, update: {} }); }

  async company(id: string) {
    const company = await this.db.company.findUnique({ where: { id }, include: { contacts: true, sources: { orderBy: { collectedAt: "desc" } }, scores: { orderBy: { scoredAt: "desc" } }, industries: { include: { industry: true } }, keywords: true, history: { orderBy: { createdAt: "desc" } } } });
    if (!company) return null;
    const [notes, tags, crm, changes, rankings] = await Promise.all([this.db.companyNote.findMany({ where: { companyId: id }, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] }), this.db.companyTag.findMany({ where: { companyId: id } }), this.db.projectCompany.findMany({ where: { companyId: id } }), this.db.companyChange.findMany({ where: { companyId: id }, orderBy: { detectedAt: "desc" } }), this.db.buyerRanking.findMany({ where: { companyId: id }, orderBy: { rankedAt: "desc" } })]);
    await this.log("COMPANY_VIEWED", "COMPANY", id, {}, undefined, id);
    return { ...company, notes, tagIds: tags.map((tag) => tag.tagId), crm, changes, buyerReasoning: rankings };
  }

  async addNote(input: { companyId: string; projectId?: string; title: string; content: string; pinned?: boolean; private?: boolean }) { const note = await this.db.companyNote.create({ data: { companyId: input.companyId, projectId: input.projectId, title: clean(input.title, 200), content: clean(input.content), pinned: input.pinned ?? false, private: input.private ?? true } }); await this.log("NOTE_CREATED", "COMPANY_NOTE", note.id, { title: note.title }, input.projectId, input.companyId); return note; }
  async createWatchlist(input: { name: string; description?: string; companyIds?: string[]; filters?: unknown }) { return this.db.$transaction(async (db) => { const watchlist = await db.watchlist.create({ data: { name: clean(input.name, 120), description: input.description ? clean(input.description) : null, filters: input.filters as Prisma.InputJsonValue | undefined } }); if (input.companyIds?.length) await db.watchlistItem.createMany({ data: [...new Set(input.companyIds)].map((companyId) => ({ watchlistId: watchlist.id, companyId })), skipDuplicates: true }); return watchlist; }); }
  watchlists() { return this.db.watchlist.findMany({ orderBy: { updatedAt: "desc" } }); }
  async saveSearch(input: { name: string; projectId?: string; query?: string; filters?: unknown; sort?: unknown }) { const saved = await this.db.savedSearch.create({ data: { name: clean(input.name, 120), projectId: input.projectId, query: input.query ? clean(input.query, 500) : null, filters: (input.filters ?? {}) as Prisma.InputJsonValue, sort: (input.sort ?? {}) as Prisma.InputJsonValue } }); await this.log("SEARCH_SAVED", "SAVED_SEARCH", saved.id, {}, input.projectId); return saved; }
  savedSearches() { return this.db.savedSearch.findMany({ orderBy: { updatedAt: "desc" } }); }
  async reminder(input: { title: string; dueAt: string; description?: string; projectId?: string; companyId?: string }) { const dueAt = new Date(input.dueAt); if (Number.isNaN(dueAt.getTime())) throw new Error("dueAt must be a valid date"); const reminder = await this.db.reminder.create({ data: { title: clean(input.title, 200), dueAt, description: input.description ? clean(input.description) : null, projectId: input.projectId, companyId: input.companyId } }); await this.log("REMINDER_CREATED", "REMINDER", reminder.id, { dueAt }, input.projectId, input.companyId); return reminder; }
  reminders() { return this.db.reminder.findMany({ where: { completedAt: null }, orderBy: { dueAt: "asc" } }); }
  async attachment(input: { projectId?: string; companyId?: string; noteId?: string; fileName: string; mediaType: string; storageKey: string; sizeBytes: number; checksum: string }) { const allowed = /^(application\/(pdf|vnd\.|msword)|image\/|text\/|application\/octet-stream)/.test(input.mediaType); if (!allowed || input.sizeBytes < 1 || input.sizeBytes > 25_000_000) throw new Error("Unsupported attachment metadata"); return this.db.attachment.create({ data: { ...input, fileName: clean(input.fileName, 255), mediaType: clean(input.mediaType, 120), storageKey: clean(input.storageKey, 500), checksum: clean(input.checksum, 128) } }); }

  async search(query: string, take = 30) {
    const terms = query.trim().split(/\s+(?:AND\s+)?/i).filter(Boolean).slice(0, 8); if (!terms.length) return { companies: [], domains: [], projects: [], notes: [] };
    const contains = terms.map((term) => term.replace(/^[-+]/, "")).filter(Boolean);
    const [companies, domains, projects, notes] = await Promise.all([
      this.db.company.findMany({ where: { AND: contains.map((term) => ({ OR: [{ name: { contains: term, mode: "insensitive" } }, { description: { contains: term, mode: "insensitive" } }, { officialDomain: { contains: term, mode: "insensitive" } }, { keywords: { some: { keyword: { contains: term, mode: "insensitive" } } } }] })) }, take, orderBy: { updatedAt: "desc" } }),
      this.db.domain.findMany({ where: { OR: contains.flatMap((term) => [{ asciiName: { contains: term, mode: "insensitive" as const } }, { label: { contains: term, mode: "insensitive" as const } }]) }, take }),
      this.db.project.findMany({ where: { OR: contains.flatMap((term) => [{ name: { contains: term, mode: "insensitive" as const } }, { description: { contains: term, mode: "insensitive" as const } }]) }, take }),
      this.db.companyNote.findMany({ where: { OR: contains.flatMap((term) => [{ title: { contains: term, mode: "insensitive" as const } }, { content: { contains: term, mode: "insensitive" as const } }]) }, take }),
    ]); await this.log("SEARCH_EXECUTED", "SEARCH", null, { query, counts: { companies: companies.length, domains: domains.length, projects: projects.length, notes: notes.length } }); return { companies, domains, projects, notes };
  }

  async compare(companyIds: string[]) { const ids = [...new Set(companyIds)].slice(0, 8); const companies = await this.db.company.findMany({ where: { id: { in: ids } }, include: { scores: { orderBy: { scoredAt: "desc" }, take: 1 }, contacts: true, industries: { include: { industry: true } } } }); await this.log("COMPARISON_GENERATED", "COMPANY", null, { companyIds: ids }); return companies; }
  activities() { return this.db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }); }
  favorites() { return this.db.projectCompany.findMany({ where: { favorite: true, archivedAt: null }, orderBy: { updatedAt: "desc" } }); }
  async updateLead(id: string, patch: { status?: string; priority?: number; favorite?: boolean; manualScore?: number; privateComments?: string; followUpAt?: string; archived?: boolean }) { const existing = await this.db.projectCompany.findUniqueOrThrow({ where: { id } }); const lead = await this.db.projectCompany.update({ where: { id }, data: { status: patch.status as never, priority: patch.priority, favorite: patch.favorite, manualScore: patch.manualScore, privateComments: patch.privateComments ? clean(patch.privateComments) : undefined, followUpAt: patch.followUpAt ? new Date(patch.followUpAt) : undefined, archivedAt: patch.archived ? new Date() : patch.archived === false ? null : undefined } }); if (patch.status && patch.status !== existing.status) await this.db.leadStatusHistory.create({ data: { projectCompanyId: id, previousStatus: existing.status, currentStatus: patch.status as never } }); await this.log("LEAD_UPDATED", "PROJECT_COMPANY", id, patch, lead.projectId, lead.companyId); return lead; }

  private log(action: string, entityType: string, entityId: string | null, details: unknown, projectId?: string, companyId?: string) { return this.db.activityLog.create({ data: { action, entityType, entityId, details: details as Prisma.InputJsonValue, projectId, companyId } }); }
}
let service: ResearchWorkspaceService | undefined; export const getResearchWorkspaceService = () => service ??= new ResearchWorkspaceService();
