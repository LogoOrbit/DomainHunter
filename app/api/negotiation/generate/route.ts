import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { const body = await request.json() as { domainId?: string }; if (!body.domainId) return Response.json({ error: "domainId is required" }, { status: 400 }); return Response.json({ plan: await getIntelligenceService().generateNegotiation(body.domainId) }); }
