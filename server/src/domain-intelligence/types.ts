export type ScoreName =
  | "pronounceability"
  | "memorability"
  | "brandability"
  | "length"
  | "seoFriendliness"
  | "commercialPotential"
  | "premium"
  | "globalUsability"
  | "startupFriendliness";

export type DomainScores = Record<ScoreName, number>;

export type ParsedDomain = {
  domain: string;
  unicodeDomain: string;
  rootKeyword: string;
  rootKeywords: string[];
  extension: string;
  subdomain: string | null;
};

export type DomainMetrics = {
  characterCount: number;
  wordCount: number;
  hyphenCount: number;
  numberCount: number;
  letterCount: number;
};

export type IndustrySuggestion = {
  slug: string;
  name: string;
  category: string;
  relevance: number;
};

export type UseCaseSuggestion = {
  title: string;
  description: string;
  relevance: number;
};

export type SemanticMeaning = {
  phrase: string;
  confidence: number;
  category: string;
  explanation: string;
  industries: IndustrySuggestion[];
  useCases: UseCaseSuggestion[];
};

export type DomainQualityReport = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];
  idealBuyerProfile: string;
  targetIndustries: IndustrySuggestion[];
  globalMarketSuitability: {
    score: number;
    summary: string;
  };
};

export type DomainAnalysisDraft = {
  parsed: ParsedDomain;
  metrics: DomainMetrics;
  scores: DomainScores;
  semanticMeanings: SemanticMeaning[];
  quality: DomainQualityReport;
  analyzedAt: string;
};

export type DomainAnalysisRecord = DomainAnalysisDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AnalysisResult = {
  analysis: DomainAnalysisRecord;
  cached: boolean;
};

export type HistoryPage = {
  items: DomainAnalysisRecord[];
  nextCursor: string | null;
};
