import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";
export const dynamic = "force-dynamic";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { return Response.json({ scan: await getLeadDiscoveryService().pause((await params).id) }); } catch (error) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); } }
