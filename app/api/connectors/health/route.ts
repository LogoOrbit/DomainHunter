import { getContinuousDiscoveryService } from "@/server/src/continuous-discovery/service"; export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ health: await getContinuousDiscoveryService().health() }); }
