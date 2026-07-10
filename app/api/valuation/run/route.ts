import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { const body = await request.json() as { domainId?: string; refresh?: boolean }; if (!body.domainId) return Response.json({ error: "domainId is required" }, { status: 400 }); return Response.json({ valuation: await getIntelligenceService().runValuation(body.domainId, body.refresh) }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Valuation failed" }, { status: 500 }); } }
