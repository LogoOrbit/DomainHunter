import assert from "node:assert/strict";
import test from "node:test";
import { parseDomainInput } from "../server/dist/domain-intelligence/domain-parser.js";
import { DomainIntelligenceEngine } from "../server/dist/domain-intelligence/engine.js";
import { LexiconSemanticProvider } from "../server/dist/domain-intelligence/providers/lexicon-semantic-provider.js";

test("parser normalizes URLs and resolves public suffixes", () => {
  const parsed = parseDomainInput(" HTTPS://Research.Example.CO.UK/path?q=1 ");
  assert.equal(parsed.domain, "example.co.uk");
  assert.equal(parsed.rootKeyword, "example");
  assert.equal(parsed.extension, "co.uk");
  assert.equal(parsed.subdomain, "research");
});

test("engine produces bounded scores and ranked semantic intelligence", async () => {
  const parsed = parseDomainInput("ip.xyz");
  const report = await new DomainIntelligenceEngine(new LexiconSemanticProvider()).analyze(parsed);
  assert.equal(report.semanticMeanings.length, 10);
  assert.equal(report.semanticMeanings[0].phrase, "Internet Protocol");
  assert.equal(report.semanticMeanings[0].industries[0].name, "Networking");
  assert.ok(Object.values(report.scores).every((score) => score >= 0 && score <= 100));
  assert.ok(report.quality.strengths.length > 0);
});
