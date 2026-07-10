import { getResearchWorkspaceService } from "@/server/src/workspace/service";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return Response.json({ lead: await getResearchWorkspaceService().updateLead(id, await request.json()) }); }
