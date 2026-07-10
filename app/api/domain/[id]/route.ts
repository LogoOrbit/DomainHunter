import { getDomainIntelligenceService } from "@/server/src/domain-intelligence/factory";
import { toErrorResponse } from "@/server/src/domain-intelligence/http";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return Response.json({ analysis: await getDomainIntelligenceService().get(id) });
  } catch (error) {
    const response = toErrorResponse(error);
    return Response.json(response.payload, { status: response.statusCode });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await getDomainIntelligenceService().delete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const response = toErrorResponse(error);
    return Response.json(response.payload, { status: response.statusCode });
  }
}
