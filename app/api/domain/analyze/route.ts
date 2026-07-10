import { getDomainIntelligenceService } from "@/server/src/domain-intelligence/factory";
import { DomainValidationError } from "@/server/src/domain-intelligence/errors";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || typeof (body as { domain?: unknown }).domain !== "string") {
      throw new DomainValidationError("Request body must include a domain string");
    }
    const { domain, refresh } = body as { domain: string; refresh?: unknown };
    if (refresh !== undefined && typeof refresh !== "boolean") throw new DomainValidationError("refresh must be a boolean");
    return Response.json(await getDomainIntelligenceService().analyze(domain, refresh ?? false));
  } catch (error) {
    const response = toErrorResponse(error);
    return Response.json(response.payload, { status: response.statusCode });
  }
}
