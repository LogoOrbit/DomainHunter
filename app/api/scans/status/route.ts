import { getContinuousDiscoveryService } from "@/server/src/continuous-discovery/service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return Response.json(await getContinuousDiscoveryService().status(new URL(request.url).searchParams.get("id") ?? undefined)); }
