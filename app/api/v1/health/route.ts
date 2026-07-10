export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    service: "domainhunter-web",
    timestamp: new Date().toISOString(),
  });
}
