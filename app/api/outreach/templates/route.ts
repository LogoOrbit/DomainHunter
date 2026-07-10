import { getIntelligenceService } from "@/server/src/intelligence/service";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ templates: await getIntelligenceService().listTemplates() }); }
