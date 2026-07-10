import { DomainValidationError } from "@/server/src/domain-intelligence/errors";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { return Response.json({ company: await getLeadDiscoveryService().company((await params).id) }); } catch (error) { return failure(error); } }
export async function PATCH(request: Request, { params }: Context) { try { const body = await request.json() as { bookmarked?: unknown; notes?: unknown }; if (body.bookmarked !== undefined && typeof body.bookmarked !== "boolean") throw new DomainValidationError("bookmarked must be a boolean"); if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") throw new DomainValidationError("notes must be a string or null"); return Response.json({ company: await getLeadDiscoveryService().updateCompany((await params).id, body as { bookmarked?: boolean; notes?: string | null }) }); } catch (error) { return failure(error); } }
function failure(error: unknown) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); }
