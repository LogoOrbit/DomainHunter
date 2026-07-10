import { getPlatformService } from "@/server/src/platform/service";export async function GET(){return Response.json(await getPlatformService().appVersion())}
