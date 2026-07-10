import { getContinuousDiscoveryService } from "@/server/src/continuous-discovery/service";
export async function POST(request: Request) { const { scanId } = await request.json() as { scanId?: string }; if (!scanId) return Response.json({ error: "scanId is required" }, { status: 400 }); return Response.json({ scan: await getContinuousDiscoveryService().cancel(scanId) }); }
