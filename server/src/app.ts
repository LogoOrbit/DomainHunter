import Fastify, { type FastifyInstance } from "fastify";
import { registerHealthRoutes } from "./routes/health.js";

export type BuildAppOptions = { logger?: boolean | { level: string } };

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: true,
  });

  app.register(registerHealthRoutes, { prefix: "/api/v1" });

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method} ${request.url} does not exist`,
      statusCode: 404,
    });
  });

  return app;
}
