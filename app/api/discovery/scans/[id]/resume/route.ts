import { after } from "next/server";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const service = getLeadDiscoveryService(); const scan = await service.resume((await params).id); after(() => service.run(scan.id)); return Response.json({ scan }); } catch (error) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); } }
