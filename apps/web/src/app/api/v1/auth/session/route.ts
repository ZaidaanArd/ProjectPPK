import type { SessionResponse } from "@workspace/contracts"

import { getCurrentUser } from "@/server/auth/session"
import { createRequestId, internalErrorResponse } from "@/server/http/responses"

export const dynamic = "force-dynamic"

export async function GET() {
  const requestId = createRequestId()

  try {
    const body: SessionResponse = { user: await getCurrentUser() }
    return Response.json(body, { headers: { "x-request-id": requestId } })
  } catch (error) {
    console.error("Failed to read session", error)
    return internalErrorResponse(requestId)
  }
}
