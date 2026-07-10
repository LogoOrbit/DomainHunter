import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../server/dist/app.js";
import { DomainIntelligenceEngine } from "../server/dist/domain-intelligence/engine.js";
import { LexiconSemanticProvider } from "../server/dist/domain-intelligence/providers/lexicon-semantic-provider.js";
import { DomainIntelligenceService } from "../server/dist/domain-intelligence/service.js";
import { MemoryDomainRepository } from "./helpers/memory-repository.mjs";

function createApp() {
  return buildApp({ domainService: new DomainIntelligenceService(new MemoryDomainRepository(), new DomainIntelligenceEngine(new LexiconSemanticProvider())), leadService: false });
}

test("health endpoint reports a healthy API", async () => {
  const app = createApp();
  const response = await app.inject({ method: "GET", url: "/api/v1/health" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, "ok");
  await app.close();
});

test("domain API analyzes, caches, retrieves, lists, and deletes", async () => {
  const app = createApp();
  const first = await app.inject({ method: "POST", url: "/api/domain/analyze", payload: { domain: "https://IP.XYZ/path" } });
  assert.equal(first.statusCode, 200);
  assert.equal(first.json().analysis.parsed.domain, "ip.xyz");
  assert.equal(first.json().cached, false);
  assert.equal(first.json().analysis.semanticMeanings[0].phrase, "Internet Protocol");

  const second = await app.inject({ method: "POST", url: "/api/domain/analyze", payload: { domain: "ip.xyz" } });
  assert.equal(second.json().cached, true);
  const id = first.json().analysis.id;

  assert.equal((await app.inject({ method: "GET", url: `/api/domain/${id}` })).statusCode, 200);
  assert.equal((await app.inject({ method: "GET", url: "/api/domain/history" })).json().items.length, 1);
  assert.equal((await app.inject({ method: "DELETE", url: `/api/domain/${id}` })).statusCode, 204);
  assert.equal((await app.inject({ method: "GET", url: `/api/domain/${id}` })).statusCode, 404);
  await app.close();
});

test("domain API rejects invalid input", async () => {
  const app = createApp();
  const response = await app.inject({ method: "POST", url: "/api/domain/analyze", payload: { domain: "not a domain" } });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, "INVALID_DOMAIN");
  await app.close();
});
