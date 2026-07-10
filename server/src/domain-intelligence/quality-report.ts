import type { DomainMetrics, DomainQualityReport, DomainScores, ParsedDomain, SemanticMeaning } from "./types.ts";

export function createQualityReport(parsed: ParsedDomain, metrics: DomainMetrics, scores: DomainScores, meanings: SemanticMeaning[]): DomainQualityReport {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const risks: string[] = [];

  if (metrics.characterCount <= 5) strengths.push("Exceptionally concise root keyword");
  if (metrics.hyphenCount === 0 && metrics.numberCount === 0) strengths.push("Clean spelling without hyphens or numbers");
  if (scores.brandability >= 80) strengths.push("Strong brandability across product categories");
  if (scores.globalUsability >= 80) strengths.push("Easy to use across international markets");
  if (meanings.length >= 5) strengths.push("Multiple credible commercial interpretations");

  if (scores.pronounceability < 65) weaknesses.push("May require explanation when spoken aloud");
  if (metrics.hyphenCount > 0) weaknesses.push("Hyphens reduce verbal clarity and direct navigation");
  if (metrics.numberCount > 0) weaknesses.push("Numbers can create spelling ambiguity");
  if (parsed.extension !== "com") weaknesses.push(`.${parsed.extension} has lower universal recognition than .com`);
  if (weaknesses.length === 0) weaknesses.push("Meaning breadth may require a focused positioning strategy");

  for (const meaning of meanings.slice(0, 3)) opportunities.push(`Position for ${meaning.phrase.toLowerCase()} products and services`);
  opportunities.push(`Build a category-defining brand on .${parsed.extension}`);
  if (meanings.length > 3) risks.push("Broad meaning can dilute outreach without segment-specific messaging");
  risks.push("Trademark and naming clearance should be completed before commercial use");
  if (parsed.extension !== "com") risks.push(`Some buyers may prefer the matching .com for defensive ownership`);

  const targetIndustries = dedupeIndustries(meanings).slice(0, 10);
  const lead = meanings[0];
  const idealBuyerProfile = lead
    ? `A growth-oriented ${lead.category.toLowerCase()} company that benefits from a concise, category-relevant digital identity.`
    : "A digital-first company seeking a concise and flexible brand.";

  return {
    strengths, weaknesses, opportunities, risks, idealBuyerProfile, targetIndustries,
    globalMarketSuitability: {
      score: scores.globalUsability,
      summary: scores.globalUsability >= 80
        ? "Strong international usability with low spelling and localization friction."
        : "Usable internationally, with positioning or pronunciation guidance recommended in some markets.",
    },
  };
}

function dedupeIndustries(meanings: SemanticMeaning[]) {
  const industries = new Map<string, SemanticMeaning["industries"][number]>();
  for (const meaning of meanings) for (const industry of meaning.industries) {
    const existing = industries.get(industry.slug);
    if (!existing || industry.relevance > existing.relevance) industries.set(industry.slug, industry);
  }
  return [...industries.values()].sort((a, b) => b.relevance - a.relevance);
}
