import type { FastifyPluginAsync } from "fastify";
import { parseResultFilters } from "../lead-discovery/http.ts";
import type { LeadDiscoveryService } from "../lead-discovery/service.ts";

type IdParams = { id: string };

export function createDiscoveryRoutes(service: LeadDiscoveryService): FastifyPluginAsync {
  return async (app) => {
    app.post<{ Body: { domainId: string } }>("/scans", { schema: { body: { type: "object", additionalProperties: false, required: ["domainId"], properties: { domainId: { type: "string", minLength: 1, maxLength: 64 } } } } }, async (request, reply) => {
      const scan = await service.start(request.body.domainId);
      queueMicrotask(() => void service.run(scan.id));
      return reply.code(202).send({ scan });
    });
    app.get<{ Params: IdParams }>("/scans/:id", async (request) => ({ scan: await service.getScan(request.params.id) }));
    app.post<{ Params: IdParams }>("/scans/:id/pause", async (request) => ({ scan: await service.pause(request.params.id) }));
    app.post<{ Params: IdParams }>("/scans/:id/resume", async (request) => { const scan = await service.resume(request.params.id); queueMicrotask(() => void service.run(scan.id)); return { scan }; });
    app.post<{ Params: IdParams }>("/scans/:id/cancel", async (request) => ({ scan: await service.cancel(request.params.id) }));
    app.get<{ Params: IdParams; Querystring: Record<string, string | undefined> }>("/scans/:id/results", async (request) => ({ results: await service.results(request.params.id, parseResultFilters(request.query)) }));
    app.get<{ Querystring: { domainId?: string } }>("/filters", async (request) => ({ filters: await service.listFilters(request.query.domainId) }));
    app.post<{ Body: { domainId?: string | null; name: string; filters: Record<string, string | number | undefined> } }>("/filters", async (request) => ({ filter: await service.saveFilter(request.body.domainId ?? null, request.body.name, { ...parseResultFilters(Object.fromEntries(Object.entries(request.body.filters).map(([key, value]) => [key, value === undefined ? undefined : String(value)]))), pageSize: 50 }) }));
  };
}

export function createCompanyRoutes(service: LeadDiscoveryService): FastifyPluginAsync {
  return async (app) => {
    app.get<{ Params: IdParams }>("/:id", async (request) => ({ company: await service.company(request.params.id) }));
    app.patch<{ Params: IdParams; Body: { bookmarked?: boolean; notes?: string | null } }>("/:id", {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            bookmarked: { type: "boolean" },
            notes: { anyOf: [{ type: "string", maxLength: 10_000 }, { type: "null" }] },
          },
        },
      },
    }, async (request) => ({ company: await service.updateCompany(request.params.id, request.body) }));
  };
}
