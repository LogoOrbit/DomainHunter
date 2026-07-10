import { getResearchWorkspaceService } from "@/server/src/workspace/service";
export async function POST(request: Request) { const { companyIds } = await request.json() as { companyIds?: string[] }; if (!companyIds?.length) return Response.json({ error: "companyIds are required" }, { status: 400 }); return Response.json({ companies: await getResearchWorkspaceService().compare(companyIds) }); }
