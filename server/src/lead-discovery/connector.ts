import type { ConnectorHealth, ConnectorSearchResult, PersistResult, PublicCompanyRecord, SearchContext } from "./types.ts";

export type ConnectorSaveContext = { persist(records: PublicCompanyRecord[], connectorId: string, context: SearchContext): Promise<PersistResult> };

export interface PublicLeadConnector {
  readonly id: string;
  readonly name: string;
  initialize(): Promise<void>;
  search(context: SearchContext): Promise<ConnectorSearchResult>;
  normalize(raw: unknown, context: SearchContext): PublicCompanyRecord | null;
  validate(record: PublicCompanyRecord): boolean;
  save(records: PublicCompanyRecord[], context: SearchContext, sink: ConnectorSaveContext): Promise<PersistResult>;
  shutdown(): Promise<void>;
  health(): ConnectorHealth;
}

export abstract class BasePublicConnector implements PublicLeadConnector {
  abstract readonly id: string;
  abstract readonly name: string;
  private state: ConnectorHealth = "idle";

  async initialize(): Promise<void> { this.state = "healthy"; }
  abstract search(context: SearchContext): Promise<ConnectorSearchResult>;
  abstract normalize(raw: unknown, context: SearchContext): PublicCompanyRecord | null;
  validate(record: PublicCompanyRecord): boolean {
    return record.name.trim().length >= 2 && isPublicHttpUrl(record.sourceUrl) && (!record.website || isPublicHttpUrl(record.website));
  }
  save(records: PublicCompanyRecord[], context: SearchContext, sink: ConnectorSaveContext): Promise<PersistResult> {
    return sink.persist(records, this.id, context);
  }
  async shutdown(): Promise<void> { this.state = "idle"; }
  health(): ConnectorHealth { return this.state; }
  protected degraded(): void { this.state = "degraded"; }
}

export function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const privateHost = host === "localhost" || host.endsWith(".local") || host === "::1" || host === "0.0.0.0" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|f[cd][0-9a-f]{2}:|fe8[0-9a-f]:)/.test(host);
    return (url.protocol === "https:" || url.protocol === "http:") && !privateHost;
  } catch { return false; }
}
