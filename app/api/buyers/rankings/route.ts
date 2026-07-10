import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const domainId = new URL(request.url).searchParams.get("domainId"); if (!domainId) return Response.json({ error: "domainId is required" }, { status: 400 }); return Response.json({ rankings: await getIntelligenceService().rankBuyers(domainId) }); }
