import { getResearchWorkspaceService } from "@/server/src/workspace/service";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return Response.json({ project: await getResearchWorkspaceService().updateProject(id, await request.json()) }); }
export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; return Response.json(await getResearchWorkspaceService().deleteProject(id)); }
