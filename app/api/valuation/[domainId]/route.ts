import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ domainId: string }> }) { const { domainId } = await context.params; const valuation = await getIntelligenceService().getValuation(domainId); return valuation ? Response.json({ valuation }) : Response.json({ error: "Valuation not found" }, { status: 404 }); }
