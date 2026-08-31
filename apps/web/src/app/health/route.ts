import { createRequestId } from "@/server/http/responses"

export const dynamic = "force-dynamic"

export function GET() {
  return Response.json({
    status: "ok",
    service: "project-ppk-web",
    version: "0.0.1",
    uptime: Math.round(process.uptime()),
    requestId: createRequestId(),
  })
}
