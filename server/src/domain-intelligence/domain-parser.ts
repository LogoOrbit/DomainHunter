import { domainToUnicode } from "node:url";
import { parse } from "tldts";
import { DomainValidationError } from "./errors.ts";
import type { DomainMetrics, ParsedDomain } from "./types.ts";

const DOMAIN_INPUT_LIMIT = 2_048;

export function parseDomainInput(input: string): ParsedDomain {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new DomainValidationError("Domain is required");
  }
  if (input.length > DOMAIN_INPUT_LIMIT) {
    throw new DomainValidationError("Domain input is too long");
  }

  const candidate = input.trim().toLowerCase();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  let hostname: string;

  try {
    hostname = new URL(withProtocol).hostname.replace(/\.$/, "");
  } catch {
    throw new DomainValidationError("Enter a valid public domain, such as ip.xyz");
  }

  const result = parse(hostname, { allowPrivateDomains: false, validateHostname: true });
  if (!result.domain || !result.domainWithoutSuffix || !result.publicSuffix || result.isIp) {
    throw new DomainValidationError("Enter a registrable public domain with a valid extension");
  }

  const rootKeyword = result.domainWithoutSuffix.toLowerCase();
  const rootKeywords = rootKeyword.split(/[-_]+/).filter(Boolean);

  return {
    domain: result.domain.toLowerCase(),
    unicodeDomain: domainToUnicode(result.domain.toLowerCase()),
    rootKeyword,
    rootKeywords,
    extension: result.publicSuffix.toLowerCase(),
    subdomain: result.subdomain || null,
  };
}

export function calculateMetrics(parsed: ParsedDomain): DomainMetrics {
  const label = parsed.rootKeyword;
  return {
    characterCount: label.length,
    wordCount: parsed.rootKeywords.length,
    hyphenCount: countMatches(label, /-/g),
    numberCount: countMatches(label, /\d/g),
    letterCount: countMatches(label, /[a-z]/g),
  };
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}
