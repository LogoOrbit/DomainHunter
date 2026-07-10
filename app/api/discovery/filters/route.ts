import { DomainValidationError } from "@/server/src/domain-intelligence/errors";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";
import { parseResultFilters } from "@/server/src/lead-discovery/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { return Response.json({ filters: await getLeadDiscoveryService().listFilters(new URL(request.url).searchParams.get("domainId") ?? undefined) }); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { const body = await request.json() as { domainId?: unknown; name?: unknown; filters?: unknown }; if (typeof body.name !== "string" || !body.filters || typeof body.filters !== "object") throw new DomainValidationError("name and filters are required"); const query = new URLSearchParams(Object.entries(body.filters as Record<string, unknown>).filter(([, value]) => value !== "" && value !== undefined).map(([key, value]) => [key, String(value)])); return Response.json({ filter: await getLeadDiscoveryService().saveFilter(typeof body.domainId === "string" ? body.domainId : null, body.name, parseResultFilters(query)) }, { status: 201 }); } catch (error) { return failure(error); } }
function failure(error: unknown) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); }
