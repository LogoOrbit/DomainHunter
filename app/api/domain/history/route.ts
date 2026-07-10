import { getDomainIntelligenceService } from "@/server/src/domain-intelligence/factory";
import { parsePageSize, toErrorResponse } from "@/server/src/domain-intelligence/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    return Response.json(await getDomainIntelligenceService().list(query.get("cursor") ?? undefined, parsePageSize(query.get("pageSize"))));
  } catch (error) {
    const response = toErrorResponse(error);
    return Response.json(response.payload, { status: response.statusCode });
  }
}
