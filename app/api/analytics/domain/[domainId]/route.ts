import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ domainId: string }> }) { const { domainId } = await context.params; return Response.json(await getIntelligenceService().analytics(domainId)); }
