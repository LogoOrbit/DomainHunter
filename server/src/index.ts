import "./load-env.ts";
import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const config = loadConfig();
const app = buildApp({ logger: { level: config.logLevel } });

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  await app.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
