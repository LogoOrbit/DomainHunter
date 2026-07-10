import { normalizeCompanyName } from "./normalization.ts";
import type { PublicCompanyRecord } from "./types.ts";

export type BuyerScoreInput = {
  company: PublicCompanyRecord;
  domain: string;
  rootKeyword: string;
  semanticPhrase: string;
  semanticConfidence: number;
  targetIndustries: string[];
};

export type BuyerScore = {
  buyerScore: number;
  confidenceScore: number;
  semanticRelevance: number;
  industryMatch: number;
  brandSimilarity: number;
  keywordSimilarity: number;
  domainSimilarity: number;
  companyStrength: number;
  technologyMatch: number;
  businessModelFit: number;
  matchReason: string;
};

export function scoreBuyer(input: BuyerScoreInput): BuyerScore {
  const text = `${input.company.name} ${input.company.description ?? ""} ${input.company.industry ?? ""} ${input.company.keywords.join(" ")}`.toLowerCase();
  const phraseTokens = tokens(input.semanticPhrase);
  const companyTokens = tokens(text);
  const semanticRelevance = clamp(input.semanticConfidence * 70 + jaccard(phraseTokens, companyTokens) * 30);
  const industryMatch = clamp(Math.max(0, ...input.targetIndustries.map((industry) => jaccard(tokens(industry), companyTokens) * 100)));
  const brandSimilarity = clamp(similarity(normalizeCompanyName(input.company.name), input.rootKeyword) * 100);
  const keywordSimilarity = clamp(jaccard(tokens(`${input.rootKeyword} ${input.semanticPhrase}`), companyTokens) * 100);
  const domainSimilarity = clamp(input.company.officialDomain ? similarity(input.company.officialDomain.split(".")[0] ?? "", input.rootKeyword) * 100 : 0);
  const companyStrength = clamp((input.company.companySize ? 70 : 45) + (input.company.fundingStage ? 20 : 0) + (input.company.website ? 10 : 0));
  const technologyMatch = /software|technology|cloud|developer|platform|network|ai|data/.test(text) ? 85 : 45;
  const businessModelFit = /saas|platform|service|software|provider|enterprise|marketplace/.test(text) ? 88 : 52;
  const buyerScore = clamp(semanticRelevance * .24 + industryMatch * .16 + brandSimilarity * .1 + keywordSimilarity * .14 + domainSimilarity * .08 + companyStrength * .1 + technologyMatch * .09 + businessModelFit * .09);
  const evidenceFields = [input.company.website, input.company.description, input.company.industry, input.company.headquarters, input.company.contacts.length ? "contacts" : null].filter(Boolean).length;
  const confidenceScore = clamp(45 + evidenceFields * 8 + (input.company.officialDomain ? 10 : 0) + Math.min(input.company.fieldOrigins ? Object.keys(input.company.fieldOrigins).length : 0, 5) * 1.5);
  const reasons = [`${Math.round(semanticRelevance)}% semantic relevance to ${input.semanticPhrase}`];
  if (industryMatch >= 50 && input.company.industry) reasons.push(`industry alignment with ${input.company.industry}`);
  if (brandSimilarity >= 45) reasons.push(`brand similarity to ${input.rootKeyword}`);
  if (technologyMatch >= 80) reasons.push("technology-focused business profile");

  return { buyerScore, confidenceScore, semanticRelevance, industryMatch, brandSimilarity, keywordSimilarity, domainSimilarity, companyStrength, technologyMatch, businessModelFit, matchReason: reasons.join("; ") };
}

function tokens(value: string): Set<string> { return new Set(value.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []); }
function jaccard(a: Set<string>, b: Set<string>): number { const intersection = [...a].filter((item) => b.has(item)).length; const union = new Set([...a, ...b]).size; return union ? intersection / union : 0; }
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]; previous[0] = i;
    for (let j = 1; j <= b.length; j++) { const old = previous[j]; previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)); diagonal = old; }
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
}
function clamp(value: number): number { return Math.max(0, Math.min(100, Math.round(value))); }
