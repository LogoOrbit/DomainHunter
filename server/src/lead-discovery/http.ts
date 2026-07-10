import { DomainValidationError } from "../domain-intelligence/errors.ts";
import { parsePageSize } from "../domain-intelligence/http.ts";
import type { ResultFilters } from "./types.ts";

export function parseResultFilters(query: URLSearchParams | Record<string, string | undefined>): ResultFilters {
  const get = (key: string) => query instanceof URLSearchParams ? query.get(key) ?? undefined : query[key];
  return {
    search: clean(get("search")), country: clean(get("country")), industry: clean(get("industry")), companySize: clean(get("companySize")), fundingStage: clean(get("fundingStage")), keyword: clean(get("keyword")),
    minBuyerScore: optionalScore(get("minBuyerScore")), minConfidence: optionalScore(get("minConfidence")),
    sort: (["buyerScore", "confidence", "name", "collectedAt"].includes(get("sort") ?? "") ? get("sort") : "buyerScore") as ResultFilters["sort"],
    direction: get("direction") === "asc" ? "asc" : "desc", cursor: clean(get("cursor")), pageSize: parsePageSize(get("pageSize")),
  };
}

function clean(value: string | undefined): string | undefined { const result = value?.trim().slice(0, 200); return result || undefined; }
function optionalScore(value: string | undefined): number | undefined { if (!value) return undefined; const score = Number(value); if (!Number.isInteger(score) || score < 0 || score > 100) throw new DomainValidationError("Score filters must be integers from 0 to 100"); return score; }
