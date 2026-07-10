import Fastify, { type FastifyInstance } from "fastify";
import { registerHealthRoutes } from "./routes/health.ts";
import { getDomainIntelligenceService } from "./domain-intelligence/factory.ts";
import { toErrorResponse } from "./domain-intelligence/http.ts";
import type { DomainIntelligenceService } from "./domain-intelligence/service.ts";
import { createDomainRoutes } from "./routes/domains.ts";
import { getLeadDiscoveryService } from "./lead-discovery/factory.ts";
import type { LeadDiscoveryService } from "./lead-discovery/service.ts";
import { createCompanyRoutes, createDiscoveryRoutes } from "./routes/discovery.ts";

export type BuildAppOptions = { logger?: boolean | { level: string }; domainService?: DomainIntelligenceService; leadService?: LeadDiscoveryService | false };

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: true,
  });

  app.register(registerHealthRoutes, { prefix: "/api/v1" });
  app.register(createDomainRoutes(options.domainService ?? getDomainIntelligenceService()), { prefix: "/api/domain" });
  if (options.leadService !== false) {
    const leadService = options.leadService ?? getLeadDiscoveryService();
    app.register(createDiscoveryRoutes(leadService), { prefix: "/api/discovery" });
    app.register(createCompanyRoutes(leadService), { prefix: "/api/companies" });
  }

  app.setErrorHandler((error, request, reply) => {
    const response = toErrorResponse(error);
    if (response.statusCode >= 500) request.log.error(error);
    return reply.code(response.statusCode).send(response.payload);
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method} ${request.url} does not exist`,
      statusCode: 404,
    });
  });

  return app;
}
