import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";
import { parseResultFilters } from "@/server/src/lead-discovery/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { return Response.json({ results: await getLeadDiscoveryService().results((await params).id, parseResultFilters(new URL(request.url).searchParams)) }); } catch (error) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); } }
