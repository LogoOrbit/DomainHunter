import type { FastifyPluginAsync } from "fastify";
import { parsePageSize } from "../domain-intelligence/http.ts";
import type { DomainIntelligenceService } from "../domain-intelligence/service.ts";

type DomainParams = { id: string };
type AnalyzeBody = { domain: string; refresh?: boolean };
type HistoryQuery = { cursor?: string; pageSize?: string };

export function createDomainRoutes(service: DomainIntelligenceService): FastifyPluginAsync {
  return async (app) => {
    app.post<{ Body: AnalyzeBody }>("/analyze", {
      schema: { body: { type: "object", additionalProperties: false, required: ["domain"], properties: { domain: { type: "string", minLength: 1, maxLength: 2048 }, refresh: { type: "boolean" } } } },
    }, async (request, reply) => reply.code(200).send(await service.analyze(request.body.domain, request.body.refresh ?? false)));

    app.get<{ Params: DomainParams }>("/:id", {
      schema: { params: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "string", minLength: 1, maxLength: 64 } } } },
    }, async (request) => ({ analysis: await service.get(request.params.id) }));

    app.get<{ Querystring: HistoryQuery }>("/history", {
      schema: { querystring: { type: "object", additionalProperties: false, properties: { cursor: { type: "string", maxLength: 64 }, pageSize: { type: "string", pattern: "^[0-9]+$" } } } },
    }, async (request) => service.list(request.query.cursor, parsePageSize(request.query.pageSize)));

    app.delete<{ Params: DomainParams }>("/:id", async (request, reply) => {
      await service.delete(request.params.id);
      return reply.code(204).send();
    });
  };
}
