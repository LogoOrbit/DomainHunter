import { after } from "next/server";
import { getContinuousDiscoveryService } from "@/server/src/continuous-discovery/service";
export const dynamic = "force-dynamic"; export const maxDuration = 300;
export async function POST(request: Request) { const body = await request.json() as { domainId?: string; priority?: number }; if (!body.domainId) return Response.json({ error: "domainId is required" }, { status: 400 }); const service = getContinuousDiscoveryService(); const scan = await service.start(body.domainId, body.priority); after(() => service.process(scan.id)); return Response.json({ scan }, { status: 202 }); }
