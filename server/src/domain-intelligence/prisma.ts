import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { domainHunterPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for domain intelligence persistence");
  const client = globalForPrisma.domainHunterPrisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.domainHunterPrisma = client;
  return client;
}
