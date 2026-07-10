export class MemoryDomainRepository {
  records = new Map();
  sequence = 0;

  async findByDomain(domain) { return [...this.records.values()].find((record) => record.parsed.domain === domain) ?? null; }
  async findById(id) { return this.records.get(id) ?? null; }
  async save(draft) {
    const existing = await this.findByDomain(draft.parsed.domain);
    const now = new Date().toISOString();
    const record = { ...draft, id: existing?.id ?? `domain-${++this.sequence}`, createdAt: existing?.createdAt ?? now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }
  async list({ cursor, pageSize }) {
    const items = [...this.records.values()];
    const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
    const page = items.slice(start, start + pageSize);
    return { items: page, nextCursor: start + pageSize < items.length ? page.at(-1)?.id ?? null : null };
  }
  async delete(id) { return this.records.delete(id); }
}
