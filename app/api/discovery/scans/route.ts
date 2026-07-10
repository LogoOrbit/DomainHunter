import { after } from "next/server";
import { DomainValidationError } from "@/server/src/domain-intelligence/errors";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";
import { getLeadDiscoveryService } from "@/server/src/lead-discovery/factory";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { domainId?: unknown };
    if (typeof body.domainId !== "string") throw new DomainValidationError("domainId is required");
    const service = getLeadDiscoveryService();
    const scan = await service.start(body.domainId);
    after(() => service.run(scan.id));
    return Response.json({ scan }, { status: 202 });
  } catch (error) { return errorResponse(error); }
}

function errorResponse(error: unknown) { const response = toErrorResponse(error); return Response.json(response.payload, { status: response.statusCode }); }
