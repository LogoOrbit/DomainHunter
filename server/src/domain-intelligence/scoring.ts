import type { DomainMetrics, DomainScores, ParsedDomain } from "./types.ts";

const TLD_VALUE: Record<string, number> = {
  com: 100, ai: 95, io: 90, co: 86, xyz: 82, app: 82, dev: 82, net: 78, org: 76,
};
const VOWELS = /[aeiouy]/;

export function calculateScores(parsed: ParsedDomain, metrics: DomainMetrics, meaningCount: number): DomainScores {
  const label = parsed.rootKeyword.replace(/-/g, "");
  const length = scoreLength(metrics.characterCount);
  const pronounceability = scorePronounceability(label, metrics);
  const clean = clamp(100 - metrics.hyphenCount * 22 - metrics.numberCount * 14);
  const tld = TLD_VALUE[parsed.extension] ?? 68;
  const memorability = clamp(length * 0.46 + pronounceability * 0.24 + clean * 0.3);
  const brandability = clamp(memorability * 0.42 + clean * 0.25 + tld * 0.2 + Math.min(meaningCount, 8) * 1.6);
  const seoFriendliness = clamp(clean * 0.38 + Math.min(metrics.wordCount, 3) * 12 + length * 0.3);
  const commercialPotential = clamp(brandability * 0.38 + tld * 0.32 + Math.min(meaningCount, 10) * 3);
  const globalUsability = clamp(pronounceability * 0.4 + clean * 0.35 + (isAscii(label) ? 25 : 12));
  const startupFriendliness = clamp(brandability * 0.48 + tld * 0.35 + length * 0.17);
  const premium = clamp(commercialPotential * 0.32 + brandability * 0.25 + memorability * 0.2 + tld * 0.23);

  return {
    pronounceability, memorability, brandability, length, seoFriendliness,
    commercialPotential, premium, globalUsability, startupFriendliness,
  };
}

function scoreLength(length: number): number {
  if (length <= 3) return 100;
  if (length <= 5) return 94;
  if (length <= 8) return 84;
  if (length <= 12) return 70;
  if (length <= 16) return 54;
  return clamp(45 - (length - 16) * 2);
}

function scorePronounceability(label: string, metrics: DomainMetrics): number {
  if (metrics.numberCount > 0 || label.length === 0) return clamp(55 - metrics.numberCount * 10);
  if (label.length <= 3) return 76;
  const vowelRatio = [...label].filter((character) => VOWELS.test(character)).length / label.length;
  const longestCluster = Math.max(...(label.match(/[^aeiouy]+/g)?.map((part) => part.length) ?? [0]));
  const ratioScore = 100 - Math.abs(vowelRatio - 0.42) * 140;
  return clamp(ratioScore - Math.max(0, longestCluster - 3) * 14);
}

function isAscii(value: string): boolean { return /^[a-z]+$/.test(value); }
function clamp(value: number): number { return Math.max(0, Math.min(100, Math.round(value))); }
