export type AppConfig = {
  host: string;
  port: number;
  logLevel: string;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawPort = environment.PORT ?? "4000";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be a valid TCP port; received "${rawPort}"`);
  }

  return {
    host: environment.HOST ?? "127.0.0.1",
    port,
    logLevel: environment.LOG_LEVEL ?? "info",
  };
}
