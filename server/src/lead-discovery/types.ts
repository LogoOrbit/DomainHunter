export type ConnectorHealth = "idle" | "healthy" | "degraded" | "offline";

export type PublicContact = {
  type: "BUSINESS_EMAIL" | "SALES_EMAIL" | "SUPPORT_EMAIL" | "PHONE" | "FOUNDER" | "CEO" | "DECISION_MAKER";
  name: string | null;
  title: string | null;
  value: string | null;
  sourceUrl: string;
};

export type PublicCompanyRecord = {
  externalId: string;
  name: string;
  website: string | null;
  officialDomain: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  headquarters: string | null;
  linkedinUrl: string | null;
  contactPage: string | null;
  companySize: string | null;
  fundingStage: string | null;
  latestFunding: string | null;
  contacts: PublicContact[];
  keywords: string[];
  sourceUrl: string;
  fieldOrigins: Record<string, string>;
  collectedAt: string;
};

export type SearchContext = {
  query: string;
  domainId: string;
  domain: string;
  rootKeyword: string;
  semanticPhrase: string;
  semanticConfidence: number;
  targetIndustries: string[];
  signal: AbortSignal;
};

export type ConnectorSearchResult = { records: unknown[]; apiUsage: Record<string, number | string | null> };
export type PersistResult = { saved: number; merged: number; companyIds: string[] };

export type ConnectorStatusView = {
  id: string;
  name: string;
  health: ConnectorHealth;
  error: string | null;
  records: number;
};

export type ScanView = {
  id: string;
  domainId: string;
  domain: string;
  status: "QUEUED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  totalQueries: number;
  processedQueries: number;
  companiesFound: number;
  duplicateMerges: number;
  estimatedSecondsLeft: number | null;
  connectorStatus: ConnectorStatusView[];
  errors: string[];
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type CompanyScoreView = {
  buyerScore: number;
  confidenceScore: number;
  matchReason: string;
};

export type CompanyListItem = {
  id: string;
  name: string;
  website: string | null;
  officialDomain: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  companySize: string | null;
  fundingStage: string | null;
  bookmarked: boolean;
  score: CompanyScoreView;
  keywords: string[];
  sourceCount: number;
};

export type CompanyProfile = CompanyListItem & {
  state: string | null;
  headquarters: string | null;
  linkedinUrl: string | null;
  contactPage: string | null;
  latestFunding: string | null;
  notes: string | null;
  contacts: PublicContact[];
  industries: { name: string; relevance: number }[];
  sources: { connectorId: string; sourceUrl: string; collectedAt: string }[];
  history: { eventType: string; details: unknown; createdAt: string }[];
};

export type ResultFilters = {
  search?: string;
  country?: string;
  industry?: string;
  minBuyerScore?: number;
  minConfidence?: number;
  companySize?: string;
  fundingStage?: string;
  keyword?: string;
  sort?: "buyerScore" | "confidence" | "name" | "collectedAt";
  direction?: "asc" | "desc";
  cursor?: string;
  pageSize: number;
};
