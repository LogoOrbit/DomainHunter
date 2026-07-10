import { getContinuousDiscoveryService } from "@/server/src/continuous-discovery/service"; export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ companyId: string }> }) { const { companyId } = await context.params; return Response.json({ changes: await getContinuousDiscoveryService().companyChanges(companyId) }); }
