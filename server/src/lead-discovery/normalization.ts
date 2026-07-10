import { parse } from "tldts";
import type { PublicCompanyRecord } from "./types.ts";

export function normalizeCompanyName(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/\b(incorporated|inc|llc|ltd|limited|corp|corporation|company|co)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizedWebsite(value: string | null): { website: string | null; domain: string | null } {
  if (!value) return { website: null, domain: null };
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol)) return { website: null, domain: null };
    url.hash = "";
    const parsed = parse(url.hostname, { allowPrivateDomains: false });
    return { website: url.toString().replace(/\/$/, ""), domain: parsed.domain?.toLowerCase() ?? null };
  } catch { return { website: null, domain: null }; }
}

export function dedupeKey(record: Pick<PublicCompanyRecord, "officialDomain" | "linkedinUrl" | "name">): string {
  if (record.officialDomain) return `domain:${record.officialDomain}`;
  if (record.linkedinUrl) return `linkedin:${record.linkedinUrl.toLowerCase().replace(/\/$/, "")}`;
  return `name:${normalizeCompanyName(record.name)}`;
}

export function extractKeywords(text: string | null, query: string): string[] {
  const stop = new Set(["and", "the", "for", "with", "from", "company", "platform", "software", "services"]);
  return [...new Set(`${text ?? ""} ${query}`.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [])].filter((word) => !stop.has(word)).slice(0, 20);
}

export function inferIndustry(description: string | null): string | null {
  const value = description?.toLowerCase() ?? "";
  if (/cyber|security|privacy/.test(value)) return "Cybersecurity";
  if (/cloud|hosting|infrastructure|network/.test(value)) return "Cloud Infrastructure";
  if (/legal|law|patent|trademark/.test(value)) return "Legal Technology";
  if (/finance|invest|fintech|payment/.test(value)) return "Financial Technology";
  if (/health|medical|clinical/.test(value)) return "Healthcare Technology";
  if (/artificial intelligence|machine learning|\bai\b/.test(value)) return "Artificial Intelligence";
  if (/developer|open source|software|technology/.test(value)) return "Software";
  return null;
}
